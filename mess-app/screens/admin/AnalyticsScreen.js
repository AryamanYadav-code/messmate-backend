import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const StatCard = ({ label, value, subValue, index, icon, gradient }) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(600)}
      style={styles.statCardContainer}
    >
      <BlurView intensity={18} tint="dark" style={styles.statBlur}>
        <View style={styles.statHeader}>
          <View style={[styles.statIconContainer, { backgroundColor: gradient ? 'transparent' : 'rgba(255,255,255,0.05)', borderColor: gradient ? 'transparent' : 'rgba(255,255,255,0.08)' }]}>
            {gradient ? (
              <LinearGradient colors={gradient} style={styles.statIconGradient}>
                <Text style={styles.statIcon}>{icon}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.statIcon}>{icon}</Text>
            )}
          </View>
          <Text style={styles.statSubValue}>{subValue}</Text>
        </View>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </BlurView>
    </Animated.View>
  );
};

// Custom Animated Bar for Meal Slots
const AnimatedBar = ({ value, maxValue, label, color, delay }) => {
  const heightAnim = useSharedValue(0);
  
  useEffect(() => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    heightAnim.value = withTiming(percentage, { duration: 1000 });
  }, [value, maxValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${heightAnim.value}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.barColumn}>
      <Text style={styles.barValue}>{value}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, animatedStyle, { backgroundColor: color }]} />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </Animated.View>
  );
};

// Custom Horizontal Bar for Revenue
const HorizontalBar = ({ label, value, maxValue, color, delay }) => {
  const widthAnim = useSharedValue(0);
  
  useEffect(() => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    widthAnim.value = withTiming(percentage, { duration: 1000 });
  }, [value, maxValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.hBarContainer}>
      <View style={styles.hBarHeader}>
        <Text style={styles.hBarLabel}>{label}</Text>
        <Text style={styles.hBarValue}>₹{value.toLocaleString()}</Text>
      </View>
      <View style={styles.hBarTrack}>
        <Animated.View style={[styles.hBarFill, animatedStyle, { backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
};

export default function AnalyticsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setData(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, []);

  if (loading) return (
    <View style={[styles.container, styles.loadingFull]}>
      <LinearGradient colors={['#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />
      <Text style={styles.loadingText}>Synthesizing Intelligence...</Text>
    </View>
  );

  const SLOT_COLORS = {
    breakfast: '#FF9800',
    lunch: '#FF5722',
    dinner: '#9C27B0',
    snacks: '#00BCD4'
  };

  const slots = data?.bySlot || [];
  const maxSlotCount = Math.max(...(slots.length > 0 ? slots.map(s => parseInt(s.count)) : [1]));

  const revenueData = data?.revenueByDay || [];
  const maxRevenue = Math.max(...(revenueData.length > 0 ? revenueData.map(d => parseFloat(d.revenue)) : [1]));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />

      <View style={{ flex: 1, paddingTop: insets.top }}>
          <LinearGradient 
            colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']} 
            style={styles.headerMesh} 
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>ADMIN INTELLIGENCE</Text>
            <Text style={styles.headerTitle}>Operational Insights</Text>
          </View>
          <View style={styles.liveIndicator}>
             <View style={styles.liveDot} />
             <Text style={styles.liveText}>LIVE</Text>
          </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#FF5722" 
              colors={['#FF5722']}
            />
          }
        >
          {/* Top Metric Cards */}
          <View style={styles.statsGrid}>
            <StatCard 
              index={0}
              label="TOTAL REVENUE"
              value={`₹${parseFloat(data?.totalStats?.total_revenue || 0).toLocaleString()}`}
              subValue="GLOBAL"
              icon="💰"
              gradient={['#FF5722', '#FF9800']}
            />
            <StatCard 
              index={1}
              label="TOTAL ORDERS"
              value={data?.totalStats?.total_orders || '0'}
              subValue="+12%"
              icon="📦"
            />
            <StatCard 
              index={2}
              label="PRE-ORDERS"
              value={data?.totalStats?.scheduled_orders || '0'}
              subValue="ACTIVE"
              icon="🕒"
            />
            <StatCard 
              index={3}
              label="NEW USERS"
              value={`+${data?.newStudents || 0}`}
              subValue="WEEKLY"
              icon="👥"
            />
          </View>

          {/* Rating Intelligence */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.sectionCard}>
            <BlurView intensity={10} tint="dark" style={styles.glassInner}>
              <View style={styles.ratingRow}>
                <View style={styles.ratingMain}>
                  <Text style={styles.ratingLarge}>{parseFloat(data?.avgRating?.avg_rating || 0).toFixed(1)}</Text>
                  <View style={styles.starsRow}>
                    {'★★★★★'.split('').map((s, i) => (
                      <Text key={i} style={[styles.star, { color: i < Math.round(data?.avgRating?.avg_rating || 0) ? '#FFD700' : 'rgba(255,255,255,0.1)' }]}>{s}</Text>
                    ))}
                  </View>
                  <Text style={styles.totalReviews}>{data?.avgRating?.total_reviews || 0} REVIEWS</Text>
                </View>
                <View style={styles.ratingDist}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const found = data?.ratingDist?.find(r => parseInt(r.rating) === star);
                    const count = found ? parseInt(found.count) : 0;
                    const total = parseInt(data?.avgRating?.total_reviews || 1);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <View key={star} style={styles.distRow}>
                        <Text style={styles.distLabel}>{star}★</Text>
                        <View style={styles.distBarBg}>
                          <View style={[styles.distBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.distCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Revenue Architecture */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>REVENUE BY DAY</Text>
            <View style={styles.revenueList}>
              {revenueData.length > 0 ? revenueData.map((d, index) => {
                const date = new Date(d.date);
                const label = `${date.getDate()}/${date.getMonth() + 1}`;
                return (
                  <HorizontalBar 
                    key={index}
                    delay={500 + (index * 50)}
                    label={label}
                    value={parseFloat(d.revenue)}
                    maxValue={maxRevenue}
                    color="#FF5722"
                  />
                );
              }) : (
                <Text style={styles.noData}>No recent revenue data.</Text>
              )}
            </View>
          </Animated.View>

          {/* Meal Slots Distribution */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>MEAL SLOTS</Text>
            <View style={styles.barChartContainer}>
              {slots.length > 0 ? slots.map((s, index) => (
                <AnimatedBar 
                  key={index}
                  delay={600 + (index * 50)}
                  value={parseInt(s.count)}
                  maxValue={maxSlotCount}
                  label={s.meal_slot?.charAt(0).toUpperCase() + s.meal_slot?.slice(1)}
                  color={SLOT_COLORS[s.meal_slot] || '#888'}
                />
              )) : (
                <Text style={styles.noData}>No slot data available.</Text>
              )}
            </View>
          </Animated.View>

          {/* Elite Performance: Top Items */}
          <Animated.View entering={FadeInDown.delay(700)} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ELITE PERFORMANCE: TOP DISHES</Text>
            {data?.topItems?.map((item, index) => (
              <View key={index} style={styles.topItemRow}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>0{index + 1}</Text>
                </View>
                <View style={[styles.vegStatus, { backgroundColor: item.is_veg ? '#4CAF50' : '#FF5252' }]} />
                <View style={styles.itemMeta}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemCat}>{item.category.toUpperCase()}</Text>
                </View>
                <View style={styles.itemStats}>
                  <Text style={styles.itemOrders}>{item.total_ordered} ORDERS</Text>
                  <Text style={styles.itemRevenue}>₹{parseFloat(item.total_revenue).toLocaleString()}</Text>
                </View>
              </View>
            ))}
            {(!data?.topItems || data.topItems.length === 0) && (
              <Text style={styles.noData}>Awaiting order data visualization...</Text>
            )}
          </Animated.View>

        </ScrollView>
      </View>

      <View style={styles.bottomMesh}>
         <View style={styles.blurOrb} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  loadingFull: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FF5722', fontWeight: '800', letterSpacing: 2 },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 10
  },
  backIcon: { fontSize: 28, color: '#FFF', marginLeft: -2 },
  headerTitleContainer: { alignItems: 'center', marginTop: 10, marginBottom: 15 },
  headerSubtitle: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  liveIndicator: { position: 'absolute', right: 20, top: 55, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 82, 82, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5252' },
  liveText: { fontSize: 10, fontWeight: '900', color: '#FF5252' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCardContainer: { width: (width - 52) / 2, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statBlur: { padding: 18 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statIconContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statIconGradient: { width: '100%', height: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statIcon: { fontSize: 16 },
  statSubValue: { fontSize: 9, fontWeight: '900', color: '#FF5722', opacity: 0.8 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 6, letterSpacing: -0.5 },
  statLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' },

  sectionCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  glassInner: { borderRadius: 16, overflow: 'hidden', padding: 16, backgroundColor: 'rgba(0,0,0,0.2)' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 16 },
  
  ratingRow: { flexDirection: 'row', gap: 20 },
  ratingMain: { alignItems: 'center', justifyContent: 'center', paddingRight: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  ratingLarge: { fontSize: 44, fontWeight: '900', color: '#FFF' },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  star: { fontSize: 12 },
  totalReviews: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
  ratingDist: { flex: 1, gap: 4, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.3)', width: 22 },
  distBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  distBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  distCount: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.3)', width: 20, textAlign: 'right' },

  // Custom Chart Styles
  barChartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingTop: 20 },
  barColumn: { alignItems: 'center', width: 40, height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: 12, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end', marginVertical: 8 },
  barFill: { width: '100%', borderRadius: 6 },
  barValue: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  barLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },

  revenueList: { gap: 12 },
  hBarContainer: { width: '100%' },
  hBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hBarLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  hBarValue: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  hBarTrack: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  hBarFill: { height: '100%', borderRadius: 4 },

  topItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  rankContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rankText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '900' },
  vegStatus: { width: 4, height: 20, borderRadius: 2, marginHorizontal: 12 },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  itemCat: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 2 },
  itemStats: { alignItems: 'flex-end' },
  itemOrders: { fontSize: 11, fontWeight: '900', color: '#FF5722' },
  itemRevenue: { fontSize: 11, fontWeight: '700', color: '#FFF', marginTop: 2 },
  noData: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 30, fontSize: 12, fontWeight: '600', fontStyle: 'italic' },

  bottomMesh: { position: 'absolute', bottom: -100, left: 0, right: 0, height: 300, zIndex: -1, opacity: 0.1 },
  blurOrb: { width: width, height: 300, backgroundColor: '#FF5722', borderRadius: width/2 },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 }
});
