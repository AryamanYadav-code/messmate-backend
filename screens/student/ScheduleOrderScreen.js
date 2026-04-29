import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, 
  SafeAreaView, ScrollView, Animated, Dimensions, ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', time: '7:00 - 9:00 AM', icon: 'sunny-outline', color: '#FFB74D' },
  { key: 'lunch', label: 'Lunch', time: '12:00 - 2:00 PM', icon: 'restaurant-outline', color: '#64B5F6' },
  { key: 'dinner', label: 'Dinner', time: '7:00 - 9:00 PM', icon: 'moon-outline', color: '#9575CD' },
  { key: 'snacks', label: 'Snacks', time: '4:00 - 6:00 PM', icon: 'cafe-outline', color: '#81C784' },
];

export default function ScheduleOrderScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  
  const [selectedSlot, setSelectedSlot] = useState('lunch');
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowDisplay = tomorrow.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    fetchMenu();
  }, [selectedSlot]);

  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const res = await api.get(`/menu/${selectedSlot}`);
      setMenu(res.data);
    } catch (err) { console.log(err); }
    finally { setMenuLoading(false); }
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
        'Voucher Reserved! 🎫',
        `Your ${selectedSlot} reservation for tomorrow is confirmed.\n\nTransaction: #MS-${res.data.order_id}`,
        [{ text: 'Great', onPress: () => navigation.replace('Home') }]
      );
    } catch (err) {
      Alert.alert('Transaction Failed', err.response?.data?.error || 'Failed to schedule reservation');
    } finally { setLoading(false); }
  };

  const renderItem = ({ item }) => {
    const cartItem = cart.find(c => c.item_id === item.item_id);
    return (
      <View style={styles.menuCard}>
        <View style={styles.cardInfo}>
          <View style={styles.badgeRow}>
             <View style={[styles.vegBadge, { borderColor: item.is_veg ? '#4CAF50' : '#F44336' }]}>
                <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#F44336' }]} />
             </View>
             <Text style={styles.itemCategory}>FRESH PREP</Text>
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
        </View>

        <View style={styles.actionWrap}>
          {cartItem ? (
            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => removeFromCart(item.item_id)} style={styles.qtyBtn}>
                <Ionicons name="remove" size={16} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{cartItem.quantity}</Text>
              <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyBtn}>
                <Ionicons name="add" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => addToCart(item)} style={styles.addBtn}>
               <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.addGrad}>
                  <Text style={styles.addBtnText}>RESERVE</Text>
               </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Mesh Header */}
      <LinearGradient 
        colors={['#FF5722', '#F4511E']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                   <Ionicons name="chevron-back" size={22} color="#FFF" />
                </BlurView>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Pre-Order Vault</Text>
              <View style={{ width: 44 }} />
          </View>
          
          <View style={styles.dateInfo}>
             <BlurView intensity={20} tint="light" style={styles.dateBlur}>
                <Ionicons name="calendar-outline" size={16} color="#FFF" />
                <Text style={styles.dateLabel}>TOMORROW • {tomorrowDisplay.toUpperCase()}</Text>
             </BlurView>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.slotContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotScroll}>
           {MEAL_SLOTS.map(slot => (
             <TouchableOpacity 
               key={slot.key} 
               style={[styles.slotTab, selectedSlot === slot.key && { backgroundColor: slot.color + '15', borderColor: slot.color }]}
               onPress={() => { setSelectedSlot(slot.key); setCart([]); }}
             >
                <Ionicons name={slot.icon} size={20} color={selectedSlot === slot.key ? slot.color : (isDark ? '#666' : '#999')} />
                <Text style={[styles.slotText, selectedSlot === slot.key && { color: slot.color }]}>{slot.label}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      <Animated.View style={[styles.menuWrap, { opacity: fadeAnim }]}>
         {menuLoading ? (
            <View style={styles.center}>
               <ActivityIndicator size="small" color={colors.primary} />
            </View>
         ) : (
            <FlatList
              data={menu}
              keyExtractor={item => item.item_id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                   <Ionicons name="fast-food-outline" size={60} color={isDark ? "#222" : "#EEE"} />
                   <Text style={styles.emptyText}>No curation for this slot yet.</Text>
                </View>
              }
            />
         )}
      </Animated.View>

      {cart.length > 0 && (
        <View style={styles.footer}>
           <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.footerBlur}>
              <View style={styles.footerStats}>
                 <Text style={styles.statsLabel}>RESERVATION TOTAL</Text>
                 <Text style={styles.statsValue}>₹{total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.confirmBtn} onPress={placeScheduledOrder} disabled={loading}>
                 <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.confirmGrad}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>SECURE RESERVATION</Text>}
                 </LinearGradient>
              </TouchableOpacity>
           </BlurView>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingBottom: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  
  dateInfo: { paddingHorizontal: 20, marginTop: 20 },
  dateBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  dateLabel: { color: '#FFF', fontSize: 11, fontWeight: '900', marginLeft: 8, letterSpacing: 1 },

  slotContainer: { marginTop: -20, marginBottom: 10 },
  slotScroll: { paddingHorizontal: 20, paddingVertical: 10 },
  slotTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', elevation: 3 },
  slotText: { fontSize: 13, fontWeight: '900', marginLeft: 8, color: colors.textSecondary },

  menuWrap: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 150 },
  
  menuCard: { backgroundColor: colors.card, borderRadius: 28, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', elevation: 5 },
  cardInfo: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  vegBadge: { width: 14, height: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 3, marginRight: 8 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemCategory: { fontSize: 9, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1 },
  itemName: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 4 },
  itemDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 16, marginBottom: 10 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: colors.primary },

  actionWrap: { marginLeft: 15 },
  addBtn: { borderRadius: 15, overflow: 'hidden' },
  addGrad: { paddingHorizontal: 20, paddingVertical: 12 },
  addBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 15, padding: 4 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: '#FFF', fontWeight: '900', fontSize: 14, paddingHorizontal: 10 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 15 },

  footer: { position: 'absolute', bottom: 25, left: 20, right: 20, borderRadius: 30, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  footerBlur: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerStats: { flex: 1 },
  statsLabel: { fontSize: 10, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  statsValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
  confirmBtn: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 18, alignItems: 'center' },
  confirmText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }
});
