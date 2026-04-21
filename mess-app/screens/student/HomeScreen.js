import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  Dimensions, TextInput, ScrollView, Animated, StatusBar as RNStatusBar,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { savePushToken } from '../../services/pushNotifications';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'breakfast', name: 'Breakfast', icon: '🍳' },
  { id: 'lunch', name: 'Lunch', icon: '🍲' },
  { id: 'dinner', name: 'Dinner', icon: '🍱' },
  { id: 'snacks', name: 'Snacks', icon: '🥨' },
];

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  
  // States
  const [user, setUser] = useState({ name: 'Guest', wallet_balance: 0 });
  const [name, setName] = useState('User');
  const [balance, setBalance] = useState(0);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [activeOrder, setActiveOrder] = useState(null);

  // Refs & Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const adScrollRef = useRef(null);
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  const cartCount = useMemo(() => cart.reduce((a, c) => a + c.quantity, 0), [cart]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    initData();
    startFloatingAnimations();
    const interval = setInterval(fetchStatusUpdates, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchMenu(category);
  }, [category]);

  const initData = async () => {
    const cachedName = await AsyncStorage.getItem('name');
    const userId = await AsyncStorage.getItem('user_id');
    if (cachedName) setName(cachedName);
    
    if (userId) {
       // Register token for notifications (handles already logged in users)
       savePushToken(userId).catch(err => console.log('Notification Init Error:', err));
    }

    await Promise.all([
      fetchBalance(),
      fetchAds(),
      fetchActiveOrder(),
      fetchMenu(category)
    ]);
  };

  const fetchStatusUpdates = () => {
    fetchActiveOrder();
    fetchBalance();
  };

  const startFloatingAnimations = () => {
    const loop = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      ).start();
    };
    loop(orb1Anim, 12000);
    loop(orb2Anim, 15000);
  };

  const fetchMenu = async (cat) => {
    try {
      setLoading(true);
      const res = await api.get(cat === 'all' ? '/menu' : `/menu/${cat}`);
      setMenu(res.data);
    } catch (err) { console.log('Menu Error:', err); }
    finally { setLoading(false); }
  };

  const fetchBalance = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      const res = await api.get(`/wallet/balance/${id}`);
      setBalance(res.data.balance);
    } catch (err) { console.log('Balance Error:', err); }
  };

  const fetchAds = async () => {
    try {
      const res = await api.get('/ads');
      setAds(res.data);
    } catch (err) { console.log('Ads Error:', err); }
  };

  const fetchActiveOrder = async () => {
    try {
      const id = await AsyncStorage.getItem('user_id');
      const res = await api.get(`/orders/user/${id}`);
      const activeStates = ['pending', 'approved', 'preparing', 'ready'];
      const active = res.data.filter(o => activeStates.includes(o.status));
      if (active.length > 0) setActiveOrder(active[0]);
      else setActiveOrder(null);
    } catch (err) { console.log('Active Order Error:', err); }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.item_id);
    if (existing) {
      setCart(cart.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(c => c.item_id === itemId);
    if (existing.quantity === 1) {
      setCart(cart.filter(c => c.item_id !== itemId));
    } else {
      setCart(cart.map(c => c.item_id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
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
              backgroundColor: '#FF5722', 
              top: -50, left: -50, width: 350, height: 350,
              opacity: 0.25, // Brighter
              transform: [{ translateY: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) }]
            }
          ]} />
          <Animated.View style={[
            styles.orb, 
            { 
              backgroundColor: '#FF9800', 
              bottom: 100, right: -100, width: 500, height: 500,
              opacity: 0.15, // Brighter
              transform: [{ translateY: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }]
            }
          ]} />
          <Animated.View style={[
            styles.orb, 
            { 
              backgroundColor: '#FF5722', 
              top: height * 0.4, right: -70, width: 300, height: 300,
              opacity: 0.12, // Brighter
              transform: [{ translateX: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }]
            }
          ]} />
        </>
      )}
    </View>
  );

  const Header = () => {
    const headerHeight = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [240, 180],
      extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.headerContainer, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={isDark ? ['#E64A19', '#2C1F1A', '#0F0F12'] : [colors.primary, '#E64A19']}
          start={{x: 0, y: 0}} end={{x: 0, y: 1}}
          locations={isDark ? [0, 0.4, 1] : [0, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255, 110, 64, 0.4)', 'rgba(255, 87, 34, 0.2)', 'transparent']}
          style={[StyleSheet.absoluteFill, { height: '100%' }]}
        />
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{name}</Text>
            </View>
            <View style={styles.headerRight}>
               <TouchableOpacity 
                style={styles.walletBadge}
                onPress={() => navigation.navigate('Wallet')}
              >
                <BlurView intensity={30} tint="light" style={styles.walletBlur}>
                  <Ionicons name="card-outline" size={16} color="#FFF" />
                  <Text style={styles.walletText}>₹{parseFloat(balance).toFixed(0)}</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pfp} onPress={() => navigation.navigate('Settings')}>
                <View style={styles.pfpIn}>
                   <Text style={styles.pfpChar}>{name.charAt(0)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <BlurView intensity={isDark ? 20 : 0} tint="light" style={styles.searchBlur}>
              <Ionicons name="search-outline" size={20} color={isDark ? '#FFF' : '#666'} />
              <TextInput
                placeholder="Find your meal..."
                placeholderTextColor={isDark ? '#888' : '#999'}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderActiveBanner = () => {
    if (!activeOrder) return null;
    return (
      <TouchableOpacity 
        style={styles.activeBanner}
        onPress={() => navigation.navigate('OrderTrack', { order_id: activeOrder.order_id })}
      >
        <LinearGradient
          colors={activeOrder.status === 'ready' ? ['#4ADE80', '#16A34A'] : ['#FF5722', '#F4511E']}
          start={{x:0, y:0}} end={{x:1, y:1}}
          style={styles.bannerGrad}
        >
          <View style={styles.bannerInfo}>
            <View style={styles.pulseDot} />
            <View>
              <Text style={styles.bannerTitle}>Order #{activeOrder.order_id}</Text>
              <Text style={styles.bannerStatus}>{activeOrder.status.toUpperCase()}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderAds = () => {
    if (ads.length === 0) return null;
    return (
      <View style={styles.adsWrapper}>
        <Animated.ScrollView 
          ref={adScrollRef}
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {ads.map((ad, idx) => (
            <View key={idx} style={styles.adCardContainer}>
              <TouchableOpacity activeOpacity={0.9} style={styles.adCard}>
                <Image source={{ uri: ad.image_url }} style={styles.adImage} />
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.8)']} 
                  style={styles.adOverlay}
                >
                  <Text style={styles.adTitle}>{ad.title}</Text>
                  <Text style={styles.adDesc} numberOfLines={1}>{ad.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    );
  };

  const renderMenuItem = ({ item }) => {
    const inCart = cart.find(c => c.item_id === item.item_id);
    return (
      <View style={styles.menuCard}>
        <View 
          style={styles.menuPress}
        >
          <Image source={{ uri: item.image_url }} style={styles.menuImg} />
          <View style={[styles.vegTag, { backgroundColor: item.is_veg ? '#4CAF50' : '#F44336' }]} />
          
          <View style={styles.menuContent}>
            <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.menuDesc} numberOfLines={2}>{item.description || 'Prepared fresh daily.'}</Text>
            
            <View style={styles.menuFooter}>
              <Text style={styles.menuPrice}>₹{item.price}</Text>
              
              {inCart ? (
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.item_id)}>
                    <Text style={styles.qtyIcon}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{inCart.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.qtyIcon}>+</Text>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}
      
      <Header />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContent}>
          {renderActiveBanner()}

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('OrderHistory')}>
              <BlurView intensity={35} tint="light" style={styles.actionIconBlur}>
                <Ionicons name="time-outline" size={24} color="#FF5722" />
              </BlurView>
              <Text style={styles.actionLabel}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ScheduleOrder')}>
              <BlurView intensity={35} tint="light" style={styles.actionIconBlur}>
                <Ionicons name="calendar-outline" size={24} color="#FF5722" />
              </BlurView>
              <Text style={styles.actionLabel}>Pre-order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Wallet')}>
              <BlurView intensity={35} tint="light" style={styles.actionIconBlur}>
                <Ionicons name="wallet-outline" size={24} color="#FFD700" />
              </BlurView>
              <Text style={styles.actionLabel}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Settings')}>
              <BlurView intensity={35} tint="light" style={styles.actionIconBlur}>
                <Ionicons name="help-buoy-outline" size={24} color="#FF9800" />
              </BlurView>
              <Text style={styles.actionLabel}>Support</Text>
            </TouchableOpacity>
          </View>

          {renderAds()}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catWrap}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catBox, category === cat.id && styles.catBoxActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catName, category === cat.id && styles.catNameActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Available Menu</Text>
            <Text style={styles.subText}>{menu.length} curated options</Text>
          </View>

          {loading ? (
             <View style={{ padding: 20 }}>
               <ActivityIndicator color={colors.primary} size="large" />
             </View>
          ) : (
            <FlatList
              data={menu.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))}
              renderItem={renderMenuItem}
              keyExtractor={item => item.item_id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="restaurant-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>Nothing found in this section</Text>
                </View>
              }
            />
          )}
        </View>
      </Animated.ScrollView>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity 
          style={styles.cartFab}
          onPress={() => navigation.navigate('Cart', { cart })}
        >
          <LinearGradient colors={['#FF5722', '#F4511E']} style={styles.fabIn}>
            <Ionicons name="cart" size={24} color="#FFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1 },
  bgBase: { ...StyleSheet.absoluteFillObject },
  orb: { position: 'absolute', borderRadius: 200, opacity: 0.6 },
  
  headerContainer: { width: '100%', position: 'absolute', top: 0, zIndex: 100, overflow: 'hidden', borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerContent: { flex: 1, paddingHorizontal: 25, paddingTop: RNStatusBar.currentHeight + 15 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  userName: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletBadge: { borderRadius: 16, overflow: 'hidden' },
  walletBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  walletText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  pfp: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', padding: 2 },
  pfpIn: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  pfpChar: { color: colors.primary, fontWeight: '900', fontSize: 18 },

  searchContainer: { width: '100%' },
  searchBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' },
  searchInput: { flex: 1, marginLeft: 10, color: isDark ? '#FFF' : '#333', fontSize: 15, fontWeight: '600' },

  scrollContent: { paddingTop: 260, paddingBottom: 120 },
  mainContent: { paddingHorizontal: 20 },

  activeBanner: { borderRadius: 22, overflow: 'hidden', marginBottom: 25, elevation: 8 },
  bannerGrad: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerTitle: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  bannerStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800' },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF' },

  adsWrapper: { marginBottom: 30 },
  adCardContainer: { width: width - 40, marginRight: 15 },
  adCard: { height: 160, borderRadius: 25, overflow: 'hidden', backgroundColor: '#1A1A22' },
  adImage: { width: '100%', height: '100%', opacity: 0.7 },
  adOverlay: { ...StyleSheet.absoluteFillObject, padding: 15, justifyContent: 'flex-end' },
  adTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  adDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  sectionHead: { marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  subText: { fontSize: 13, color: colors.textSecondary },

  catWrap: { marginBottom: 25, flexDirection: 'row' },
  catBox: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 18, backgroundColor: isDark ? '#1C1C24' : '#FFF', marginRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  catBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catIcon: { fontSize: 16 },
  catName: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
  catNameActive: { color: '#FFF' },

  menuCard: { backgroundColor: colors.card, borderRadius: 28, marginBottom: 15, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  menuPress: { flexDirection: 'row', padding: 12, gap: 12 },
  menuImg: { width: 110, height: 110, borderRadius: 20 },
  vegTag: { position: 'absolute', top: 20, left: 20, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFF' },
  menuContent: { flex: 1, justifyContent: 'space-between' },
  menuName: { fontSize: 17, fontWeight: '900', color: colors.text },
  menuDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  menuFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuPrice: { fontSize: 20, fontWeight: '900', color: colors.primary },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2D2D3A' : '#F1F5F9', borderRadius: 12 },
  qtyBtn: { padding: 8 },
  qtyIcon: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  qtyVal: { paddingHorizontal: 8, fontWeight: '900', color: colors.text },

  cartFab: { position: 'absolute', bottom: 30, right: 30, width: 70, height: 70, borderRadius: 35, elevation: 20, shadowColor: '#FF5722', shadowOpacity: 1, shadowRadius: 25 },
  fabIn: { flex: 1, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8 },
  badgeText: { color: '#FF5722', fontSize: 13, fontWeight: '900' },

  // Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, marginBottom: 30, marginTop: 15 },
  actionItem: { alignItems: 'center', width: '22%' },
  actionIconBlur: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  actionLabel: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: 4, letterSpacing: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2 },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, marginTop: 10, fontWeight: '700' }
});
