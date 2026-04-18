import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../../components/Skeleton';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks'];

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [name, setName] = useState('');
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [unratedOrder, setUnratedOrder] = useState(null);
  const [loading, setLoading] = useState(true);



  const fetchAds = async () => {
  try {
    const res = await api.get('/ads');
    setAds(res.data);
  } catch (err) { console.log(err); }
};

  const fetchMenu = async (cat) => {
    try {
      const res = await api.get(`/menu/${cat}`);
      setMenu(res.data);
    } catch (err) { console.log(err); }
  };
  const [activeOrder, setActiveOrder] = useState(null);

const fetchActiveOrder = async () => {
  try {
    const id = await AsyncStorage.getItem('user_id');
    const res = await api.get(`/orders/user/${id}`);
    const activeStates = ['pending', 'approved', 'preparing', 'ready'];
    const active = res.data.filter(o => activeStates.includes(o.status));

    if (active.length > 0) {
      // Sort: Ready (1) > Preparing (2) > Approved (3) > Pending (4)
      const PRIORITY = { ready: 1, preparing: 2, approved: 3, pending: 4 };
      const today = new Date().toISOString().split('T')[0];
      
      const sorted = active.sort((a, b) => {
        // First priority: Orders for Today vs Future
        const aIsToday = !a.is_scheduled || a.scheduled_date?.split('T')[0] === today;
        const bIsToday = !b.is_scheduled || b.scheduled_date?.split('T')[0] === today;
        
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;

        // Second priority: Status
        if (PRIORITY[a.status] !== PRIORITY[b.status]) {
          return PRIORITY[a.status] - PRIORITY[b.status];
        }

        // Third priority: Recency (Newest first)
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setActiveOrder(sorted[0]);
    } else {
      setActiveOrder(null);
    }
  } catch (err) { console.log(err); }
};

const fetchUnratedOrder = async () => {
  try {
    const id = await AsyncStorage.getItem('user_id');
    const res = await api.get(`/orders/unrated/${id}`);
    setUnratedOrder(res.data);
  } catch (err) { console.log(err); }
};



useEffect(() => {
  AsyncStorage.getItem('name').then(n => setName(n || ''));
}, []);

useEffect(() => {
  fetchMenu(category);
}, [category]);

useEffect(() => {
  const init = async () => {
    setLoading(true);
    await Promise.all([
      fetchMenu(category),
      fetchActiveOrder(),
      fetchAds(),
      fetchUnratedOrder()
    ]);
    setLoading(false);
  };
  init();

  const orderInterval = setInterval(() => {
    fetchActiveOrder();
    fetchUnratedOrder();
  }, 5000);
  return () => clearInterval(orderInterval);
}, []);

useEffect(() => {
  if (ads.length === 0) return;
  const adInterval = setInterval(() => {
    setCurrentAd(prev => (prev + 1) % ads.length);
  }, 4000);
  return () => clearInterval(adInterval);
}, [ads.length]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Hi, {name}!</Text>
          <TouchableOpacity onPress={async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          }}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.headerBtnText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.headerBtnText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('OrderHistory')}>
            <Text style={styles.headerBtnText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Cart', { cart })}>
            <Text style={styles.headerBtnText}>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ScheduleOrder')}>
            <Text style={styles.headerBtnText}>📅 Pre-Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1 }}>
          <View style={styles.tabs}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} width={70} height={35} borderRadius={12} style={{ marginHorizontal: 4 }} />)}
          </View>
          <View style={styles.searchContainer}>
            <Skeleton width="100%" height={40} borderRadius={12} />
          </View>
          <View style={styles.adContainer}>
            <Skeleton width="100%" height={140} borderRadius={14} />
          </View>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.card, { height: 100, marginBottom: 8 }]}>
              <Skeleton width={100} height="100%" borderRadius={0} />
              <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                <Skeleton width="60%" height={15} />
                <Skeleton width="40%" height={12} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width={40} height={15} />
                  <Skeleton width={60} height={30} borderRadius={8} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.tab, category === cat && styles.activeTab]}
                onPress={() => setCategory(cat)}>
                <Text style={[styles.tabText, category === cat && styles.activeTabText]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your favourite food..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {ads.length > 0 && (
            <View style={styles.adContainer}>
              <Image
                source={{ uri: ads[currentAd]?.image_url }}
                style={styles.adImage}
                resizeMode="cover"
              />
              <View style={styles.adOverlay}>
                <Text style={styles.adTitle}>{ads[currentAd]?.title}</Text>
              </View>
              <View style={styles.adDots}>
                {ads.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentAd && styles.dotActive]} />
                ))}
              </View>
            </View>
          )}

          {activeOrder && (
            <TouchableOpacity
              style={[styles.activeOrderBanner,
              activeOrder.status === 'ready' && styles.activeOrderReady]}
              onPress={() => navigation.navigate('OrderTrack', { order_id: activeOrder.order_id })}>
              <View style={styles.activeOrderLeft}>
                <View style={styles.activeOrderIconBox}>
                  <Text style={styles.activeOrderIcon}>
                    {activeOrder.status === 'pending' ? '⏳' :
                      activeOrder.status === 'approved' ? '✅' :
                        activeOrder.status === 'preparing' ? '👨‍🍳' : '🎉'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.activeOrderTitle}>Order #{activeOrder.order_id}</Text>
                  <Text style={styles.activeOrderStatus}>
                    {activeOrder.status === 'pending' ? 'Waiting for approval...' :
                      activeOrder.status === 'approved' ? 'Order approved!' :
                        activeOrder.status === 'preparing' ? 'Being prepared...' :
                          'Ready for pickup!'}
                  </Text>
                </View>
              </View>
              <View style={styles.activeOrderRight}>
                {activeOrder.status === 'ready' && (
                  <Text style={styles.pickupCodeHint}>View Code →</Text>
                )}
                <Text style={styles.activeOrderAmount}>₹{activeOrder.total_amount}</Text>
              </View>
            </TouchableOpacity>
          )}

          {unratedOrder && (
            <TouchableOpacity
              style={styles.ratingBanner}
              onPress={() => navigation.navigate('Feedback', {
                order_id: unratedOrder.order_id,
                total_amount: unratedOrder.total_amount
              })}>
              <View style={styles.ratingBannerLeft}>
                <Text style={styles.ratingBannerIcon}>⭐</Text>
                <View>
                  <Text style={styles.ratingBannerTitle}>How was your meal?</Text>
                  <Text style={styles.ratingBannerSub}>Rate Order #{unratedOrder.order_id}</Text>
                </View>
              </View>
              <Text style={styles.ratingBannerArrow}>›</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))}
            keyExtractor={item => item.item_id.toString()}
            renderItem={({ item }) => {
              const cartItem = cart.find(c => c.item_id === item.item_id);
              return (
                <View style={styles.card}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Text style={styles.itemImagePlaceholderText}>🍽</Text>
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#f44336' }]} />
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.cardBottom}>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                      {cartItem ? (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => {
                            if (cartItem.quantity === 1) {
                              setCart(cart.filter(c => c.item_id !== item.item_id));
                            } else {
                              setCart(cart.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity - 1 } : c));
                            }
                          }}>
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
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>No items available</Text>}
          />
        </>
      )}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerBottom: { flexDirection: 'row', gap: 8 },
  greeting: { color: colors.headerText, fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  headerBtnText: { color: colors.headerText, fontWeight: '500', fontSize: 12 },
  tabs: { backgroundColor: colors.card, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, marginHorizontal: 4, backgroundColor: colors.tabBackground },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '500', fontSize: 12, textAlign: 'center' },
  activeTabText: { color: colors.headerText },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, marginHorizontal: 10, marginTop: 10, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 14 },
  adContainer: { margin: 10, borderRadius: 14, overflow: 'hidden', height: 140, elevation: 3 },
  adImage: { width: '100%', height: '100%' },
  adOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.overlay, padding: 10 },
  adTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  adDots: { position: 'absolute', bottom: 36, right: 10, flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 16 },
  activeOrderBanner: { backgroundColor: colors.primary, marginHorizontal: 10, marginBottom: 4, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  activeOrderReady: { backgroundColor: colors.success },
  activeOrderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeOrderIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  activeOrderIcon: { fontSize: 20 },
  activeOrderTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  activeOrderStatus: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  activeOrderRight: { alignItems: 'flex-end' },
  activeOrderAmount: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  pickupCodeHint: { color: colors.warning, fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 15 },
  card: { backgroundColor: colors.card, marginHorizontal: 10, marginBottom: 8, borderRadius: 14, overflow: 'hidden', elevation: 1, flexDirection: 'row', height: 100 },
  itemImage: { width: 100, height: '100%' },
  itemImagePlaceholder: { width: 100, height: '100%', backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' },
  itemImagePlaceholderText: { fontSize: 30 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: colors.text, flex: 1 },
  itemDesc: { fontSize: 11, color: colors.textSecondary },
  itemPrice: { fontSize: 14, color: colors.primary, fontWeight: 'bold' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { padding: 6, paddingHorizontal: 10 },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyNum: { color: '#fff', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 4 },
  ratingBanner: { backgroundColor: '#FFF9E6', marginHorizontal: 10, marginBottom: 8, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#FFD700', elevation: 2 },
  ratingBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingBannerIcon: { fontSize: 28 },
  ratingBannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  ratingBannerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  ratingBannerArrow: { fontSize: 22, color: '#FFD700', fontWeight: 'bold' },
});
