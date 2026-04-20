import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl, 
  StatusBar,
  Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  Layout,
  SlideInRight
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
  delivered: { 
    color: '#4CAF50', 
    label: 'DELIVERED', 
    icon: '✓',
    gradient: ['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.05)']
  },
  cancelled: { 
    color: '#FF5252', 
    label: 'CANCELLED', 
    icon: '✕',
    gradient: ['rgba(255, 82, 82, 0.2)', 'rgba(255, 82, 82, 0.05)']
  },
  rejected: { 
    color: '#FF5252', 
    label: 'REJECTED', 
    icon: '!',
    gradient: ['rgba(255, 82, 82, 0.2)', 'rgba(255, 82, 82, 0.05)']
  },
  pending: { 
    color: '#FF9800', 
    label: 'PENDING', 
    icon: '⟳',
    gradient: ['rgba(255, 152, 0, 0.2)', 'rgba(255, 152, 0, 0.05)']
  }
};

const HistoryCard = ({ item, index }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 40).duration(500)}
      style={{ width: (width - 48) / 2, marginBottom: 16 }}
    >
      <BlurView intensity={15} tint="dark" style={styles.historyTile}>
        <View style={styles.tileHeader}>
          <View style={[styles.statusMini, { backgroundColor: status.color + '15' }]}>
             <Text style={[styles.statusIconMini, { color: status.color }]}>{status.icon}</Text>
          </View>
          <Text style={styles.idMini}>#{item.order_id}</Text>
        </View>

        <View style={styles.tileBody}>
          <Text style={styles.studentNameMini} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.dateMini}>
            {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
          
          <View style={styles.itemsSummary}>
            {(Array.isArray(item.items) ? item.items : JSON.parse(item.items || '[]')).slice(0, 1).map((prod, idx) => (
              <Text key={idx} style={styles.itemTextMini} numberOfLines={1}>
                {prod.quantity}x {prod.name}
              </Text>
            ))}
            {(Array.isArray(item.items) ? item.items : JSON.parse(item.items || '[]')).length > 1 && (
              <Text style={styles.moreItemsMini}>+{(Array.isArray(item.items) ? item.items : JSON.parse(item.items || '[]')).length - 1} more</Text>
            )}
          </View>
        </View>

        <View style={styles.tileFooter}>
          <Text style={styles.amountMini}>₹{parseFloat(item.total_amount).toLocaleString()}</Text>
          <View style={styles.slotMini}>
            <Text style={styles.slotLabelMini}>
              {item.meal_slot === 'breakfast' ? '🍳' : 
               item.meal_slot === 'lunch' ? '☀️' : 
               item.meal_slot === 'dinner' ? '🌙' : '🍪'}
            </Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

export default function AdminOrderHistoryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/admin/history', {
        params: { search: searchQuery || undefined }
      });
      setOrders(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);
  
  const filteredOrders = orders || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <LinearGradient 
            colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']} 
            style={styles.headerMesh} 
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>TEMPORAL REGISTRY</Text>
            <Text style={styles.headerTitle}>Order Archives</Text>
          </View>
          <View style={styles.statsBadge}>
             <Text style={styles.statsText}>{orders.length}</Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <BlurView intensity={10} tint="dark" style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID or Student..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.order_id.toString()}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
          }
          renderItem={({ item, index }) => (
            <HistoryCard item={item} index={index} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyText}>Empty Archives</Text>
              <Text style={styles.emptySub}>No historic operational data found.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    zIndex: 10
  },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 28, color: '#FFF', marginLeft: -2 },
  headerTitleContainer: { alignItems: 'center' },
  headerSubtitle: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  statsBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 87, 34, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 87, 34, 0.2)' },
  statsText: { color: '#FF5722', fontWeight: '900', fontSize: 16 },
  
  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    height: 48, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  searchInput: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 14 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  historyTile: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 180, justifyContent: 'space-between' },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  statusMini: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  statusIconMini: { fontSize: 12, fontWeight: '900' },
  idMini: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 },

  tileBody: { paddingHorizontal: 12, flex: 1 },
  studentNameMini: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  dateMini: { fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2, fontWeight: '600' },
  itemsSummary: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 8, flex: 1 },
  itemTextMini: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  moreItemsMini: { fontSize: 8, color: '#FF5722', fontWeight: '800', marginTop: 2 },

  tileFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)' },
  amountMini: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  slotMini: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 4 },
  slotLabelMini: { fontSize: 12 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, opacity: 0.2, marginBottom: 20 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '800' },
  emptySub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }
});
