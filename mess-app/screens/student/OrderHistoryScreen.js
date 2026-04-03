 import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#2196F3',
  preparing: '#9C27B0',
  ready: '#4CAF50',
  delivered: '#4CAF50',
  rejected: '#f44336'
};

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      const res = await api.get(`/orders/user/${id}`);
      setOrders(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
        <View style={{ width: 50 }}/>
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.order_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                if (['pending','approved','preparing','ready'].includes(item.status)) {
                  navigation.navigate('OrderTrack', { order_id: item.order_id });
                }
              }}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.order_id}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                  <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.amount}>₹{item.total_amount}</Text>
                <Text style={styles.slot}>{item.meal_slot}</Text>
              </View>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </Text>
              {item.status === 'ready' && (
                <Text style={styles.pickupHint}>Tap to view pickup code →</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽</Text>
              <Text style={styles.emptyText}>No orders yet!</Text>
              <Text style={styles.emptySubtext}>Your order history will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#fff', fontSize: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  loading: { textAlign: 'center', marginTop: 40, color: '#888' },
  card: { backgroundColor: '#fff', margin: 10, borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#6C63FF' },
  slot: { fontSize: 14, color: '#888', textTransform: 'capitalize' },
  date: { fontSize: 12, color: '#aaa' },
  pickupHint: { color: '#4CAF50', fontWeight: 'bold', fontSize: 13, marginTop: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888' }
});
