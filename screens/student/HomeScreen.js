import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks'];

export default function HomeScreen({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState('lunch');
  const [cart, setCart] = useState([]);
  const [name, setName] = useState('');
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    AsyncStorage.getItem('name').then(n => setName(n));
    fetchMenu(category);
  }, [category]);

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
    const pending = res.data.find(o => 
      ['pending','approved','preparing','ready'].includes(o.status)
    );
    setActiveOrder(pending || null);
  } catch (err) { console.log(err); }
};

useEffect(() => {
  AsyncStorage.getItem('name').then(n => setName(n));
  fetchMenu(category);
  fetchActiveOrder();
  const interval = setInterval(fetchActiveOrder, 5000);
  return () => clearInterval(interval);
}, [category]);

useEffect(() => {
  AsyncStorage.getItem('name').then(n => setName(n));
  fetchMenu(category);
  fetchActiveOrder();
  fetchAds();
  const interval = setInterval(fetchActiveOrder, 5000);
  const adInterval = setInterval(() => {
    setCurrentAd(prev => (prev + 1) % (ads.length || 1));
  }, 4000);
  return () => {
    clearInterval(interval);
    clearInterval(adInterval);
  };
}, [category, ads.length]);

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
  </View>
</View>

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
        <View key={i} style={[styles.dot, i === currentAd && styles.dotActive]}/>
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

      <FlatList
        data={menu}
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
          <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#f44336' }]}/>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerBottom: { flexDirection: 'row', gap: 8 },
  greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  headerBtnText: { color: '#fff', fontWeight: '500', fontSize: 12 },
  tabs: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  activeTab: { backgroundColor: '#6C63FF' },
  tabText: { color: '#888', fontWeight: '500', fontSize: 12, textAlign: 'center' },
  activeTabText: { color: '#fff' },
  adContainer: { margin: 10, borderRadius: 14, overflow: 'hidden', height: 140, elevation: 3 },
  adImage: { width: '100%', height: '100%' },
  adOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', padding: 10 },
  adTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  adDots: { position: 'absolute', bottom: 36, right: 10, flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 16 },
  activeOrderBanner: { backgroundColor: '#6C63FF', marginHorizontal: 10, marginBottom: 4, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  activeOrderReady: { backgroundColor: '#4CAF50' },
  activeOrderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeOrderIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  activeOrderIcon: { fontSize: 20 },
  activeOrderTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  activeOrderStatus: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  activeOrderRight: { alignItems: 'flex-end' },
  activeOrderAmount: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  pickupCodeHint: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  card: { backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vegDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  itemPrice: { fontSize: 14, color: '#6C63FF', fontWeight: 'bold', marginTop: 4 },
  addBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { padding: 7, paddingHorizontal: 11 },
  qtyBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  qtyNum: { color: '#fff', fontWeight: 'bold', fontSize: 14, paddingHorizontal: 4 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 8, borderRadius: 14, overflow: 'hidden', elevation: 1, flexDirection: 'row', height: 100 },
  itemImage: { width: 100, height: '100%' },
  itemImagePlaceholder: { width: 100, height: '100%', backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  itemImagePlaceholderText: { fontSize: 30 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1 },
  itemDesc: { fontSize: 11, color: '#999' },
  itemPrice: { fontSize: 14, color: '#6C63FF', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { padding: 6, paddingHorizontal: 10 },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyNum: { color: '#fff', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 4 }
});
