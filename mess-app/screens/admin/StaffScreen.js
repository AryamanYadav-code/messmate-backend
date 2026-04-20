import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  StatusBar,
  Dimensions,
  RefreshControl
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  Layout,
  SlideInLeft
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const StaffCard = ({ item, index, onDelete }) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 50).duration(500)}
    layout={Layout.springify()}
    style={styles.cardContainer}
  >
    <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
      <View style={styles.avatarLabel}>
        <LinearGradient
          colors={item.role === 'admin' ? ['#FF5722', '#FF9800'] : ['#4B4B50', '#2C2C2E']}
          style={styles.avatarGradient}
        >
          <Text style={styles.avatarText}>{(item?.name || item?.email || 'S').charAt(0).toUpperCase()}</Text>
        </LinearGradient>
      </View>
      
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>{item?.name || 'Unknown Operator'}</Text>
          <View style={[styles.roleBadge, { borderColor: item?.role === 'admin' ? '#FF5722' : 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.roleText, { color: item?.role === 'admin' ? '#FF5722' : 'rgba(255,255,255,0.6)' }]}>
              {(item?.role || 'staff').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.nodeId}>ID: {(item?.user_id?.toString() || '00000').slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.timestamp}>Joined: {item?.created_at ? new Date(item.created_at).toLocaleDateString() : 'Historical'}</Text>
      </View>

      <TouchableOpacity 
        onPress={() => onDelete(item.user_id)}
        style={styles.deleteAction}
      >
        <BlurView intensity={25} tint="light" style={styles.deleteBlur}>
          <Text style={styles.deleteIcon}>×</Text>
        </BlurView>
      </TouchableOpacity>
    </BlurView>
  </Animated.View>
);

export default function StaffScreen({ navigation }) {
  const { colors } = useTheme();
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchStaff();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff', {
        params: { search: search || undefined }
      });
      setStaff(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert('System Error', 'Could not access personnel records.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  }, [search]);

  const handleDelete = (id) => {
    Alert.alert(
      'Unauthorized Access Node',
      'Are you sure you want to decommission this staff profile?',
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'EXECUTE', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/staff/${id}`);
              fetchStaff();
            } catch (err) {
              Alert.alert('Protocol Failure', 'Decommissioning failed.');
            }
          }
        }
      ]
    );
  };

  const filteredStaff = staff || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0F12', '#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />
      
      {/* Background Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]} />
      <View style={[styles.orb, { bottom: -150, right: -150, backgroundColor: 'rgba(255, 152, 0, 0.1)' }]} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <LinearGradient 
            colors={['rgba(255, 87, 34, 0.6)', 'rgba(255, 87, 34, 0.2)', 'transparent']} 
            style={styles.headerMesh} 
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                <Text style={styles.backIcon}>‹</Text>
             </BlurView>
          </TouchableOpacity>
          <View style={styles.titleArea}>
            <Text style={styles.subtitle}>PERSONNEL REGISTRY</Text>
            <Text style={styles.title}>System Operators</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{staff.length}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <BlurView intensity={10} tint="dark" style={styles.searchBlur}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search Personnel Database..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </BlurView>
        </View>

        <FlatList
          data={filteredStaff}
          keyExtractor={item => String(item.user_id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item, index }) => (
            <StaffCard item={item} index={index} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Text style={styles.emptyIcon}>👤</Text>
               <Text style={styles.emptyText}>Personnel registry is offline</Text>
               <Text style={styles.emptySubText}>No operators found matching current search parameters.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
          }
        />

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => Alert.alert('Protocol Info', 'Registration must be performed via System Auth Terminal.')}
        >
          <LinearGradient colors={['#FF5722', '#FF9800']} style={styles.fabGradient}>
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingVertical: 15 
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 15, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)', 
  },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 32, color: '#FFF', fontWeight: '200', marginTop: -4 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  titleArea: { alignItems: 'center' },
  subtitle: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  countBadge: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  countText: { color: '#FF5722', fontWeight: '900', fontSize: 16 },
  
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBlur: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    height: 54, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  searchIcon: { fontSize: 16, marginRight: 12, opacity: 0.6 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  
  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' },
  cardContainer: { width: (width - 48) / 2, marginBottom: 16, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardBlur: { padding: 16, alignItems: 'center' },
  avatarLabel: { marginBottom: 16 },
  avatarGradient: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  cardInfo: { alignItems: 'center' },
  nameRow: { alignItems: 'center', marginBottom: 8 },
  username: { fontSize: 15, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  roleText: { fontSize: 8, fontWeight: '900' },
  nodeId: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 4 },
  timestamp: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.2)', marginTop: 2 },
  
  deleteAction: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, overflow: 'hidden', zIndex: 10 },
  deleteBlur: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,82,82,0.1)' },
  deleteIcon: { fontSize: 14, color: 'rgba(255,82,82,0.6)', fontWeight: '900' },

  fab: { position: 'absolute', bottom: 30, right: 20, borderRadius: 24, overflow: 'hidden', elevation: 10 },
  fabGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  fabText: { fontSize: 32, color: '#FFF', fontWeight: '300' },

  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, opacity: 0.2, marginBottom: 20 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '800' },
  emptySubText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 }
});
