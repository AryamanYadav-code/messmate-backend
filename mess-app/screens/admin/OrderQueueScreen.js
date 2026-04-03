import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl } from 'react-native';
import api from '../../services/api';

const STATUS_CONFIG = {
  pending:   { color: '#FF9800', bg: '#FFF3E0', label: 'Pending',   icon: '⏳' },
  approved:  { color: '#2196F3', bg: '#E3F2FD', label: 'Approved',  icon: '✅' },
  preparing: { color: '#9C27B0', bg: '#F3E5F5', label: 'Preparing', icon: '👨‍🍳' },
  ready:     { color: '#4CAF50', bg: '#E8F5E9', label: 'Ready',     icon: '🎉' },
};

const NEXT_ACTION = {
  pending:   { label: 'Approve Order',   next: 'approved',  color: '#2196F3' },
  approved:  { label: 'Start Preparing', next: 'preparing', color: '#9C27B0' },
  preparing: { label: 'Mark Ready',      next: 'ready',     color: '#4CAF50' },
  ready:     { label: 'Mark Collected',  next: 'delivered', color: '#607D8B' },
};

export default function OrderQueueScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

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

  const FILTERS = ['all', 'pending', 'approved', 'preparing', 'ready'];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Queue</Text>
        <Text style={styles.orderCount}>{orders.length} orders</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.order_id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']}/>}
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status];
          const action = NEXT_ACTION[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>Order #{item.order_id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status?.bg }]}>
                    <Text style={styles.statusIcon}>{status?.icon}</Text>
                    <Text style={[styles.statusText, { color: status?.color }]}>{status?.label}</Text>
                  </View>
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
                    <Text style={styles.detailLabel}>Pickup Code</Text>
                    <Text style={styles.pickupCode}>{item.pickup_code}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Slot</Text>
                    <Text style={styles.detailValue}>{item.meal_slot}</Text>
                  </View>
                </View>
              </View>

              {action && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: action.color }]}
                  onPress={() => updateStatus(item.order_id, action.next)}>
                  <Text style={styles.actionBtnText}>{action.label}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 32, lineHeight: 36 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  orderCount: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  filterRow: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterBtnActive: { backgroundColor: '#6C63FF' },
  filterText: { fontSize: 12, color: '#888', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderIdRow: { gap: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderTime: { fontSize: 12, color: '#aaa', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, alignSelf: 'flex-start' },
  statusIcon: { fontSize: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 12, gap: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 16 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#333' },
  studentEmail: { fontSize: 12, color: '#aaa' },
  orderDetails: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  pickupCode: { fontSize: 15, fontWeight: 'bold', color: '#6C63FF', letterSpacing: 2 },
  actionBtn: { padding: 13, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  emptySub: { color: '#aaa', fontSize: 14 },
});
