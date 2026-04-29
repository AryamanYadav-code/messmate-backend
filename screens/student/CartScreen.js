import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, 
  Dimensions, Animated, ActivityIndicator, SafeAreaView, Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', color: '#FFB74D' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline', color: '#4CAF50' },
  { id: 'dinner', label: 'Dinner', icon: 'moon-outline', color: '#9C27B0' }
];

export default function CartScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  
  const [cart, setCart] = useState(route.params?.cart || []);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('lunch');

  // Animations
  const orbAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBalance();
    startAnimations();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const startAnimations = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0, duration: 10000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchBalance = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      const res = await api.get(`/wallet/balance/${id}`);
      setBalance(res.data.balance);
    } catch (err) { console.log('Balance Error:', err); }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remainingBalance = balance - total;

  const updateQuantity = (item_id, delta) => {
    setCart(prev => prev
      .map(c => c.item_id === item_id ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0) return Alert.alert('Cart is empty!');
    if (total > balance) return Alert.alert('Insufficient Balance', 'Please recharge your wallet.');

    setLoading(true);
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      
      // Debit wallet
      await api.post('/wallet/pay', {
        user_id: parseInt(user_id),
        amount: total
      });

      // Create order
      const res = await api.post('/orders', {
        user_id: parseInt(user_id),
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity, price: c.price })),
        total_amount: total,
        meal_slot: selectedSlot,
      });

      Alert.alert('Success! 🎉', 'Your order was placed successfully.');
      navigation.replace('OrderTrack', { order_id: res.data.order_id });
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBackground = () => (
    <View style={StyleSheet.absoluteFill}>
       <View style={[styles.bgBase, { backgroundColor: isDark ? '#0F0F12' : '#F8FAFC' }]} />
       {isDark && (
         <>
           <Animated.View style={[
             styles.orb, 
             { 
               backgroundColor: '#FF572210', 
               top: 200, right: -100, width: 350, height: 350,
               transform: [{ translateY: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) }]
             }
           ]} />
           <Animated.View style={[
             styles.orb, 
             { 
               backgroundColor: '#2196F308', 
               bottom: 100, left: -100, width: 300, height: 300,
               transform: [{ translateX: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }]
             }
           ]} />
         </>
       )}
    </View>
  );

  const Header = () => (
    <View style={styles.header}>
       <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BlurView intensity={20} tint="light" style={styles.blurBtn}>
             <Ionicons name="chevron-back" size={22} color="#FFF" />
          </BlurView>
       </TouchableOpacity>
       <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Review Transaction</Text>
          <Text style={styles.headerSub}>Finalize Secure Checkout</Text>
       </View>
       <View style={{ width: 44 }} />
    </View>
  );

  const renderItem = ({ item }) => (
    <BlurView intensity={isDark ? 10 : 5} tint={isDark ? 'dark' : 'light'} style={styles.itemCard}>
      <View style={styles.itemImageContainer}>
         {item.image_url ? (
           <Image source={{ uri: item.image_url }} style={styles.itemImg} />
         ) : (
           <View style={styles.imgPlaceholder}><Text style={{fontSize: 20}}>🍽️</Text></View>
         )}
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price} per unit</Text>
        
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtySmallBtn} onPress={() => updateQuantity(item.item_id, -1)}>
            <Ionicons name="remove" size={14} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtySmallBtn} onPress={() => updateQuantity(item.item_id, 1)}>
            <Ionicons name="add" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
         <Text style={styles.itemTotalLabel}>SUBTOTAL</Text>
         <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(0)}</Text>
      </View>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}

      <LinearGradient colors={['#1F1F2E', 'transparent']} style={styles.topGradient}>
         <SafeAreaView>
            <Header />
         </SafeAreaView>
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={styles.emptyWrap}>
          <BlurView intensity={20} tint="light" style={styles.emptyIconBox}>
             <Ionicons name="cart-outline" size={60} color={isDark ? '#444' : '#CCC'} />
          </BlurView>
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <Text style={styles.emptySub}>Your meal selection queue is currently vacant.</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
             <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.goBackIn}>
                <Text style={styles.goBackText}>Return to Catalog</Text>
             </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={item => item.item_id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.slotSection}>
                 <Text style={styles.sectionTitle}>SELECT MEAL SESSION</Text>
                 <View style={styles.slotGrid}>
                   {MEAL_SLOTS.map(s => (
                     <TouchableOpacity 
                       key={s.id} 
                       style={[styles.slotCard, selectedSlot === s.id && { backgroundColor: s.color + '20', borderColor: s.color + '50' }]}
                       onPress={() => setSelectedSlot(s.id)}
                     >
                        <Ionicons name={s.icon} size={20} color={selectedSlot === s.id ? s.color : isDark ? '#444' : '#999'} />
                        <Text style={[styles.slotLabel, selectedSlot === s.id && { color: s.color }]}>{s.label}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
              </View>
            }
          />

          <View style={styles.footer}>
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.summaryCard}>
               <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>Transaction Summary</Text>
                  <View style={styles.secureTag}>
                     <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                     <Text style={styles.secureText}>SECURE</Text>
                  </View>
               </View>
               
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Digital Waller Balance</Text>
                 <Text style={styles.summaryVal}>₹{parseFloat(balance).toFixed(2)}</Text>
               </View>
               
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Transaction Worth</Text>
                 <Text style={[styles.summaryVal, { color: colors.primary }]}>- ₹{total.toFixed(2)}</Text>
               </View>

               <View style={styles.divider} />

               <View style={styles.summaryRow}>
                 <Text style={styles.totalLabel}>Payable Credits</Text>
                 <Text style={[styles.totalVal, remainingBalance < 0 && { color: '#FF5252' }]}>
                   ₹{total.toFixed(2)}
                 </Text>
               </View>

               <TouchableOpacity 
                style={[styles.payBtn, (loading || remainingBalance < 0) && styles.payBtnDisabled]}
                onPress={placeOrder}
                disabled={loading || remainingBalance < 0}
               >
                 <LinearGradient 
                   colors={remainingBalance < 0 ? ['#444', '#222'] : [colors.primary, '#C41C00']} 
                   style={styles.payGrad}
                 >
                   {loading ? (
                     <ActivityIndicator color="#FFF" />
                   ) : (
                     <View style={styles.payIn}>
                        <Ionicons name={remainingBalance < 0 ? "warning-outline" : "finger-print-outline"} size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={styles.payText}>
                          {remainingBalance < 0 ? 'INSUFFICIENT BALANCE' : 'AUTHORIZE PAYMENT'}
                        </Text>
                     </View>
                   )}
                 </LinearGradient>
               </TouchableOpacity>

               {remainingBalance < 0 && (
                 <TouchableOpacity style={styles.rechargeBox} onPress={() => navigation.navigate('Wallet')}>
                    <Text style={styles.rechargeHint}>Deficit: ₹{Math.abs(remainingBalance).toFixed(2)} • <Text style={{ color: colors.primary }}>RECHARGE NOW ›</Text></Text>
                 </TouchableOpacity>
               )}
            </BlurView>
          </View>
        </>
      )}
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgBase: { ...StyleSheet.absoluteFillObject },
  orb: { position: 'absolute', borderRadius: 200, opacity: 0.4 },
  
  topGradient: { paddingBottom: 20, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  listContent: { padding: 20, paddingBottom: 450 },
  
  slotSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1, marginBottom: 15 },
  slotGrid: { flexDirection: 'row', gap: 10 },
  slotCard: { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF', paddingVertical: 15, alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', gap: 8 },
  slotLabel: { fontSize: 10, fontWeight: '900', color: colors.textSecondary },

  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF', borderRadius: 28, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', overflow: 'hidden' },
  itemImageContainer: { width: 65, height: 65, borderRadius: 18, overflow: 'hidden' },
  itemImg: { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, backgroundColor: isDark ? '#2D2D3A' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: '900', color: colors.text },
  itemPrice: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtySmallBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: isDark ? '#222' : '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#333' : '#EEE' },
  qtyVal: { fontWeight: '900', color: colors.text, fontSize: 15, minWidth: 20, textAlign: 'center' },
  
  itemTotalLabel: { fontSize: 8, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  itemTotal: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: 2 },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 10, marginBottom: 35 },
  goBackBtn: { width: '80%', borderRadius: 20, overflow: 'hidden' },
  goBackIn: { paddingVertical: 18, alignItems: 'center' },
  goBackText: { color: '#FFF', fontWeight: '900', fontSize: 16 },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 15 },
  summaryCard: { borderTopLeftRadius: 35, borderTopRightRadius: 35, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, padding: 25, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  summaryTitle: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  secureTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF5015', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  secureText: { color: '#4CAF50', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
  summaryVal: { fontSize: 15, fontWeight: '900', color: colors.text },
  
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', marginVertical: 20 },
  
  totalLabel: { fontSize: 16, fontWeight: '900', color: colors.text },
  totalVal: { fontSize: 24, fontWeight: '900', color: colors.text },

  payBtn: { marginTop: 30, borderRadius: 20, overflow: 'hidden', elevation: 12, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 15 },
  payBtnDisabled: { opacity: 0.6 },
  payGrad: { paddingVertical: 20 },
  payIn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  payText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  rechargeBox: { marginTop: 20, alignItems: 'center' },
  rechargeHint: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }
});
