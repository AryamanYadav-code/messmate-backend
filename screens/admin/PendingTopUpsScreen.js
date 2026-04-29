import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

export default function PendingTopUpsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/wallet/pending');
      setRequests(res.data || []);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerify = async (transaction_id, status) => {
    const action = status === 'completed' ? 'Approve' : 'Reject';
    Alert.alert(
      `${action} Transaction?`,
      `Are you sure you want to ${action.toLowerCase()} this wallet top-up?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.toUpperCase(), 
          style: status === 'completed' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.post('/wallet/verify', { transaction_id, status });
              Alert.alert('Success', `Transaction ${status === 'completed' ? 'approved' : 'rejected'} successfully.`);
              fetchPendingRequests();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to update transaction');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingRequests();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loaderText}>SCANNING INCOMING TRANSFERS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F12', '#1A1A1E']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaHeader navigation={navigation} title="Wallet Verification" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyTitle}>NO PENDING REQUESTS</Text>
            <Text style={styles.emptySub}>System clear. All recharges are processed.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {requests.map((item, index) => (
              <RequestCard 
                key={item.transaction_id} 
                item={item} 
                index={index} 
                onVerify={handleVerify}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const RequestCard = ({ item, index, onVerify }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.card}>
      <BlurView intensity={10} tint="dark" style={styles.cardBlur}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user_name || 'Student'}</Text>
            <Text style={styles.userId}>ID: {item.user_id}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountSymbol}>₹</Text>
            <Text style={styles.amountText}>{item.amount}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="key-outline" size={16} color="rgba(255,255,255,0.3)" />
          <Text style={styles.detailLabel}>UTR / REF:</Text>
          <Text style={styles.detailValue}>{item.transaction_ref || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.3)" />
          <Text style={styles.detailLabel}>REQUESTED:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => onVerify(item.transaction_id, 'rejected')}
          >
            <Text style={styles.rejectBtnText}>REJECT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]} 
            onPress={() => onVerify(item.transaction_id, 'completed')}
          >
            <LinearGradient 
              colors={['#4CAF50', '#388E3C']} 
              style={styles.approveGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={styles.approveBtnText}>APPROVE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const SafeAreaHeader = ({ navigation, title }) => (
  <View style={headerStyles.header}>
    <TouchableOpacity style={headerStyles.backBtn} onPress={() => navigation.goBack()}>
      <BlurView intensity={15} tint="light" style={headerStyles.backBlur}>
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </BlurView>
    </TouchableOpacity>
    <Text style={headerStyles.headerTitle}>{title}</Text>
    <View style={{ width: 44 }} />
  </View>
);

const headerStyles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  loaderContainer: { flex: 1, backgroundColor: '#0F0F12', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#FF5722', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginTop: 20 },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  list: { gap: 16 },
  
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardBlur: { padding: 20 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  userId: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', marginTop: 2 },
  
  amountBox: { flexDirection: 'row', alignItems: 'baseline' },
  amountSymbol: { color: '#FF5722', fontSize: 14, fontWeight: '900', marginRight: 4 },
  amountText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  detailLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900', letterSpacing: 1, width: 80 },
  detailValue: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, height: 48, borderRadius: 12, overflow: 'hidden' },
  
  rejectBtn: { backgroundColor: 'rgba(255,82,82,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)' },
  rejectBtnText: { color: '#FF5252', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  
  approveBtn: { elevation: 4 },
  approveGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  approveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginTop: 20 },
  emptySub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 }
});
