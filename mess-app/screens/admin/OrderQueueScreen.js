import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  RefreshControl, Modal, TextInput, Dimensions, Animated, ActivityIndicator,
  StatusBar as RNStatusBar, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).duration(500)}
        style={styles.orderContainer}
      >
        <BlurView intensity={25} tint="dark" style={styles.orderCard}>
          <View style={styles.cardMain}>
            <View style={styles.cardHeader}>
              <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={12} color={config.color} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
              </View>
              <Text style={styles.orderId}>#{item.order_id}</Text>
            </View>

            <View style={styles.contentRow}>
              <View style={styles.mainInfo}>
                <Text style={styles.studentName}>{item.name || 'Registered Resident'}</Text>
                <View style={styles.itemStrip}>
                   {item.items && item.items.map((it, idx) => (
                     <Text key={idx} style={styles.itemText}>
                       {it.quantity}x <Text style={{ color: '#FFF' }}>{it.name}</Text>
                       {idx < item.items.length - 1 ? ' • ' : ''}
                     </Text>
                   ))}
                </View>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.amountText}>{item.total_amount}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.slotBadge}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.4)" />
                <Text style={styles.slotText}>{item.meal_slot}</Text>
              </View>
              {item.is_takeaway && (
                <View style={styles.takeawayBadge}>
                  <Ionicons name="bag-handle-outline" size={10} color="#FFD700" />
                  <Text style={styles.takeawayText}>PARCEL</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionToolbar}>
            {action ? (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: action.color }]}
                onPress={() => updateStatus(item.order_id, action.next)}
              >
                <Ionicons name={action.icon} size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ) : item.status === 'ready' ? (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: '#4CAF50' }]}
                onPress={() => openCollectModal(item)}
              >
                <Ionicons name="key-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionLabel}>VERIFY & DELIVER</Text>
              </TouchableOpacity>
            ) : null}
            
            {(item.status === 'pending' || item.status === 'approved') && (
               <TouchableOpacity 
                style={styles.cancelAction}
                onPress={() => rejectOrder(item.order_id)}
              >
                <Ionicons name="close-circle-outline" size={20} color="rgba(255, 82, 82, 0.5)" />
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
      <LinearGradient colors={['#0F0F12', '#1A1A22']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCore}>
            <Text style={styles.editorialSub}>MESSMATE COMMAND</Text>
            <Text style={styles.editorialTitle}>Tactical Queue</Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SYNC</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <BlurView intensity={10} tint="dark" style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID or Student..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
        </View>

        <View style={styles.filterTray}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPad}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabActiveText]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.order_id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="layers-outline" size={40} color="rgba(255,255,255,0.1)" />
              </View>
              <Text style={styles.emptyTitle}>Queue Cleared</Text>
              <Text style={styles.emptySub}>All tactical operations are up to date.</Text>
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
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    marginBottom: 20
  },
  headerCore: { flex: 1, marginLeft: 16 },
  editorialSub: { fontSize: 10, fontWeight: '900', color: '#FF5722', letterSpacing: 2 },
  editorialTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -1, marginTop: -2 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  liveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,87,34,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,87,34,0.2)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5722', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '900', color: '#FF5722' },

  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#FFF' },

  filterTray: { marginBottom: 20 },
  filterPad: { paddingHorizontal: 24 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterTabActive: { backgroundColor: '#FF5722' },
  filterTabText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  filterTabActiveText: { color: '#FFF' },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  orderContainer: { marginBottom: 16 },
  orderCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardMain: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', marginLeft: 6 },
  orderId: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.2)' },

  contentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mainInfo: { flex: 1 },
  studentName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  itemStrip: { flexDirection: 'row', flexWrap: 'wrap' },
  itemText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 18 },

  priceBlock: { alignItems: 'flex-end', marginLeft: 16 },
  currency: { fontSize: 12, fontWeight: '900', color: '#FF5722' },
  amountText: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: -4 },

  metaRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  slotBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  slotText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', marginLeft: 6, textTransform: 'uppercase' },
  takeawayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  takeawayText: { fontSize: 10, fontWeight: '900', color: '#FFD700', marginLeft: 6 },

  actionToolbar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, gap: 12 },
  primaryAction: { flex: 1, flexDirection: 'row', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  cancelAction: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,82,82,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,82,82,0.1)' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'center' },

  modalBack: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C24', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  modalSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 32 },
  modalCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mcName: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  mcId: { fontSize: 12, fontWeight: '900', color: '#FF5722', marginTop: 4 },
  mcInput: { fontSize: 48, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: 8, marginBottom: 32 },
  modalActions: { flexDirection: 'row', gap: 16 },
  modalCancel: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '900', color: 'rgba(255,255,255,0.3)' },
  modalConfirm: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  confirmIn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 16, fontWeight: '900', color: '#FFF' }
});
