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
  RefreshControl,
  Image
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  Layout,
  SlideInRight
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const StudentCard = ({ item, index, onAction }) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 30).duration(400)}
    layout={Layout.springify()}
    style={styles.cardContainer}
  >
    <BlurView intensity={10} tint="dark" style={styles.cardBlur}>
      <View style={styles.cardMain}>
        <View style={styles.profileSection}>
          <LinearGradient
            colors={['#2C2C2E', '#1A1A1E']}
            style={styles.avatarContainer}
          >
            <Text style={styles.avatarText}>{(item?.name || item?.email || 'S').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.metaInfo}>
            <Text style={styles.username}>{item?.name || 'Unknown Student'}</Text>
            <Text style={styles.email}>{item?.email || 'No Email Record'}</Text>
            <Text style={styles.nodeId}>UID: {String(item?.user_id || 'UNKNOWN').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.balanceSection}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>WALLET</Text>
            <Text style={styles.balanceValue}>₹{parseFloat(item.wallet_balance || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.balanceItem}>
             <Text style={styles.balanceLabel}>ORDERS</Text>
             <Text style={styles.balanceValue}>{item.total_orders || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionStrip}>
        <TouchableOpacity style={styles.stripButton} onPress={() => onAction('view', item)}>
          <Text style={styles.stripButtonText}>MONITOR</Text>
        </TouchableOpacity>
        <View style={styles.stripDivider} />
        <TouchableOpacity style={styles.stripButton} onPress={() => onAction('adjust', item)}>
          <Text style={[styles.stripButtonText, { color: '#FF9800' }]}>CREDIT</Text>
        </TouchableOpacity>
        <View style={styles.stripDivider} />
        <TouchableOpacity style={styles.stripButton} onPress={() => onAction('remove', item)}>
          <Text style={[styles.stripButtonText, { color: '#f44336' }]}>REMOVE</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  </Animated.View>
);

export default function StudentsScreen({ navigation }) {
  const { colors } = useTheme();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students', {
        params: { search: search || undefined }
      });
      setStudents(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert('Database Error', 'Unable to reach Student Data Center.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  }, [search]);

  const handleAction = (type, student) => {
    if (type === 'adjust') {
      Alert.prompt(
        'Balance Adjustment',
        `Enter credit amount for ${student.name}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'APPLY', 
            onPress: async (amt) => {
              if (isNaN(amt)) return Alert.alert('Error', 'Invalid numeric input.');
              try {
                await api.post(`/admin/students/${student.user_id}/adjust-balance`, { amount: parseFloat(amt) });
                fetchStudents();
              } catch (err) {
                Alert.alert('Protocol Error', 'Adjustment failed.');
              }
            } 
          }
        ],
        'plain-text',
        '',
        'numeric'
      );
    } else if (type === 'remove') {
      Alert.alert(
        'Account Management',
        `Manage ${student.name}'s account:`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Deactivate (Soft)', 
            onPress: () => confirmRemoval(student, 'soft'),
          },
          { 
            text: 'Delete Permanently (Hard)', 
            style: 'destructive',
            onPress: () => confirmRemoval(student, 'hard')
          }
        ]
      );
    } else {
       // View details logic
       Alert.alert('Intelligence Insight', `Profile: ${student?.name || 'Unknown'}\nEmail: ${student?.email}\nJoined: ${student?.created_at ? new Date(student.created_at).toLocaleString() : 'N/A'}`);
    }
  };

  const confirmRemoval = (student, mode) => {
    const title = mode === 'soft' ? 'Deactivate Account' : 'Permanent Deletion';
    const msg = mode === 'soft' 
      ? 'This will prevent the student from logging in but preserve their data.'
      : 'WARNING: This will permanently delete the student and all their order history, transactions, and feedback. This cannot be undone.';

    Alert.alert(
      title,
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: mode === 'soft' ? 'Deactivate' : 'DELETE PERMANENTLY',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/students/${student.user_id}?mode=${mode}`);
              Alert.alert('Success', `Student ${mode === 'soft' ? 'deactivated' : 'removed'} successfully.`);
              fetchStudents();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Removal failed.');
            }
          }
        }
      ]
    );
  };

  const filteredStudents = students || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0F12', '#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />
      
      {/* Background Orbs */}
      <View style={[styles.orb, { top: -80, right: -100, backgroundColor: 'rgba(255, 87, 34, 0.12)' }]} />
      <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: 'rgba(255, 152, 0, 0.08)' }]} />
      
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
            <Text style={styles.subtitle}>USER ARCHIVE</Text>
            <Text style={styles.title}>Student Directory</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{students.length}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <BlurView intensity={10} tint="dark" style={styles.searchBlur}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Query User Archive..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </BlurView>
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={item => String(item.user_id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item, index }) => (
            <StudentCard item={item} index={index} onAction={handleAction} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Text style={styles.emptyIcon}>🛰️</Text>
               <Text style={styles.emptyText}>Archive Stream Empty</Text>
               <Text style={styles.emptySubText}>No user records detected in the current sector.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
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
  cardBlur: { },
  cardMain: { padding: 16, alignItems: 'center' },
  profileSection: { alignItems: 'center', marginBottom: 12 },
  avatarContainer: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  metaInfo: { alignItems: 'center', marginLeft: 0 },
  username: { fontSize: 16, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  email: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textAlign: 'center' },
  nodeId: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.2)', letterSpacing: 1, marginTop: 4 },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12, width: '100%' },
  
  balanceSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 2 },
  balanceValue: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  verticalDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.05)' },

  actionStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  stripButton: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center' },
  stripButtonText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  stripDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.05)' },

  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, opacity: 0.2, marginBottom: 20 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '800' },
  emptySubText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  headerMesh: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: -1 }
});
