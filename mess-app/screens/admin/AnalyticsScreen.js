import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const chartWidth = width - 32;

const getChartConfig = (colors, isDark) => ({
  backgroundColor: colors.card,
  backgroundGradientFrom: colors.card,
  backgroundGradientTo: colors.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
  labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(100, 100, 100, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border }
});

export default function AnalyticsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const chartConfig = getChartConfig(colors, isDark);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 30 }}/>
      </View>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    </SafeAreaView>
  );

  const revenueData = {
    labels: data?.revenueByDay?.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }) || ['No data'],
    datasets: [{ data: data?.revenueByDay?.map(d => parseFloat(d.revenue)) || [0] }]
  };

  const slotData = {
    labels: data?.bySlot?.map(s => s.meal_slot?.charAt(0).toUpperCase() + s.meal_slot?.slice(1)) || [],
    datasets: [{ data: data?.bySlot?.map(s => parseInt(s.count)) || [] }]
  };

  const SLOT_COLORS = {
    breakfast: '#FF9800',
    lunch: '#6C63FF',
    dinner: '#4CAF50',
    snacks: '#f44336'
  };

  const pieData = data?.bySlot?.map(s => ({
    name: s.meal_slot,
    population: parseInt(s.count),
    color: SLOT_COLORS[s.meal_slot] || '#888',
    legendFontColor: colors.text,
    legendFontSize: 12
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 30 }}/>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}> 

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#6C63FF' }]}>
            <Text style={styles.statNumWhite}>₹{parseFloat(data?.totalStats?.total_revenue || 0).toFixed(0)}</Text>
            <Text style={styles.statLabelWhite}>Total Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data?.totalStats?.total_orders || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data?.totalStats?.scheduled_orders || 0}</Text>
            <Text style={styles.statLabel}>Pre-Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>+{data?.newStudents || 0}</Text>
            <Text style={styles.statLabel}>New this week</Text>
          </View>
        </View>

        {/* Rating Summary */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingNum}>
              {parseFloat(data?.avgRating?.avg_rating || 0).toFixed(1)}
            </Text>
            <Text style={styles.ratingStars}>★★★★★</Text>
            <Text style={styles.ratingTotal}>{data?.avgRating?.total_reviews || 0} reviews</Text>
          </View>
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map(star => {
              const found = data?.ratingDist?.find(r => parseInt(r.rating) === star);
              const count = found ? parseInt(found.count) : 0;
              const total = parseInt(data?.avgRating?.total_reviews || 1);
              const pct = (count / total) * 100;
              return (
                <View key={star} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{star}★</Text>
                  <View style={styles.ratingBarBg}>
                    <View style={[styles.ratingBarFill, { width: `${pct}%` }]}/>
                  </View>
                  <Text style={styles.ratingBarCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Revenue Chart */}
        {data?.revenueByDay?.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue — Last 7 Days</Text>
            <LineChart
              data={revenueData}
              width={chartWidth - 32}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Orders by Slot */}
        {slotData.labels.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Orders by Meal Slot</Text>
            <BarChart
              data={slotData}
              width={chartWidth - 32}
              height={180}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Slot Distribution</Text>
            <PieChart
              data={pieData}
              width={chartWidth - 32}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>
        )}

        {/* Top Items */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top 5 Most Ordered Items</Text>
          {data?.topItems?.map((item, index) => (
            <View key={index} style={styles.topItemRow}>
              <View style={styles.topItemRank}>
                <Text style={styles.topItemRankText}>{index + 1}</Text>
              </View>
              <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#f44336' }]}/>
              <View style={styles.topItemInfo}>
                <Text style={styles.topItemName}>{item.name}</Text>
                <Text style={styles.topItemCategory}>{item.category}</Text>
              </View>
              <View style={styles.topItemStats}>
                <Text style={styles.topItemCount}>{item.total_ordered} orders</Text>
                <Text style={styles.topItemRevenue}>₹{parseFloat(item.total_revenue).toFixed(0)}</Text>
              </View>
            </View>
          ))}
          {(!data?.topItems || data.topItems.length === 0) && (
            <Text style={styles.noData}>No order data yet</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.headerText, fontSize: 32, lineHeight: 36 },
  headerTitle: { color: colors.headerText, fontSize: 18, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: colors.textSecondary },
  content: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, width: '47%', elevation: 2 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  statNumWhite: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statLabelWhite: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ratingCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14, flexDirection: 'row', gap: 16, elevation: 2 },
  ratingLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  ratingNum: { fontSize: 36, fontWeight: 'bold', color: colors.warning },
  ratingStars: { fontSize: 14, color: colors.warning },
  ratingTotal: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  ratingBars: { flex: 1, justifyContent: 'center', gap: 4 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBarLabel: { fontSize: 11, color: colors.textSecondary, width: 20 },
  ratingBarBg: { flex: 1, height: 6, backgroundColor: colors.tabBackground, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: colors.warning, borderRadius: 3 },
  ratingBarCount: { fontSize: 11, color: colors.textSecondary, width: 20, textAlign: 'right' },
  chartCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2 },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  chart: { borderRadius: 10 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.divider },
  topItemRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  topItemRankText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  topItemInfo: { flex: 1 },
  topItemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  topItemCategory: { fontSize: 11, color: colors.textSecondary, marginTop: 1, textTransform: 'capitalize' },
  topItemStats: { alignItems: 'flex-end' },
  topItemCount: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  topItemRevenue: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  noData: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
});
