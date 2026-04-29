import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl, 
  TextInput,
  StatusBar,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../../components/Skeleton';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending: { color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)', label: 'Pending' },
  approved: { color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)', label: 'Approved' },
  preparing: { color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.1)', label: 'Preparing' },
  ready: { color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)', label: 'Ready' },
  delivered: { color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)', label: 'Delivered' },
  cancelled: { color: '#F44336', bg: 'rgba(244, 67, 54, 0.1)', label: 'Cancelled' },
  rejected: { color: '#F44336', bg: 'rgba(244, 67, 54, 0.1)', label: 'Rejected' },
};

const OrderCard = ({ item, index }) => {
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  
  // Robust Item Parsing
  let items = [];
  try {
    items = Array.isArray(item.items) ? item.items : JSON.parse(item.items || '[]');
  } catch (e) {
    items = [];
  }

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(500)}
      style={styles.cardWrapper}
    >
      <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
             <Text style={[styles.statusText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
          </View>
          <Text style={styles.orderId}>#{item.order_id || '0000'}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.mainInfo}>
            <Text style={styles.slotText}>{item.meal_slot?.toUpperCase() || 'UNKNOWN'}</Text>
            <View style={styles.itemsList}>
              {items.map((it, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  {it.quantity}x <Text style={{ color: '#FFF' }}>{it.name}</Text>
                </Text>
              ))}
            </View>
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.amount}>{parseFloat(item.total_amount || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.timestamp}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }) : 'Historical Record'}
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

export default function StudentOrderHistoryScreen({ route, navigation }) {
  const { user_id, name } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders/user/${user_id}`);
      setOrders(res.data);
    } catch (err) { 
      console.log(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders.filter(o => 
    !searchQuery || (o.order_id && o.order_id.toString().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0F12', '#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
           <LinearGradient 
              colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.1)', 'transparent']} 
              style={styles.headerMesh} 
            />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                <Text style={styles.backIcon}>‹</Text>
            </BlurView>
          </TouchableOpacity>
          <View style={styles.titleArea}>
            <Text style={styles.subtitle}>HISTORY LOGS: {name?.toUpperCase() || 'STUDENT'}</Text>
            <Text style={styles.title}>Operation Archive</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredOrders.length}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <BlurView intensity={10} tint="dark" style={styles.searchBlur}>
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.3)" />
            <TextInput
              placeholder="Search historical IDs..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType="numeric"
            />
          </BlurView>
        </View>

        {loading ? (
          <View style={{ padding: 20 }}>
            {[1, 2, 3].map(i => <View key={i} style={styles.skeletonCard} />)}
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => (item.order_id || Math.random()).toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <OrderCard item={item} index={index} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={60} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>Empty Registry</Text>
                <Text style={styles.emptySubText}>No tactical orders found for this profile.</Text>
              </View>
            }
          />
        )}
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
  backButton: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  backIcon: { fontSize: 32, color: '#FFF', fontWeight: '200', marginTop: -4 },
  titleArea: { alignItems: 'center' },
  subtitle: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  countBadge: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  countText: { color: '#FF5722', fontWeight: '900', fontSize: 16 },

  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBlur: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 50, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  searchInput: { flex: 1, marginLeft: 12, color: '#FFF', fontSize: 14, fontWeight: '600' },

  listContent: { paddingHorizontal: 20, paddingBottom: 60 },
  cardWrapper: { marginBottom: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardBlur: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900' },
  orderId: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.2)' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mainInfo: { flex: 1 },
  slotText: { fontSize: 10, fontWeight: '900', color: '#FF5722', marginBottom: 8, letterSpacing: 1 },
  itemsList: { gap: 4 },
  itemLine: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  priceInfo: { alignItems: 'flex-end' },
  currency: { fontSize: 12, fontWeight: '900', color: '#FF5722' },
  amount: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: -4 },

  cardFooter: { marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  timestamp: { fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: '700' },

  skeletonCard: { height: 160, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, marginBottom: 16 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptySubText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' }
});

