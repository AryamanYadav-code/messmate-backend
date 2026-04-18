import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../../components/Skeleton';

const STATUS_COLORS = {
  delivered: '#4CAF50',
  cancelled: '#f44336',
  rejected: '#f44336'
};

export default function AdminOrderHistoryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/admin/history');
      setOrders(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Order History</Text>
        <View style={{ width: 60 }}/>
      </View>

      {loading ? (
        <View style={{ padding: 12 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Skeleton width={100} height={20} />
                  <Skeleton width={80} height={14} style={{ marginTop: 5 }} />
                </View>
                <Skeleton width={80} height={20} borderRadius={12} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.detailBox}>
                  <Skeleton width={50} height={12} />
                  <Skeleton width={60} height={18} style={{ marginTop: 5 }} />
                </View>
                <View style={styles.detailBox}>
                  <Skeleton width={40} height={12} />
                  <Skeleton width={50} height={16} style={{ marginTop: 5 }} />
                </View>
              </View>
              <Skeleton width={100} height={12} style={{ alignSelf: 'flex-end' }} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.order_id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{item.order_id}</Text>
                  <Text style={styles.studentInfo}>{item.name}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
                  <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.detailBox}>
                   <Text style={styles.detailLabel}>Amount</Text>
                   <Text style={styles.amount}>₹{item.total_amount}</Text>
                </View>
                <View style={styles.detailBox}>
                   <Text style={styles.detailLabel}>Slot</Text>
                   <Text style={styles.slot}>{item.meal_slot}</Text>
                </View>
              </View>

              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>No past orders found!</Text>
              <Text style={styles.emptySubtext}>Any completed or cancelled orders will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: colors.headerText, fontSize: 18, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.headerText },
  loading: { textAlign: 'center', marginTop: 40, color: colors.textSecondary },
  card: { backgroundColor: colors.card, marginBottom: 12, borderRadius: 16, padding: 16, elevation: 2, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  studentInfo: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', gap: 16, marginBottom: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  detailBox: { flex: 1 },
  detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  slot: { fontSize: 14, color: colors.text, textTransform: 'capitalize', fontWeight: '500' },
  date: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', alignSelf: 'flex-end' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }
});
