import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, 
  Dimensions, Animated, ActivityIndicator, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../../components/Skeleton';

const { width, height } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#FF9800', bg: '#FF980015', icon: 'time-outline' },
  approved:  { label: 'Approved',  color: '#2196F3', bg: '#2196F315', icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparing', color: '#9C27B0', bg: '#9C27B015', icon: 'restaurant-outline' },
  ready:     { label: 'Ready',     color: '#4CAF50', bg: '#4CAF5015', icon: 'notifications-outline' },
  delivered: { label: 'Delivered', color: '#4CAF50', bg: '#4CAF5015', icon: 'checkbox-outline' },
  rejected:  { label: 'Rejected',  color: '#FF5252', bg: '#FF525215', icon: 'close-circle-outline' }
};

export default function OrderHistoryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratedOrders, setRatedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchOrders();
    fetchRatedOrders();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchOrders = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      const res = await api.get(`/orders/user/${id}`);
      setOrders(res.data);
    } catch (err) { console.log('Fetch Orders Error:', err); }
    finally { setLoading(false); }
  };

  const fetchRatedOrders = async () => {
    try {
      const res = await api.get('/orders/feedback/all');
      setRatedOrders(res.data.map(f => f.order_id));
    } catch (err) { console.log('Fetch Rated Error:', err); }
  };

  const filteredOrders = orders.filter(o => 
    !searchQuery || o.order_id.toString().includes(searchQuery.toLowerCase())
  );

  const renderBackground = () => (
    <View style={StyleSheet.absoluteFill}>
       <View style={[styles.bgBase, { backgroundColor: isDark ? '#0F0F12' : '#F8FAFC' }]} />
       {isDark && (
         <>
           <Animated.View style={[
             styles.orb, 
             { 
               backgroundColor: '#FF572210', 
               top: 100, left: -100, width: 300, height: 300,
               transform: [{ translateX: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }]
             }
           ]} />
           <Animated.View style={[
             styles.orb, 
             { 
               backgroundColor: '#2196F308', 
               bottom: 200, right: -100, width: 400, height: 400,
               transform: [{ translateY: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }]
             }
           ]} />
         </>
       )}
    </View>
  );

  const Header = () => (
    <LinearGradient 
      colors={['#FF5722', '#F4511E']} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }} 
      style={styles.header}
    >
       <SafeAreaView>
          <View style={styles.headerTop}>
             <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                   <Ionicons name="chevron-back" size={22} color="#FFF" />
                </BlurView>
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Order Archives</Text>
             <View style={{ width: 44 }} />
          </View>
          
          <View style={styles.searchWrap}>
             <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Reference Order ID..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
             </BlurView>
          </View>
       </SafeAreaView>
    </LinearGradient>
  );

  const renderOrderItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || { label: item.status, color: '#666', bg: '#66615', icon: 'help-circle-outline' };
    const date = new Date(item.created_at);
    const isActive = ['pending','approved','preparing','ready'].includes(item.status);
    
    return (
      <Animated.View style={[styles.orderCard, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => isActive && navigation.navigate('OrderTrack', { order_id: item.order_id })}
        >
          <View style={styles.cardHeader}>
             <View>
                <Text style={styles.orderIdText}>TRANSACTION #MS-{item.order_id}</Text>
                <Text style={styles.dateText}>
                   {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
             </View>
             <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={12} color={config.color} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardBody}>
             <View style={styles.itemsPreview}>
                {item.items?.map((it, idx) => (
                  <View key={idx} style={styles.itemRow}>
                     <View style={styles.qtyIndicator}><Text style={styles.qtyText}>{it.quantity}</Text></View>
                     <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                  </View>
                ))}
             </View>
             <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>SETTLED</Text>
                <Text style={styles.amountText}>₹{item.total_amount}</Text>
                <View style={styles.slotTag}>
                   <Text style={styles.slotText}>{item.meal_slot?.toUpperCase()}</Text>
                </View>
             </View>
          </View>

          <View style={styles.cardFooter}>
             {item.status === 'delivered' && !ratedOrders.includes(item.order_id) ? (
               <TouchableOpacity 
                 style={styles.reviewBtn}
                 onPress={() => navigation.navigate('Feedback', { order_id: item.order_id, total_amount: item.total_amount })}
               >
                 <LinearGradient colors={['#FFD700', '#FFA000']} style={styles.reviewIn}>
                    <Ionicons name="star" size={14} color="#FFF" />
                    <Text style={styles.reviewBtnText}>Rate Experience</Text>
                 </LinearGradient>
               </TouchableOpacity>
             ) : item.status === 'delivered' ? (
               <View style={styles.completionNote}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#4CAF50" />
                  <Text style={styles.completionText}>Review Submitted • Archive Secure</Text>
               </View>
             ) : isActive ? (
               <View style={styles.activeHint}>
                  <View style={[styles.pulseDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.activeStatusHint, { color: config.color }]}>Live Tracking Active</Text>
                  <Ionicons name="chevron-forward" size={12} color={config.color} />
               </View>
             ) : (
                <Text style={styles.voidText}>Transaction Finalized</Text>
             )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}
      <Header />

      {loading ? (
        <View style={styles.loadingWrap}>
           {[1,2,3,4].map(i => (
             <View key={i} style={styles.skeletonCard}>
                <Skeleton width="100%" height={160} borderRadius={28} />
             </View>
           ))}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.order_id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <BlurView intensity={20} tint="light" style={styles.emptyIconBox}>
                  <Ionicons name="receipt-outline" size={50} color={isDark ? '#444' : '#CCC'} />
               </BlurView>
               <Text style={styles.emptyTitle}>Archives Empty</Text>
               <Text style={styles.emptySub}>No transaction records found for your account.</Text>
               <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.goBack()}>
                  <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.exploreIn}>
                     <Text style={styles.exploreText}>Explore Menu</Text>
                  </LinearGradient>
               </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgBase: { ...StyleSheet.absoluteFillObject },
  orb: { position: 'absolute', borderRadius: 200, opacity: 0.4 },
  
  header: { paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  
  searchWrap: { paddingHorizontal: 20, marginTop: 25 },
  searchBlur: { flexDirection: 'row', alignItems: 'center', height: 55, borderRadius: 18, paddingHorizontal: 15, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, marginLeft: 12, color: '#FFF', fontSize: 14, fontWeight: '600' },

  listContent: { padding: 20, paddingBottom: 100 },
  orderCard: { 
    backgroundColor: colors.card, 
    borderRadius: 30, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderIdText: { fontSize: 10, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1.2 },
  dateText: { fontSize: 13, color: colors.text, fontWeight: '800', marginTop: 4 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', marginVertical: 18 },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsPreview: { flex: 1, marginRight: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qtyIndicator: { backgroundColor: colors.primary + '15', width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  qtyText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  itemName: { fontSize: 14, color: colors.text, fontWeight: '700' },
  
  amountBox: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 8, fontWeight: '900', color: '#4CAF50', letterSpacing: 1 },
  amountText: { fontSize: 22, fontWeight: '900', color: colors.text },
  slotTag: { backgroundColor: isDark ? '#111' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  slotText: { fontSize: 9, fontWeight: '900', color: colors.textSecondary, letterSpacing: 0.5 },

  cardFooter: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' },
  reviewBtn: { borderRadius: 15, overflow: 'hidden' },
  reviewIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  reviewBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  
  completionNote: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  completionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  
  activeHint: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  activeStatusHint: { fontSize: 12, fontWeight: '900' },
  voidText: { textAlign: 'center', fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 },

  loadingWrap: { padding: 20 },
  skeletonCard: { marginBottom: 16 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 10, marginBottom: 35, lineHeight: 22 },
  exploreBtn: { width: '80%', borderRadius: 20, overflow: 'hidden' },
  exploreIn: { paddingVertical: 18, alignItems: 'center' },
  exploreText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }
});
