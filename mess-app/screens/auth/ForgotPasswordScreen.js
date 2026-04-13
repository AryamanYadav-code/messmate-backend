import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return Alert.alert('Error', 'Please enter your email address');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: cleanEmail });
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🔑</Text>
        </View>
        <Text style={styles.appName}>Forgot Password?</Text>
        <Text style={styles.tagline}>No worries, we'll send you a reset link</Text>
      </View>

      <View style={styles.card}>
        {!sent ? (
          <>
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardSubtitle}>Enter your registered email address and we'll send you a link to reset your password.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={sendResetLink}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send Reset Link</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>📬</Text>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMsg}>
              A password reset link has been sent to{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              Click the link in the email to set a new password. It expires in 1 hour.
            </Text>
            <TouchableOpacity style={styles.resendBtn} onPress={() => { setSent(false); setEmail(''); }}>
              <Text style={styles.resendText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  topSection: { alignItems: 'center', paddingTop: 70, paddingBottom: 30 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  card: { flex: 1, backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingTop: 32 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 24, lineHeight: 19 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.inputBg },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  successBox: { alignItems: 'center', paddingTop: 10 },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  successMsg: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  successEmail: { fontWeight: 'bold', color: colors.primary },
  successHint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', backgroundColor: colors.inputBg, padding: 12, borderRadius: 10, marginBottom: 20, lineHeight: 18 },
  resendBtn: { paddingVertical: 10 },
  resendText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  backBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 10 },
  backBtnText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
