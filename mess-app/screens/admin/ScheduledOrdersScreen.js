import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl } from 'react-native';
import api from '../../services/api';

const SLOT_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍿' };

export default function ScheduledOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

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

  const groupByDate = () => {
    const groups = {};
    orders.forEach(order => {
      const date = order.scheduled_date?.split('T')[0] || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return Object.entries(groups);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Orders</Text>
        <Text style={styles.count}>{orders.length} total</Text>
      </View>

      <FlatList
        data={groupByDate()}
        keyExtractor={([date]) => date}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']}/>}
        renderItem={({ item: [date, dateOrders] }) => (
          <View style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>📅 {new Date(date).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}</Text>
              <Text style={styles.dateCount}>{dateOrders.length} orders</Text>
            </View>
            {dateOrders.map(order => (
              <View key={order.order_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.slot}>{SLOT_ICONS[order.meal_slot]} {order.meal_slot}</Text>
                  <Text style={styles.orderId}>#{order.order_id}</Text>
                </View>
                <View style={styles.studentRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{order.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{order.name}</Text>
                    <Text style={styles.studentEmail}>{order.email}</Text>
                  </View>
                  <Text style={styles.amount}>₹{order.total_amount}</Text>
                </View>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => approveOrder(order.order_id)}>
                  <Text style={styles.approveBtnText}>Approve Order</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No scheduled orders</Text>
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
  count: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  dateGroup: { marginBottom: 16 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  dateCount: { fontSize: 12, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  slot: { fontSize: 14, fontWeight: 'bold', color: '#6C63FF', textTransform: 'capitalize' },
  orderId: { fontSize: 13, color: '#888' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 15 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  studentEmail: { fontSize: 12, color: '#888' },
  amount: { fontSize: 15, fontWeight: 'bold', color: '#6C63FF' },
  approveBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 10, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888' },
}); 
