import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl, Modal, TextInput } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const STATUS_CONFIG = {
  pending:   { color: '#FF9800', bg: '#FFF3E0', label: 'Pending',   icon: '⏳', darkBg: '#3A2E1A', darkColor: '#FFB74D' },
  approved:  { color: '#2196F3', bg: '#E3F2FD', label: 'Approved',  icon: '✅', darkBg: '#1A2A3A', darkColor: '#64B5F6' },
  preparing: { color: '#9C27B0', bg: '#F3E5F5', label: 'Preparing', icon: '👨‍🍳', darkBg: '#3A1A3A', darkColor: '#BA68C8' },
  ready:     { color: '#4CAF50', bg: '#E8F5E9', label: 'Ready',     icon: '🎉', darkBg: '#1A3320', darkColor: '#81C784' },
};

const NEXT_ACTION = {
  pending:   { label: 'Approve Order',   next: 'approved',  color: '#2196F3' },
  approved:  { label: 'Start Preparing', next: 'preparing', color: '#9C27B0' },
  preparing: { label: 'Mark Ready',      next: 'ready',     color: '#4CAF50' },
};

export default function OrderQueueScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectModal, setCollectModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/admin/pending');
      setOrders(res.data);
    } catch (err) { console.log(err); }
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
    } catch (err) { Alert.alert('Error', 'Could not update status'); }
  };

  const rejectOrder = (order_id) => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order? The wallet will be refunded.",
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

  const openCollectModal = (order) => {
    setSelectedOrder(order);
    setEnteredCode('');
    setCollectModal(true);
  };

  const verifyAndCollect = async () => {
    if (!enteredCode || enteredCode.length !== 6) {
      return Alert.alert('Error', 'Please enter the 6-digit pickup code');
    }
    setVerifying(true);
    try {
      const res = await api.post('/orders/verify-code', { pickup_code: enteredCode });
      if (res.data.order_id !== selectedOrder.order_id) {
        Alert.alert('Wrong Code!', 'This code belongs to a different order. Please check again.');
        setVerifying(false);
        return;
      }
      await api.put(`/orders/${selectedOrder.order_id}/status`, { status: 'delivered' });
      Alert.alert('Success! ✅', `Order #${selectedOrder.order_id} marked as collected!`);
      setCollectModal(false);
      setEnteredCode('');
      fetchOrders();
    } catch (err) {
      Alert.alert('Invalid Code ❌', 'The pickup code is incorrect. Please ask the student to show their code.');
    } finally { setVerifying(false); }
  };

  const FILTERS = ['all', 'pending', 'approved', 'preparing', 'ready'];
  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      o.order_id.toString().includes(q) || 
      (o.name && o.name.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Queue</Text>
        <Text style={styles.orderCount}>{orders.length} orders</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: colors.background }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID or Student Name..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <FlatList 
          horizontal 
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.order_id.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status];
          const action = NEXT_ACTION[item.status];
          const badgeBg = isDark && status ? status.darkBg : (status ? status.bg : '#eee');
          const badgeColor = isDark && status ? status.darkColor : (status ? status.color : '#333');

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>Order #{item.order_id}</Text>
                  {status && (
                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={styles.statusIcon}>{status.icon}</Text>
                      <Text style={[styles.statusText, { color: badgeColor }]}>{status.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.orderTime}>
                  {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.studentRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentEmail}>{item.email}</Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>₹{item.total_amount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Slot</Text>
                    <Text style={styles.detailValue}>{item.meal_slot}</Text>
                  </View>
                  {item.items && item.items.length > 0 && (
                    <View style={styles.itemsList}>
                      {item.items.map((it, idx) => (
                        <Text key={idx} style={styles.itemText}>
                          • <Text style={{ fontWeight: 'bold' }}>{it.quantity}x</Text> {it.name}
                        </Text>
                      ))}
                    </View>
                  )}
                  {item.special_note ? (
                    <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Note</Text>
                       <Text style={styles.detailValue}>{item.special_note}</Text>
                    </View>
                  ) : null}
                  {item.status === 'ready' && (
                    <View style={[styles.detailRow, { backgroundColor: isDark ? '#1A3320' : '#E8F5E9', padding: 8, borderRadius: 8, marginTop: 4 }]}>
                      <Text style={[styles.detailLabel, { color: isDark ? '#81C784' : '#4CAF50' }]}>Status</Text>
                      <Text style={[styles.detailValue, { color: isDark ? '#81C784' : '#4CAF50' }]}>Waiting for student</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {action && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: action.color, flex: 1, marginTop: 0 }]}
                    onPress={() => updateStatus(item.order_id, action.next)}>
                    <Text style={styles.actionBtnText}>{action.label}</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F44336', flex: 1, marginTop: 0 }]}
                    onPress={() => rejectOrder(item.order_id)}>
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                )}
              </View>

              {item.status === 'ready' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#607D8B', marginTop: 8 }]}
                  onPress={() => openCollectModal(item)}>
                  <Text style={styles.actionBtnText}>🔐 Verify & Collect</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>No orders here!</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        }
      />

      <Modal visible={collectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Verify Pickup Code</Text>
            <Text style={styles.modalSubtitle}>
              Ask the student to show their pickup code and enter it below
            </Text>

            <View style={styles.orderInfoBox}>
              <Text style={styles.orderInfoText}>Order #{selectedOrder?.order_id}</Text>
              <Text style={styles.orderInfoName}>{selectedOrder?.name}</Text>
              <Text style={styles.orderInfoAmount}>₹{selectedOrder?.total_amount}</Text>
            </View>

            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit pickup code"
              placeholderTextColor={colors.textSecondary}
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCollectModal(false);
                  setEnteredCode('');
                }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verifyBtn, verifying && { backgroundColor: '#aaa' }]}
                onPress={verifyAndCollect}
                disabled={verifying}>
                <Text style={styles.verifyBtnText}>
                  {verifying ? 'Verifying...' : 'Verify & Collect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.headerText, fontSize: 32, lineHeight: 36 },
  headerTitle: { color: colors.headerText, fontSize: 18, fontWeight: 'bold' },
  orderCount: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.card },
  filterRow: { backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.inputBg, marginRight: 8 },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderIdRow: { gap: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  orderTime: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, alignSelf: 'flex-start' },
  statusIcon: { fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  cardBody: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12, gap: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  studentName: { fontSize: 14, fontWeight: '600', color: colors.text },
  studentEmail: { fontSize: 12, color: colors.textSecondary },
  orderDetails: { backgroundColor: colors.inputBg, borderRadius: 10, padding: 12, gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  itemsList: { backgroundColor: colors.background, padding: 10, borderRadius: 8, marginVertical: 4 },
  itemText: { fontSize: 13, color: colors.text, marginBottom: 4 },
  actionBtn: { padding: 13, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  emptySub: { color: colors.textSecondary, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  orderInfoBox: { backgroundColor: colors.inputBg, borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  orderInfoText: { fontSize: 13, color: colors.textSecondary },
  orderInfoName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  orderInfoAmount: { fontSize: 15, color: colors.primary, fontWeight: 'bold', marginTop: 4 },
  codeInput: { borderWidth: 2, borderColor: colors.primary, borderRadius: 12, padding: 16, fontSize: 24, fontWeight: 'bold', letterSpacing: 8, textAlign: 'center', color: colors.text, backgroundColor: colors.inputBg, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  verifyBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.success, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: 'bold' },
});
