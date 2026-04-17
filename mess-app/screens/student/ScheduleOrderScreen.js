import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', time: '7:00 - 9:00 AM', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', time: '12:00 - 2:00 PM', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', time: '7:00 - 9:00 PM', icon: '🌙' },
  { key: 'snacks', label: 'Snacks', time: '4:00 - 6:00 PM', icon: '🍿' },
];

export default function ScheduleOrderScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  
  const [selectedSlot, setSelectedSlot] = useState('lunch');
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowDisplay = tomorrow.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  useEffect(() => { fetchMenu(); }, [selectedSlot]);

  const fetchMenu = async () => {
    try {
      const res = await api.get(`/menu/${selectedSlot}`);
      setMenu(res.data);
    } catch (err) { console.log(err); }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (item_id) => {
    setCart(prev => prev
      .map(c => c.item_id === item_id ? { ...c, quantity: c.quantity - 1 } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeScheduledOrder = async () => {
    if (cart.length === 0) return Alert.alert('Error', 'Please add items to cart!');
    setLoading(true);
    try {
      const user_id = await AsyncStorage.getItem('user_id');

      // Pay from wallet
      await api.post('/wallet/pay', {
        user_id: parseInt(user_id),
        amount: total
      });

      // Place scheduled order
      const res = await api.post('/orders', {
        user_id: parseInt(user_id),
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity, price: c.price })),
        total_amount: total,
        meal_slot: selectedSlot,
        is_scheduled: true,
        scheduled_date: tomorrowStr
      });

      Alert.alert(
        'Order Scheduled! 🎉',
        `Your ${selectedSlot} for tomorrow has been pre-ordered!\n\nPickup Code: ${res.data.pickup_code}`,
        [{ text: 'OK', onPress: () => navigation.replace('Home') }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to schedule order');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pre-Order</Text>
        <View style={{ width: 30 }}/>
      </View>

      <View style={styles.dateBanner}>
        <Text style={styles.dateBannerIcon}>📅</Text>
        <View>
          <Text style={styles.dateBannerLabel}>Ordering for tomorrow</Text>
          <Text style={styles.dateBannerDate}>{tomorrowDisplay}</Text>
        </View>
      </View>

      <View style={styles.slotsRow}>
        {MEAL_SLOTS.map(slot => (
          <TouchableOpacity
            key={slot.key}
            style={[styles.slotBtn, selectedSlot === slot.key && styles.slotBtnActive]}
            onPress={() => { setSelectedSlot(slot.key); setCart([]); }}>
            <Text style={styles.slotIcon}>{slot.icon}</Text>
            <Text style={[styles.slotLabel, selectedSlot === slot.key && styles.slotLabelActive]}>
              {slot.label}
            </Text>
            <Text style={[styles.slotTime, selectedSlot === slot.key && { color: '#fff' }]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={menu}
        keyExtractor={item => item.item_id.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const cartItem = cart.find(c => c.item_id === item.item_id);
          return (
            <View style={styles.card}>
              <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#f44336' }]}/>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              {cartItem ? (
                <View style={styles.qtyControl}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.item_id)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{cartItem.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                  <Text style={styles.addBtnText}>ADD</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No items available</Text>}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerItems}>{cart.reduce((a, c) => a + c.quantity, 0)} items</Text>
            <Text style={styles.footerTotal}>₹{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.scheduleBtn, loading && { backgroundColor: '#aaa' }]}
            onPress={placeScheduledOrder}
            disabled={loading}>
            <Text style={styles.scheduleBtnText}>
              {loading ? 'Scheduling...' : `Schedule ${selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.headerText, fontSize: 32, lineHeight: 36 },
  headerTitle: { color: colors.headerText, fontSize: 18, fontWeight: 'bold' },
  dateBanner: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBannerIcon: { fontSize: 28 },
  dateBannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  dateBannerDate: { color: colors.headerText, fontSize: 16, fontWeight: 'bold' },
  slotsRow: { flexDirection: 'row', backgroundColor: colors.card, padding: 8, gap: 6 },
  slotBtn: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 10, backgroundColor: colors.inputBg },
  slotBtnActive: { backgroundColor: colors.primary },
  slotIcon: { fontSize: 18 },
  slotLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  slotLabelActive: { color: '#fff' },
  slotTime: { fontSize: 9, color: colors.divider, marginTop: 1, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 1 },
  vegDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  itemDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, color: colors.primary, fontWeight: 'bold', marginTop: 4 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { padding: 7, paddingHorizontal: 10 },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyNum: { color: '#fff', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 4 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, padding: 16, elevation: 10, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  footerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerItems: { fontSize: 14, color: colors.textSecondary },
  footerTotal: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  scheduleBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  scheduleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
}); 
