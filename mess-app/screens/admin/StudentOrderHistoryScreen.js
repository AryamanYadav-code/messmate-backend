import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#2196F3',
  preparing: '#9C27B0',
  ready: '#4CAF50',
  delivered: '#4CAF50',
  cancelled: '#f44336',
  rejected: '#f44336'
};

export default function StudentOrderHistoryScreen({ route, navigation }) {
  const { user_id, name } = route.params;
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

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
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders.filter(o => 
    !searchQuery || o.order_id.toString().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders: {name.split(' ')[0]}</Text>
        <View style={{ width: 60 }}/>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, backgroundColor: colors.background }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.order_id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{item.order_id}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
                  <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={styles.detailBox}>
                     <Text style={styles.detailLabel}>Amount</Text>
                     <Text style={styles.amount}>₹{item.total_amount}</Text>
                  </View>
                  <View style={styles.detailBox}>
                     <Text style={styles.detailLabel}>Slot</Text>
                     <Text style={styles.slot}>{item.meal_slot}</Text>
                  </View>
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
              <Text style={styles.emptyText}>No orders found!</Text>
              <Text style={styles.emptySubtext}>This student hasn't placed any orders yet.</Text>
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.card },
  cardBody: { marginBottom: 8, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  detailBox: { flex: 1 },
  detailLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  slot: { fontSize: 14, color: colors.text, textTransform: 'capitalize', fontWeight: '500' },
  itemsList: { backgroundColor: colors.background, padding: 10, borderRadius: 8, marginTop: 12 },
  itemText: { fontSize: 13, color: colors.text, marginBottom: 4 },
  date: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', alignSelf: 'flex-end' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }
});
