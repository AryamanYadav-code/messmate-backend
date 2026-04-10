import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');

 const login = async () => {
  if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
  setLoading(true);
  try {
    const res = await api.post('/auth/login', { email, password });

    // Check if selected role matches actual role
    if (role === 'admin' && res.data.role === 'student') {
      Alert.alert('Access Denied', 'This account is not an admin account. Please use Student login.');
      setLoading(false);
      return;
    }
    if (role === 'student' && (res.data.role === 'admin' || res.data.role === 'superadmin')) {
      Alert.alert('Access Denied', 'This is an admin account. Please use Admin login.');
      setLoading(false);
      return;
    }

    await AsyncStorage.setItem('token', res.data.token);
    await AsyncStorage.setItem('role', res.data.role);
    await AsyncStorage.setItem('name', res.data.name);
    await AsyncStorage.setItem('user_id', res.data.userId.toString());
    await AsyncStorage.setItem('email', email);

    if (res.data.role === 'admin' || res.data.role === 'superadmin') {
      navigation.replace('AdminDash');
    } else {
      navigation.replace('Home');
    }
  } catch (err) {
    Alert.alert('Login Failed', err.response?.data?.error || err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🍱</Text>
        </View>
        <Text style={styles.appName}>MessMate</Text>
        <Text style={styles.tagline}>Your college canteen, simplified</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome back!</Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
            onPress={() => setRole('student')}>
            <Text style={styles.roleIcon}>🎓</Text>
            <Text style={[styles.roleBtnText, role === 'student' && styles.roleBtnTextActive]}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
            onPress={() => setRole('admin')}>
            <Text style={styles.roleIcon}>👨‍💼</Text>
            <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>Admin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'student' ? "yourname@srmist.edu.in" : "admin@mess.com"}
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
              placeholder="Enter your password"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={login}
          disabled={loading}>
          <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine}/>
          <Text style={styles.dividerText}>New here?</Text>
          <View style={styles.dividerLine}/>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  topSection: { alignItems: 'center', paddingTop: 70, paddingBottom: 30 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { flex: 1, backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 28, paddingTop: 32 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  roleSelector: { flexDirection: 'row', backgroundColor: colors.tabBackground, borderRadius: 12, padding: 4, marginBottom: 24 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  roleBtnActive: { backgroundColor: colors.primary, elevation: 2 },
  roleIcon: { fontSize: 16 },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  roleBtnTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.inputBg },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  eyeIcon: { fontSize: 16, padding: 4 },
  loginBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, elevation: 3 },
  loginBtnDisabled: { backgroundColor: colors.border },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.textSecondary, paddingHorizontal: 12, fontSize: 13 },
  registerBtn: { borderWidth: 1.5, borderColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  registerBtnText: { color: colors.primary, fontSize: 15, fontWeight: 'bold' },
});

