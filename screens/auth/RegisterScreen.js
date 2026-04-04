import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) return 'Please enter your full name';
    if (!email.trim()) return 'Please enter your email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const register = async () => {
    const error = validate();
    if (error) return Alert.alert('Invalid Input', error);
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
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
            <TextInput
              style={styles.input}
              placeholder="e.g. Aryaman Singh"
              placeholderTextColor="#bbb"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>College Email</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@srmist.edu.in"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={[styles.inputWrapper,
            confirmPassword.length > 0 && {
              borderColor: password === confirmPassword ? '#4CAF50' : '#f44336'
            }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#bbb"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
          onPress={register}
          disabled={loading}>
          <Text style={styles.registerBtnText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6C63FF' },
  content: { flexGrow: 1 },
  topSection: { alignItems: 'center', paddingTop: 50, paddingBottom: 24 },
  logoBox: { width: 70, height: 70, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingTop: 28 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#aaa', marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fafafa' },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#333' },
  errorText: { color: '#f44336', fontSize: 12, marginTop: 4 },
  registerBtn: { backgroundColor: '#6C63FF', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 8, elevation: 3 },
  registerBtnDisabled: { backgroundColor: '#aaa' },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { color: '#aaa', paddingHorizontal: 10, fontSize: 12 },
  loginBtn: { borderWidth: 1.5, borderColor: '#6C63FF', padding: 13, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: '#6C63FF', fontSize: 15, fontWeight: 'bold' },
});
