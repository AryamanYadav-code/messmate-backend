import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions, ScrollView, Platform, Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WalletTopUpScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  
  const [amount, setAmount] = useState(route.params?.amount?.toString() || '');
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Configuration for UPI - In a real app, this might come from the backend
  const UPI_ID = "aryamanyadav19@oksbi"; // Replace with your actual UPI ID
  const MERCHANT_NAME = "Aryaman Yadav";

  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => setUserId(id));
  }, []);

  const handlePayNow = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Invalid Amount', 'Please enter a valid amount to recharge.');
    
    // Generate UPI URL
    // format: upi://pay?pa=vpa@upi&pn=Name&am=100&cu=INR&tn=TransactionNote
    const note = `Wallet Recharge - ${userId}`;
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`;

    try {
      await Linking.openURL(upiUrl);
    } catch (err) {
      console.log('Error opening UPI link:', err);
      // Fallback for devices without UPI apps or if linking fails
      Alert.alert(
        'UPI Apps Not Found',
        `Please pay ₹${amt} to ${UPI_ID} manually using any UPI app (PhonePe, GPay, Paytm) and then enter the UTR number here.`,
        [
          { text: 'Copy UPI ID', onPress: () => {
             Alert.alert('Copied', 'UPI ID copied to clipboard');
          }},
          { text: 'OK' }
        ]
      );
    }
  };

  const handleSubmitRequest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Invalid Amount', 'Please enter a valid amount.');
    if (!utr || utr.length < 10) return Alert.alert('Invalid UTR', 'Please enter a valid 12-digit UTR/Transaction ID.');

    setLoading(true);
    try {
      await api.post('/wallet/request', {
        user_id: parseInt(userId),
        amount: amt,
        transaction_ref: utr
      });

      Alert.alert(
        'Request Submitted! 🚀',
        'Your payment request has been sent for verification. The balance will reflect in your wallet once the Admin approves it (usually within 10-30 mins).',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F0F12', '#12121A']} style={styles.fullBg} />
      
      <View style={[styles.orb, { top: -60, right: -60, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]} />
      <View style={[styles.orb, { bottom: 120, left: -90, backgroundColor: 'rgba(255, 87, 34, 0.08)' }]} />

      <SafeAreaHeader navigation={navigation} title="Add Funds" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
          
          {/* Step 1: Amount */}
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>STEP 1: ENTER AMOUNT</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                cursorColor="#FF5722"
              />
            </View>
            <Text style={styles.helperText}>Enter the amount you wish to add to your wallet.</Text>
          </View>

          {/* Step 2: Payment */}
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>STEP 2: MAKE PAYMENT</Text>
            <TouchableOpacity 
              style={styles.payBtn}
              onPress={handlePayNow}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#FF5722', '#F4511E']} 
                style={styles.payGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
              >
                <Ionicons name="flash" size={20} color="#FFF" />
                <Text style={styles.payBtnText}>PAY WITH UPI APPS</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.upiInfo}>
              <Text style={styles.upiLabel}>Direct UPI ID:</Text>
              <Text style={styles.upiValue}>{UPI_ID}</Text>
            </View>
          </View>

          {/* Step 3: Verification */}
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>STEP 3: VERIFY TRANSACTION</Text>
            <Text style={styles.helperText}>After successful payment, enter the 12-digit UTR / Ref Number from your bank app below.</Text>
            <View style={styles.utrWrapper}>
              <TextInput
                style={styles.utrInput}
                placeholder="Enter 12-digit UTR Number"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={utr}
                onChangeText={setUtr}
                keyboardType="numeric"
                maxLength={12}
                cursorColor="#FF5722"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.submitBtn, (loading || !utr) && styles.disabledBtn]}
              onPress={handleSubmitRequest}
              disabled={loading || !utr}
            >
              <Text style={styles.submitBtnText}>{loading ? 'SUBMITTING...' : 'SUBMIT FOR APPROVAL'}</Text>
            </TouchableOpacity>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelinesBox}>
            <Ionicons name="information-circle" size={20} color="rgba(255,255,255,0.4)" />
            <Text style={styles.guidelineText}>
              Note: Verification is manual. Please ensure the UTR is correct to avoid rejection.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

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

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  fullBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  orb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, zIndex: 0 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  content: { marginTop: 10 },
  
  stepCard: {
    backgroundColor: '#16161E',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  currencyPrefix: {
    color: '#FF5722',
    fontSize: 24,
    fontWeight: '900',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  helperText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 20,
  },
  payBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF5722',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  payGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
  },
  payBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  upiInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  upiLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  upiValue: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
  },
  utrWrapper: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 16,
    justifyContent: 'center',
  },
  utrInput: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  guidelinesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  guidelineText: {
    flex: 1,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    lineHeight: 18,
  }
});
