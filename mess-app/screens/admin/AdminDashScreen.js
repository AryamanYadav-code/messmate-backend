import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  Dimensions, 
  Animated, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const StatBox = ({ label, value, icon, color, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 400 + (index * 100), useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, delay: 400 + (index * 100), useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <BlurView intensity={15} tint="dark" style={styles.statIn}>
        <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </BlurView>
    </Animated.View>
  );
};

const ActionCard = ({ title, sub, icon, onPress, badge, color, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 600 + (index * 80), useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, delay: 600 + (index * 80), useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: (width - 52) / 2, marginBottom: 12 }}>
      <TouchableOpacity style={styles.actionCard} onPress={onPress}>
        <BlurView intensity={12} tint="dark" style={styles.actionBlur}>
          <View style={[styles.actionIconWrap, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Ionicons name={icon} size={26} color={color} />
          </View>
          
          <Text style={styles.actionTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.actionSub} numberOfLines={2}>{sub}</Text>
          
          {badge > 0 && (
            <View style={[styles.badgeWrap, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AdminDashScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState({ total_orders: 0, total_users: 0, revenue: 0, scheduled_count: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchPending()]);
      setLoading(false);
    };
    init();
    
    AsyncStorage.multiGet(['role', 'name']).then((values) => {
      setUserRole(values[0][1] || '');
      setName(values[1][1] || 'Administrator');
    });

    const interval = setInterval(() => {
      fetchStats();
      fetchPending();
    }, 15000);
    return () => clearInterval(interval);
  }, []));

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats({
        total_orders: res.data?.total_orders || 0,
        total_users: res.data?.total_users || 0,
        revenue: res.data?.revenue || 0,
        scheduled_count: res.data?.scheduled_count || 0,
      });
    } catch (err) { console.log(err); }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/orders/admin/pending');
      const orders = Array.isArray(res.data) ? res.data : [];
      setPendingCount(orders.length);
    } catch (err) { console.log(err); }
  };

  const logout = () => {
    Alert.alert('Session Termination', 'Terminate secure administrative session?', [
      { text: 'ABORT', style: 'cancel' },
      { text: 'TERMINATE', style: 'destructive', onPress: async () => {
        try { await api.post('/auth/logout'); } catch (err) {}
        await AsyncStorage.clear();
        navigation.replace('Login');
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0F12', '#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />
      
      {/* Background Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]} />
      <View style={[styles.orb, { bottom: -150, right: -150, backgroundColor: 'rgba(255, 152, 0, 0.1)' }]} />
      
      <View style={styles.meshHeader}>
        <LinearGradient 
          colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']} 
          style={styles.meshGradient} 
        />
        <SafeAreaView>
          <View style={styles.header}>
            <View>
              <Text style={styles.greet}>SYSTEM PROTOCOL ALPHA</Text>
              <Text style={styles.adminName}>{name.toUpperCase()}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
                 <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
                   <Ionicons name="cog-outline" size={20} color="#FFF" />
                 </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.logoutBtn]} onPress={logout}>
                 <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
                   <Ionicons name="power-outline" size={20} color="#FF5252" />
                 </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainStatRow}>
            <BlurView intensity={20} tint="dark" style={styles.mainStatCard}>
               <View>
                  <Text style={styles.mainStatLabel}>GROSS VOLUME ARCHIVE</Text>
                  <View style={styles.revenueRow}>
                     <Text style={styles.currency}>₹</Text>
                     <Text style={styles.mainStatValue}>{stats.revenue.toLocaleString()}</Text>
                  </View>
               </View>
               <LinearGradient colors={['#FF5722', '#FF9800']} style={styles.trendingWrap}>
                  <Ionicons name="trending-up" size={20} color="#FFF" />
               </LinearGradient>
            </BlurView>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={styles.statGrid}>
             <StatBox index={0} icon="cube-outline" label="LOGGED ORDERS" value={stats.total_orders} color="#64B5F6" />
             <StatBox index={1} icon="time-outline" label="LIVE QUEUE" value={pendingCount} color="#FFD54F" />
          </View>

          <View style={styles.statGrid}>
             <StatBox index={2} icon="people-outline" label="SYSTEM USERS" value={stats.total_users} color="#81C784" />
             <StatBox index={3} icon="calendar-outline" label="PRE-ORDERS" value={stats.scheduled_count} color="#BA68C8" />
          </View>

          <Text style={styles.sectionTitle}>COMMAND PROTOCOLS</Text>
          
          <View style={styles.actionGrid}>
             <ActionCard 
               index={0}
               title="Tactical Orders" 
               sub="Verification sync" 
               icon="flash-outline" 
               color="#FF5722" 
               badge={pendingCount}
               onPress={() => navigation.navigate('OrderQueue')}
             />
             <ActionCard 
               index={1}
               title="Inventory" 
               sub="Menu & availability" 
               icon="restaurant-outline" 
               color="#448AFF" 
               onPress={() => navigation.navigate('MenuManager')}
             />
             <ActionCard 
               index={2}
               title="Analytics" 
               sub="Operational insights" 
               icon="stats-chart-outline" 
               color="#9C27B0" 
               onPress={() => navigation.navigate('Analytics')}
             />
             <ActionCard 
               index={3}
               title="Personnel" 
               sub="Operators & staff" 
               icon="shield-checkmark-outline" 
               color="#00C853" 
               onPress={() => navigation.navigate('Staff')}
             />
             <ActionCard 
               index={4}
               title="User Archive" 
               sub="Accounts & balance" 
               icon="people-outline" 
               color="#00BCD4" 
               onPress={() => navigation.navigate('Students')}
             />
             <ActionCard 
               index={5}
               title="Historic Logs" 
               sub="Transaction registry" 
               icon="archive-outline" 
               color="#607D8B" 
               onPress={() => navigation.navigate('AdminOrderHistory')}
             />
             <ActionCard 
                index={6}
                title="Ad Manager" 
                sub="Promo banners" 
                icon="megaphone-outline" 
                color="#FF9800" 
                onPress={() => navigation.navigate('AdManager')}
              />
              <ActionCard 
                index={7}
                title="Reservations" 
                sub="Temporal slots" 
                icon="time-outline" 
                color="#E91E63" 
                onPress={() => navigation.navigate('ScheduledOrders')}
              />
              <ActionCard 
                index={8}
                title="Intelligence" 
                sub="Signal feedback" 
                icon="chatbubble-ellipses-outline" 
                color="#00ACC1" 
                onPress={() => navigation.navigate('FeedbackView')}
              />
          </View>

          <View style={styles.footer}>
             <View style={styles.footerLine} />
             <Text style={styles.footerLegal}>MESSMATE ENTERPRISE OS v3.0.0</Text>
             <Text style={styles.footerSub}>SECURE ENCRYPTED SESSION ACTIVE</Text>
          </View>
      </ScrollView>

      {loading && stats.total_users === 0 && (
        <View style={styles.loadingOverlay}>
           <ActivityIndicator color="#FF5722" size="large" />
           <Text style={styles.loadingText}>SYNCING TERMINAL...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  meshHeader: { paddingBottom: 15, position: 'relative', overflow: 'hidden' },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  meshGradient: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 180, 
    opacity: 0.8 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    marginBottom: 5
  },
  greet: { color: '#FF5722', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 4 },
  adminName: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  iconBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { borderColor: 'rgba(255,82,82,0.1)' },
  
  mainStatRow: { paddingHorizontal: 25, marginTop: 25 },
  mainStatCard: { padding: 25, borderRadius: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mainStatLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  revenueRow: { flexDirection: 'row', alignItems: 'baseline' },
  currency: { color: '#FF5722', fontSize: 18, fontWeight: '900', marginRight: 4 },
  mainStatValue: { color: '#FFF', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  trendingWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  scrollBody: { padding: 20, paddingBottom: 60 },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statIn: { padding: 20 },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  statLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginTop: 4 },

  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#FF5722', letterSpacing: 3, marginTop: 45, marginBottom: 20, textAlign: 'center' },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: '100%', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionBlur: { padding: 18, alignItems: 'center', justifyContent: 'center' },
  actionIconWrap: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1 },
  actionTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: -0.2 },
  actionSub: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontWeight: '700', textAlign: 'center', paddingHorizontal: 10, lineHeight: 12 },
  badgeWrap: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  footer: { alignItems: 'center', marginTop: 50, paddingBottom: 20 },
  footerLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  footerLegal: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  footerSub: { color: 'rgba(255,82,82,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 4 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0F0F12', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  loadingText: { color: '#FF5722', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginTop: 20 }
});
