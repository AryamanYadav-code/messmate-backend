import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const sendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email first');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    if (!name.trim()) return Alert.alert('Error', 'Please enter your name');

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setOtpSent(true);
      Alert.alert('OTP Sent!', `Check your email ${email} for the 6-digit code`);
      let t = 60;
      setTimer(t);
      const interval = setInterval(() => {
        t--;
        setTimer(t);
        if (t <= 0) clearInterval(interval);
      }, 1000);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const register = async () => {
    if (!otp || otp.length !== 6) return Alert.alert('Error', 'Please enter the 6-digit OTP');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, otp });
      Alert.alert('Success! 🎉', 'Account created! Please login.', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🍱</Text>
        </View>
        <Text style={styles.appName}>MessMate</Text>
        <Text style={styles.tagline}>Create your account</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join MessMate!</Text>
        <Text style={styles.cardSubtitle}>Register with your college email</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput style={styles.input} placeholder="e.g. Aryaman Singh"
              placeholderTextColor="#bbb" value={name} onChangeText={setName}
              autoCapitalize="words" editable={!otpSent}/>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput style={styles.input} placeholder="yourname@srmist.edu.in"
              placeholderTextColor="#bbb" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" editable={!otpSent}/>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Min 6 characters"
              placeholderTextColor="#bbb" value={password} onChangeText={setPassword}
              secureTextEntry editable={!otpSent}/>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={[styles.inputWrapper,
            confirmPassword.length > 0 && { borderColor: password === confirmPassword ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Re-enter password"
              placeholderTextColor="#bbb" value={confirmPassword}
              onChangeText={setConfirmPassword} secureTextEntry editable={!otpSent}/>
          </View>
        </View>

        {!otpSent ? (
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={sendOtp} disabled={loading}>
            <Text style={styles.registerBtnText}>
              {loading ? 'Sending OTP...' : 'Send Verification Code'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Enter the 6-digit code sent to</Text>
              <Text style={styles.otpEmail}>{email}</Text>
            </View>

              <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.primary }]}>
                <Text style={styles.inputIcon}>🔑</Text>
                <TextInput style={[styles.input, styles.otpInput]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#bbb" value={otp}
                  onChangeText={setOtp} keyboardType="number-pad"
                  maxLength={6}/>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={register} disabled={loading}>
              <Text style={styles.registerBtnText}>
                {loading ? 'Creating Account...' : 'Verify & Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={timer > 0 ? null : sendOtp}
              disabled={timer > 0}>
              <Text style={[styles.resendBtnText, timer > 0 && { color: '#aaa' }]}>
                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine}/>
          <Text style={styles.dividerText}>Already registered?</Text>
          <View style={styles.dividerLine}/>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  content: { flexGrow: 1 },
  topSection: { alignItems: 'center', paddingTop: 50, paddingBottom: 24 },
  logoBox: { width: 70, height: 70, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { flex: 1, backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingTop: 28 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.inputBg },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: colors.text },
  otpInput: { fontSize: 20, fontWeight: 'bold', letterSpacing: 4 },
  otpBox: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  otpLabel: { fontSize: 13, color: colors.textSecondary },
  otpEmail: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  registerBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 8, elevation: 3 },
  registerBtnDisabled: { backgroundColor: colors.border },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  resendBtn: { alignItems: 'center', marginTop: 12 },
  resendBtnText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.textSecondary, paddingHorizontal: 10, fontSize: 12 },
  loginBtn: { borderWidth: 1.5, borderColor: colors.primary, padding: 13, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: colors.primary, fontSize: 15, fontWeight: 'bold' },
});
