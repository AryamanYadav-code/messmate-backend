import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  SafeAreaView, RefreshControl, Modal, TextInput, Dimensions, Animated, ActivityIndicator,
  StatusBar as RNStatusBar, ScrollView
} from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending: { color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)', label: 'Pending', icon: 'time-outline' },
  approved: { color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)', label: 'Approved', icon: 'shield-checkmark-outline' },
  preparing: { color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.1)', label: 'Preparing', icon: 'restaurant-outline' },
  ready: { color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)', label: 'Ready', icon: 'notifications-outline' },
};

const NEXT_ACTION = {
  pending: { label: 'AUTHENTICATE', next: 'approved', color: '#2196F3', icon: 'shield-checkmark-outline' },
  approved: { label: 'BEGIN PREP', next: 'preparing', color: '#9C27B0', icon: 'flame-outline' },
  preparing: { label: 'SIGNAL READY', next: 'ready', color: '#4CAF50', icon: 'megaphone-outline' },
};

export default function OrderQueueScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectModal, setCollectModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/admin/pending');
      setOrders(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateStatus = async (order_id, status) => {
    try {
      await api.put(`/orders/${order_id}/status`, { status });
      fetchOrders();
    } catch (err) { Alert.alert('Comm Error', 'Status sync failed'); }
  };

  const rejectOrder = (order_id) => {
    Alert.alert(
      "Void Transaction",
      "Rejecting this order will trigger a mandatory wallet refund. Proceed?",
      [
        { text: "Abort", style: "cancel" },
        {
          text: "Void Order", style: "destructive", onPress: async () => {
            try {
              await api.delete(`/orders/${order_id}/cancel`);
              fetchOrders();
            } catch (err) { Alert.alert('Error', 'Could not void order'); }
          }
        }
      ]
    );
  };

  const openCollectModal = (order) => {
    setSelectedOrder(order);
    setEnteredCode('');
    setCollectModal(true);
  };

  const verifyAndCollect = async () => {
    if (!enteredCode || enteredCode.length !== 6) return Alert.alert('Invalid', 'Enter 6-digit credential');
    setVerifying(true);
    try {
      const res = await api.post('/orders/verify-code', { pickup_code: enteredCode });
      if (res.data.order_id !== selectedOrder.order_id) {
        setVerifying(false);
        return Alert.alert('Mismatch', 'Credential belongs to another order.');
      }
      await api.put(`/orders/${selectedOrder.order_id}/status`, { status: 'delivered' });
      setCollectModal(false);
      fetchOrders();
    } catch (err) {
      Alert.alert('Auth Failed', 'Credential verification rejected.');
    } finally { setVerifying(false); }
  };

  const FILTERS = ['all', 'pending', 'approved', 'preparing', 'ready'];
  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || o.order_id.toString().includes(q) || (o.name && o.name.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const renderOrder = ({ item, index }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const action = NEXT_ACTION[item.status];
    const cardWidth = (width - 44) / 2;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).duration(500)}
        style={{ width: cardWidth, marginBottom: 12, marginRight: index % 2 === 0 ? 12 : 0 }}
      >
        <BlurView intensity={20} tint="dark" style={styles.orderCard}>
          <View style={styles.cardHeader}>
             <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={10} color={config.color} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
             </View>
             <Text style={styles.orderId}>#{item.order_id}</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.itemSummary}>
               {item.items && item.items.slice(0, 2).map((it, idx) => (
                 <Text key={idx} style={styles.itemText} numberOfLines={1}>
                   {it.quantity}x {it.name}
                 </Text>
               ))}
               {item.items && item.items.length > 2 && (
                 <Text style={styles.moreItems}>+{item.items.length - 2} more</Text>
               )}
            </View>
          </View>

          <View style={styles.cardFooter}>
             <Text style={styles.orderAmount}>₹{item.total_amount}</Text>
             <Text style={styles.slotText}>{item.meal_slot}</Text>
          </View>

          <View style={styles.actionSection}>
            {action ? (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: action.color }]}
                onPress={() => updateStatus(item.order_id, action.next)}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ) : item.status === 'ready' ? (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: '#4CAF50' }]}
                onPress={() => openCollectModal(item)}
              >
                <Text style={styles.actionLabel}>SECURE PICKUP</Text>
              </TouchableOpacity>
            ) : null}
            
            {(item.status === 'pending' || item.status === 'approved') && (
               <TouchableOpacity 
                style={styles.rejectMini}
                onPress={() => rejectOrder(item.order_id)}
              >
                <Ionicons name="trash-outline" size={14} color="#FF5252" />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <RNStatusBar barStyle="light-content" />
      <LinearGradient colors={['#1F1F2E', '#0F0F12']} style={StyleSheet.absoluteFill} />

      <View style={styles.meshHeader}>
        <LinearGradient
          colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']}
          style={styles.meshGradient}
        />
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <BlurView intensity={20} tint="dark" style={styles.blurBtn}>
                <Ionicons name="chevron-back" size={20} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerSubtitle}>COMMAND PIPELINE</Text>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>Order Queue</Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.searchWrap}>
            <BlurView intensity={15} tint="dark" style={styles.searchBlur}>
              <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by Order ID or Student..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.order_id.toString()}
        renderItem={renderOrder}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.listBody}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-outline" size={80} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyTitle}>Queue Optimized</Text>
            <Text style={styles.emptySub}>Pipeline is currently clear with no pending operations.</Text>
          </View>
        }
      />

      <Modal visible={collectModal} transparent animationType="slide">
        <BlurView intensity={80} tint="dark" style={styles.modalBack}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Authentication Hub</Text>
            <Text style={styles.modalSub}>Secure credential entry for pickup authorization.</Text>

            <View style={styles.modalCard}>
              <Text style={styles.mcName}>{selectedOrder?.name}</Text>
              <Text style={styles.mcId}>TRANSACTION #MS-{selectedOrder?.order_id}</Text>
            </View>

            <TextInput
              style={styles.mcInput}
              placeholder="000 000"
              placeholderTextColor="rgba(255,255,255,0.1)"
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCollectModal(false)}>
                <Text style={styles.cancelText}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={verifyAndCollect}>
                <LinearGradient colors={['#FF5722', '#E64A19']} style={styles.confirmIn}>
                  {verifying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>AUTHENTICATE</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
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
    paddingTop: RNStatusBar.currentHeight + 10,
    zIndex: 10
  },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerText: { alignItems: 'center' },
  headerSub: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  statsBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 87, 34, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 87, 34, 0.2)' },
  statsCount: { color: '#FF5722', fontSize: 16, fontWeight: '900' },

  filterBar: { marginBottom: 15, marginTop: 10 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterTabActive: { backgroundColor: 'rgba(255, 87, 34, 0.15)', borderColor: 'rgba(255, 87, 34, 0.3)' },
  filterTabText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
  filterTabActiveText: { color: '#FF5722' },

  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  orderCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 210, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 8, fontWeight: '900' },
  orderId: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.2)' },

  cardInfo: { paddingHorizontal: 12, flex: 1 },
  studentName: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  itemSummary: { marginTop: 6 },
  itemText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  moreItems: { fontSize: 10, color: '#FF5722', fontWeight: '800', marginTop: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.02)' },
  orderAmount: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  slotText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' },

  actionSection: { flexDirection: 'row', gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryAction: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  rejectMini: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 82, 82, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.2)' },

  emptyWrap: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', marginTop: 20 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10, paddingHorizontal: 40, lineHeight: 20 },

  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C24', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  modalSub: { fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8, marginBottom: 25 },
  modalCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mcName: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  mcId: { fontSize: 10, fontWeight: '800', color: '#FF5722', marginTop: 4, letterSpacing: 1 },
  mcInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 20, fontSize: 32, fontWeight: '900', textAlign: 'center', color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 25, letterSpacing: 10 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 18, alignItems: 'center' },
  modalConfirm: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  confirmIn: { flex: 1, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});
