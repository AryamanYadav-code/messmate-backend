import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInRight, Layout, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function WalletScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('STUDENT');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(['user_id', 'user_name']).then(values => {
      const id = values[0][1];
      const name = values[1][1];
      setUserId(id);
      if (name) setUserName(name);
      fetchBalance(id);
      fetchHistory(id);
    });
  }, []);

  const fetchBalance = async (id) => {
    try {
      const res = await api.get(`/wallet/balance/${id}`);
      setBalance(res.data.balance);
    } catch (err) { console.log(err); }
  };

  const fetchHistory = async (id) => {
    try {
      const res = await api.get(`/wallet/history/${id}`);
      setHistory(res.data);
    } catch (err) { console.log(err); }
  };

  const addMoney = async (quickAmount) => {
    const finalAmount = quickAmount || parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) return Alert.alert('Error', 'Enter a valid amount');
    setLoading(true);
    try {
      await api.post('/wallet/add', {
        user_id: parseInt(userId),
        amount: finalAmount,
        payment_method: 'UPI'
      });
      Alert.alert('Success! 🎉', `₹${finalAmount} added to wallet!`);
      setAmount('');
      fetchBalance(userId);
      fetchHistory(userId);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add money');
    } finally { setLoading(false); }
  };

  const QUICK_AMOUNTS = [50, 100, 200, 500];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F0F12', '#12121A']} style={styles.fullBg} />
      
      {/* Dynamic Glass Orbs for Visual Depth */}
      <View style={[styles.orb, { top: -60, right: -60, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]} />
      <View style={[styles.orb, { bottom: 120, left: -90, backgroundColor: 'rgba(255, 87, 34, 0.08)' }]} />
      <View style={[styles.orb, { top: height * 0.4, right: -100, width: 300, height: 300, backgroundColor: 'rgba(103, 58, 183, 0.05)' }]} />

      <SafeAreaHeader navigation={navigation} title="Digital Wallet" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* The Card Component */}
        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.cardContainer}>
          <LinearGradient
            colors={['#2A2A35', '#12121A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Card Texture Overlay */}
            <View style={styles.cardTexture} />
            
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardBrand}>SRM_KITCHEN <Text style={{ color: '#FF5722' }}>LUXURY</Text></Text>
                <Text style={styles.cardType}>Premium Student Access</Text>
              </View>
              <View style={styles.cardChip}>
                 <LinearGradient colors={['#FFD700', '#B8860B']} style={{ flex: 1, borderRadius: 6 }} />
              </View>
            </View>
            
            <View style={styles.cardMiddle}>
              <Text style={styles.balanceLabel}>Available Funds</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.balanceAmount}>{parseFloat(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardHolderName}>{userName.toUpperCase()}</Text>
                <Text style={styles.cardNumber}>**** **** **** 2024</Text>
              </View>
              <View style={styles.contactlessIcon}>
                 <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>📶</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Glass Overlay for depth */}
          <BlurView intensity={10} tint="light" style={styles.glassOverlay} />
        </Animated.View>

        {/* Action Section */}
        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.actionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Funds</Text>
          </View>
          
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((amt, index) => (
              <TouchableOpacity 
                key={amt} 
                activeOpacity={0.7}
                style={styles.quickBtn} 
                onPress={() => addMoney(amt)}
              >
                <Text style={styles.quickBtnAmount}>+₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                cursorColor="#FF5722"
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.addBtn, loading && styles.addBtnDisabled]}
              onPress={() => addMoney(null)}
              disabled={loading}
            >
              <LinearGradient 
                colors={['#FF5722', '#F4511E']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addGradient}
              >
                <Text style={styles.addBtnText}>{loading ? '...' : 'RECHARGE'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* History Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>

          {history.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(600)} style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyIcon}>💸</Text>
              </View>
              <Text style={styles.emptyText}>No recent transactions</Text>
            </Animated.View>
          ) : (
            <View style={styles.txnList}>
              {history.map((item, index) => (
                <TransactionRow key={item.txn_id} item={item} index={index} styles={styles} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const SafeAreaHeader = ({ navigation, title }) => (
  <View style={headerStyles.header}>
    <TouchableOpacity style={headerStyles.backBtn} onPress={() => navigation.goBack()}>
      <BlurView intensity={15} tint="light" style={headerStyles.backBlur}>
        <Text style={headerStyles.backIcon}>←</Text>
      </BlurView>
    </TouchableOpacity>
    <Text style={headerStyles.headerTitle}>{title}</Text>
    <View style={{ width: 44 }} />
  </View>
);

const TransactionRow = ({ item, index, styles }) => {
  const isCredit = item.type === 'credit';
  return (
    <Animated.View 
      entering={FadeInRight.duration(500).delay(600 + (index * 100))}
      style={styles.txnCard}
    >
      <View style={[styles.txnIconBox, { backgroundColor: isCredit ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 87, 34, 0.1)' }]}>
        <Text style={[styles.txnIcon, { color: isCredit ? '#4CAF50' : '#FF5722' }]}>
          {isCredit ? '↓' : '↑'}
        </Text>
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnType}>{isCredit ? 'Wallet Top-up' : 'Food Purchase'}</Text>
        <Text style={styles.txnDate}>
          {new Date(item.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>
      <Text style={[styles.txnAmount, { color: isCredit ? '#4CAF50' : '#FFFFFF' }]}>
        {isCredit ? '+' : '-'}₹{item.amount}
      </Text>
    </Animated.View>
  );
};

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
  backIcon: { color: '#FFF', fontSize: 22, fontWeight: '300' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
});

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  fullBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  orb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, zIndex: 0 },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  cardContainer: { 
    width: '100%', 
    height: 220, 
    borderRadius: 32, 
    overflow: 'hidden', 
    marginBottom: 35,
    elevation: 25,
    shadowColor: '#FF5722',
    shadowOpacity: 0.3,
    shadowRadius: 30,
    marginTop: 10
  },
  balanceCard: { flex: 1, padding: 28, justifyContent: 'space-between' },
  glassOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.2 },
  
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, letterSpacing: 3 },
  cardType: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  cardChip: { width: 50, height: 38, backgroundColor: 'rgba(255,193,7,0.3)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,193,7,0.5)' },
  
  cardMiddle: { marginTop: 10 },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  currency: { color: '#FF5722', fontSize: 24, fontWeight: '900', marginTop: 6, marginRight: 4 },
  balanceAmount: { color: '#FFF', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 },
  secureBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  secureText: { color: '#FFF', fontSize: 10, fontWeight: '900', opacity: 0.8 },
  
  actionSection: { marginBottom: 40 },
  sectionHeader: { marginBottom: 18, paddingLeft: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 },
  
  quickAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  quickBtn: { 
    backgroundColor: '#1A1A24', 
    paddingVertical: 14, 
    borderRadius: 18,
    width: '23%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  quickBtnAmount: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  
  inputRow: { flexDirection: 'row', gap: 12, height: 64 },
  inputWrapper: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#1A1A24', 
    borderRadius: 20, 
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  inputPrefix: { color: '#FF5722', fontSize: 18, fontWeight: '900', marginRight: 8 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '700', height: '100%' },
  
  addBtn: { borderRadius: 20, overflow: 'hidden', elevation: 12, shadowColor: '#FF5722', shadowOpacity: 0.4, shadowRadius: 15 },
  addGradient: { paddingHorizontal: 28, height: '100%', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1.2 },
  addBtnDisabled: { opacity: 0.5 },
  
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'dashed',
    borderRadius: 32,
    margin: 10
  },
  cardHolderName: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  contactlessIcon: { opacity: 0.4 },
  
  historySection: { flex: 1 },
  txnList: { gap: 12 },
  txnCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#16161E', 
    borderRadius: 24, 
    padding: 16, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)'
  },
  txnIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  txnIcon: { fontSize: 20, fontWeight: 'bold' },
  txnInfo: { flex: 1, marginLeft: 16 },
  txnType: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  txnDate: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  txnAmount: { fontSize: 16, fontWeight: '900' },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyIcon: { fontSize: 40, opacity: 0.6 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }
});
