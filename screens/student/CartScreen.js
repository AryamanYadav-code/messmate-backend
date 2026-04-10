 import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function CartScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [cart, setCart] = useState(route.params?.cart || []);
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateQuantity = (item_id, delta) => {
    setCart(prev => prev
      .map(c => c.item_id === item_id ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0) return Alert.alert('Cart is empty!');
    setLoading(true);
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      await api.post('/wallet/pay', {
        user_id: parseInt(user_id),
        amount: total
      });
      const res = await api.post('/orders', {
        user_id: parseInt(user_id),
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity, price: c.price })),
        total_amount: total,
        meal_slot: 'lunch',
      });
      navigation.navigate('OrderTrack', { order_id: res.data.order_id });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.itemCount}>{cart.length} items</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={item => item.item_id.toString()}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#f44336' }]}/>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price} each</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.item_id, -1)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.item_id, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
              </View>
            )}
          />

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{cart.reduce((a, c) => a + c.quantity, 0)}</Text>
            </View>
            <View style={styles.divider}/>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.orderBtn, loading && styles.orderBtnDisabled]}
              onPress={placeOrder}
              disabled={loading}>
              <Text style={styles.orderBtnText}>
                {loading ? 'Placing Order...' : `Place Order • ₹${total.toFixed(2)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.headerText, fontSize: 32, lineHeight: 36 },
  headerTitle: { color: colors.headerText, fontSize: 18, fontWeight: 'bold' },
  itemCount: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  browseBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1, gap: 10 },
  vegDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  itemPrice: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyNum: { color: '#fff', fontWeight: 'bold', fontSize: 14, paddingHorizontal: 6 },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: colors.text, minWidth: 40, textAlign: 'right' },
  footer: { backgroundColor: colors.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  orderBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12, elevation: 3 },
  orderBtnDisabled: { backgroundColor: colors.border },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
