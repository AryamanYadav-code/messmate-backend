import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function WalletScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => {
      setUserId(id);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 30 }}/>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹{parseFloat(balance).toFixed(2)}</Text>
        <View style={styles.balancePill}>
          <Text style={styles.balancePillText}>🔒 Secure Wallet</Text>
        </View>
      </View>

      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Money</Text>
        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map(amt => (
            <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => addMoney(amt)}>
              <Text style={styles.quickBtnAmount}>₹{amt}</Text>
              <Text style={styles.quickBtnLabel}>Quick Add</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter custom amount"
            placeholderTextColor="#bbb"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.addBtn, loading && { backgroundColor: '#aaa' }]}
            onPress={() => addMoney(null)}
            disabled={loading}>
            <Text style={styles.addBtnText}>{loading ? '...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.historyTitle}>Transaction History</Text>
      <FlatList
        data={history}
        keyExtractor={item => item.txn_id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.txnCard}>
            <View style={[styles.txnIconBox, { backgroundColor: item.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={styles.txnIcon}>{item.type === 'credit' ? '↓' : '↑'}</Text>
            </View>
            <View style={styles.txnInfo}>
              <Text style={styles.txnMethod}>
                {item.type === 'credit' ? 'Money Added' : 'Order Payment'}
              </Text>
              <Text style={styles.txnDate}>
                {new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>
            <Text style={[styles.txnAmount, { color: item.type === 'credit' ? '#4CAF50' : '#f44336' }]}>
              {item.type === 'credit' ? '+' : '-'}₹{item.amount}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.headerText, fontSize: 32, lineHeight: 36 },
  headerTitle: { color: colors.headerText, fontSize: 18, fontWeight: 'bold' },
  balanceCard: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingBottom: 30, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 48, fontWeight: 'bold', letterSpacing: 1 },
  balancePill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  balancePillText: { color: '#fff', fontSize: 12 },
  addSection: { backgroundColor: colors.card, margin: 16, borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 10, alignItems: 'center' },
  quickBtnAmount: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  quickBtnLabel: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  customRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  historyTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  txnCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1 },
  txnIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txnIcon: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  txnInfo: { flex: 1 },
  txnMethod: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
});
