import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  Layout,
  SlideInRight
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const FeedbackCard = ({ item, index }) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(500)}
      style={{ width: (width - 48) / 2, marginBottom: 16 }}
    >
      <BlurView intensity={15} tint="dark" style={styles.feedbackCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarTextMini}>{item.student_name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.ratingMini}>
            <Text style={styles.ratingValue}>{item.rating}</Text>
            <Text style={styles.starMini}>★</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.studentNameMini} numberOfLines={1}>{item.student_name}</Text>
          <Text style={styles.dateMini}>{new Date(item.created_at).toLocaleDateString()}</Text>
          
          <View style={styles.commentBox}>
            <Text style={styles.commentText} numberOfLines={3}>
              {item.review_text || "No written review provided."}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.orderIdMini}>#{item.order_id}</Text>
          <Text style={styles.amountMini}>₹{item.total_amount}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

export default function FeedbackViewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [feedback, setFeedback] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/orders/feedback/all');
      setFeedback(res.data);
      if (res.data.length > 0) {
        const avg = res.data.reduce((sum, f) => sum + f.rating, 0) / res.data.length;
        setAvgRating(avg.toFixed(1));
      }
    } catch (err) { console.log(err); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeedback();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />

      <View style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <LinearGradient 
            colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']} 
            style={styles.headerMesh} 
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>SIGNAL INTELLIGENCE</Text>
            <Text style={styles.headerTitle}>User Sentiments</Text>
          </View>
          <View style={styles.statsSmall}>
             <Text style={styles.statsValue}>{avgRating}</Text>
             <Text style={styles.statsLabel}>AVG</Text>
          </View>
        </View>

        <FlatList
          data={feedback}
          keyExtractor={item => item.feedback_id.toString()}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
          }
          ListHeaderComponent={
            <View style={styles.summaryGrid}>
               <BlurView intensity={25} tint="dark" style={styles.summaryTile}>
                  <Text style={styles.summaryLabel}>TOTAL REVIEWS</Text>
                  <Text style={styles.summaryValue}>{feedback.length}</Text>
               </BlurView>
            </View>
          }
          renderItem={({ item, index }) => (
            <FeedbackCard item={item} index={index} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyText}>Quiet Sector</Text>
              <Text style={styles.emptySub}>No feedback transmissions detected.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    zIndex: 10
  },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 28, color: '#FFF', marginLeft: -2 },
  headerTitleContainer: { alignItems: 'center' },
  headerSubtitle: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  statsSmall: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 87, 34, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 87, 34, 0.2)' },
  statsValue: { color: '#FF5722', fontSize: 14, fontWeight: '900' },
  statsLabel: { color: '#FF5722', fontSize: 7, fontWeight: '900', marginTop: -2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  summaryGrid: { marginBottom: 20 },
  summaryTile: { padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 },
  summaryValue: { fontSize: 32, fontWeight: '900', color: '#FFF', marginTop: 4 },

  feedbackCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 200, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  avatarMini: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  avatarTextMini: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  ratingMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingValue: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginRight: 2 },
  starMini: { color: '#FFD700', fontSize: 10 },

  cardBody: { paddingHorizontal: 12, flex: 1 },
  studentNameMini: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  dateMini: { fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2, fontWeight: '600' },
  commentBox: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 8, flex: 1 },
  commentText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 15 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' },
  orderIdMini: { fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: '900', letterSpacing: 0.5 },
  amountMini: { fontSize: 13, fontWeight: '800', color: '#4ADE80' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, opacity: 0.2, marginBottom: 20 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '800' },
  emptySub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }
});
