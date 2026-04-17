import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const SLOT_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍿' };

export default function ScheduledOrdersScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{order.name}</Text>
                    <Text style={styles.studentEmail}>{order.email}</Text>
                  </View>
                  <Text style={styles.amount}>₹{order.total_amount}</Text>
                </View>

                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsList}>
                    {order.items.map((it, idx) => (
                      <Text key={idx} style={styles.itemText}>
                        • <Text style={{ fontWeight: 'bold' }}>{it.quantity}x</Text> {it.name}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => rejectOrder(order.order_id)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => approveOrder(order.order_id)}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                </View>
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

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 32, lineHeight: 36 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  count: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  dateGroup: { marginBottom: 16 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  dateCount: { fontSize: 12, color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  slot: { fontSize: 14, fontWeight: 'bold', color: colors.primary, textTransform: 'capitalize' },
  orderId: { fontSize: 13, color: colors.textSecondary },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#2A2A4A' : '#EEF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  studentName: { fontSize: 14, fontWeight: '600', color: colors.text },
  studentEmail: { fontSize: 12, color: colors.textSecondary },
  amount: { fontSize: 15, fontWeight: 'bold', color: colors.primary },
  itemsList: { backgroundColor: isDark ? '#2A2A35' : '#F8F9FA', padding: 10, borderRadius: 8, marginBottom: 12 },
  itemText: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: { flex: 1, backgroundColor: colors.success, padding: 10, borderRadius: 10, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: colors.error || '#FF3B30', padding: 10, borderRadius: 10, alignItems: 'center' },
  rejectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
}); 
