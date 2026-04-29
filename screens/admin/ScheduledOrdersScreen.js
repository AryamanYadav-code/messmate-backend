import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, 
  RefreshControl, Dimensions, Animated, 
  StatusBar as RNStatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const SLOT_CONFIG = {
  breakfast: { icon: '🌅', color: '#FFD54F' },
  lunch: { icon: '☀️', color: '#64B5F6' },
  dinner: { icon: '🌙', color: '#BA68C8' },
  snacks: { icon: '🍿', color: '#FF8A65' }
};

export default function ScheduledOrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/admin/scheduled');
      setOrders(res.data);
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const approveOrder = async (order_id) => {
    try {
      await api.put(`/orders/${order_id}/status`, { status: 'approved' });
      fetchOrders();
    } catch (err) { Alert.alert('Error', 'Could not approve order'); }
  };

  const rejectOrder = (order_id) => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this scheduled order? The wallet will be automatically refunded.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reject", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/orders/${order_id}/cancel`);
              Alert.alert('Success', 'Order has been rejected and refunded');
              fetchOrders();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Could not reject order');
            }
          }
        }
      ]
    );
  };

  const groupByDate = () => {
    const groups = {};
    orders.forEach(order => {
      const date = order.scheduled_date?.split('T')[0] || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return Object.entries(groups).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  };

  const renderOrder = (order) => {
    const slot = SLOT_CONFIG[order.meal_slot] || { icon: '🍴', color: '#FFF' };
    
    return (
      <View key={order.order_id} style={styles.orderTile}>
        <BlurView intensity={20} tint="dark" style={styles.tileBlur}>
          <View style={styles.tileHeader}>
            <View style={[styles.slotMini, { backgroundColor: slot.color + '15' }]}>
               <Text style={[styles.slotIconMini]}>{slot.icon}</Text>
            </View>
            <Text style={styles.orderIdMini}>#{order.order_id}</Text>
          </View>

          <View style={styles.tileBody}>
            <Text style={styles.studentNameMini} numberOfLines={1}>{order.name}</Text>
            
            <View style={styles.itemsSummary}>
               {order.items?.slice(0, 2).map((it, idx) => (
                 <Text key={idx} style={styles.itemTextMini} numberOfLines={1}>
                   {it.quantity}x {it.name}
                 </Text>
               ))}
               {order.items?.length > 2 && (
                 <Text style={styles.moreItemsText}>+{order.items.length - 2} more</Text>
               )}
            </View>
          </View>

          <View style={styles.tileFooter}>
            <Text style={styles.amountMini}>₹{order.total_amount}</Text>
            <View style={styles.miniActions}>
               <TouchableOpacity 
                 style={styles.miniBtnReject} 
                 onPress={() => rejectOrder(order.order_id)}
               >
                 <Ionicons name="close" size={14} color="#FF5252" />
               </TouchableOpacity>
               <TouchableOpacity 
                 style={styles.miniBtnApprove}
                 onPress={() => approveOrder(order.order_id)}
               >
                 <Ionicons name="checkmark" size={14} color="#FFF" />
               </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <RNStatusBar barStyle="light-content" />
      <LinearGradient colors={['#1F1F2E', '#0F0F12']} style={StyleSheet.absoluteFill} />

      <View style={[styles.meshHeader, { paddingTop: insets.top }]}>
        <LinearGradient 
          colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']} 
          style={styles.headerMesh} 
        />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
             <BlurView intensity={20} tint="dark" style={styles.blurBtn}>
                <Ionicons name="chevron-back" size={20} color="#FFF" />
             </BlurView>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
             <Text style={styles.headerSubtitle}>TEMPORAL REGISTRY</Text>
             <Text style={styles.headerTitle}>Pre-Orders</Text>
          </View>
          <View style={styles.countBadge}>
             <Text style={styles.countText}>{orders.length}</Text>
          </View>
        </View>
      </View>

      <Animated.FlatList
        data={groupByDate()}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.listBody}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#BA68C8" />
        }
        renderItem={({ item: [date, dateOrders] }) => (
          <View style={styles.dateGroup}>
            <View style={styles.dateHeader}>
               <BlurView intensity={10} tint="dark" style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#FF5722" />
                  <Text style={styles.dateText}>{new Date(date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', weekday: 'short'
                  }).toUpperCase()}</Text>
               </BlurView>
               <View style={styles.dateLine} />
               <Text style={styles.dateCount}>{dateOrders.length} TASKS</Text>
            </View>
            <View style={styles.gridContainer}>
              {dateOrders.map(order => renderOrder(order))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
             <Ionicons name="calendar-outline" size={80} color="rgba(255,255,255,0.05)" />
             <Text style={styles.emptyTitle}>Registry Clear</Text>
             <Text style={styles.emptySub}>No upcoming scheduled operations detected.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  meshHeader: { paddingBottom: 15, position: 'relative', overflow: 'hidden' },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerSubtitle: { color: '#FF5722', fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 87, 34, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 87, 34, 0.2)' },
  countText: { color: '#FF5722', fontSize: 16, fontWeight: '900' },

  listBody: { paddingHorizontal: 16, paddingBottom: 100 },
  dateGroup: { marginBottom: 30 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dateLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  dateCount: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  orderTile: { width: (width - 48) / 2, marginBottom: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 200, justifyContent: 'space-between' },
  tileBlur: { flex: 1, padding: 12, justifyContent: 'space-between' },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotMini: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  slotIconMini: { fontSize: 14 },
  orderIdMini: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 },

  tileBody: { flex: 1, marginTop: 12 },
  studentNameMini: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  itemsSummary: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 8, flex: 1 },
  itemTextMini: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  moreItemsText: { fontSize: 9, color: '#FF5722', fontWeight: '800', marginTop: 2 },

  tileFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  amountMini: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  miniActions: { flexDirection: 'row', gap: 6 },
  miniBtnReject: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255, 82, 82, 0.1)', justifyContent: 'center', alignItems: 'center' },
  miniBtnApprove: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginTop: 20 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10, paddingHorizontal: 40, lineHeight: 20 }
});
