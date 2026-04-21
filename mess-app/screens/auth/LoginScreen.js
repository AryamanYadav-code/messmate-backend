import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, StatusBar, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from '../../services/api';
import { savePushToken } from '../../services/pushNotifications';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '344290150113-e75lk49v36hb3hlei2410sb40s9s2kgl.apps.googleusercontent.com',
    });
  }, []);

  const googleLogin = async () => {
    if (role !== 'student') {
       Alert.alert('Only Students', 'Google Login is currently only for student accounts.');
       return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      setLoading(true);
      const idToken = userInfo.data?.idToken || userInfo.idToken || tokens.idToken;
      const res = await api.post('/auth/google', { idToken });
      
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', res.data.role);
      await AsyncStorage.setItem('name', res.data.name);
      await AsyncStorage.setItem('user_id', res.data.userId.toString());
      await AsyncStorage.setItem('email', userInfo.data?.user?.email || userInfo.user?.email || 'googleuser@srm-kitchen.com');
      
      await savePushToken(res.data.userId);
      navigation.replace('Home');
    } catch (error) {
      console.log('Google Login Error', error);
      let errorMsg = error.message;
      if (error.code === '10' || error.message?.includes('DEVELOPER_ERROR')) {
        errorMsg = 'Developer Error (10): This usually means the SHA-1 fingerprint of the APK is not registered in the Google Cloud/Firebase Console.';
      }
      Alert.alert('Google Login Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      if (role === 'admin' && res.data.role === 'student') {
        Alert.alert('Access Denied', 'This account is not an admin account.');
        setLoading(false); return;
      }
      if (role === 'student' && (res.data.role === 'admin' || res.data.role === 'superadmin')) {
        Alert.alert('Access Denied', 'This is an admin account. Please use Admin login.');
        setLoading(false); return;
      }

      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', res.data.role);
      await AsyncStorage.setItem('name', res.data.name);
      await AsyncStorage.setItem('user_id', res.data.userId.toString());
      await AsyncStorage.setItem('email', email);
      
      await savePushToken(res.data.userId);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0F12', '#1A1A24', '#0F0F12']} style={styles.fullBg} />
      
      {/* Background Orbs for Depth */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]} />
      <View style={[styles.orb, { bottom: -150, right: -150, backgroundColor: 'rgba(255, 87, 34, 0.1)' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/srm_kitchen_logo.jpg')} 
                  style={styles.mainLogo}
                  resizeMode="contain"
                />
                <View style={styles.logoGlow} />
              </View>
              <Text style={styles.title}>SRM_KITCHEN</Text>
              <Text style={styles.subtitle}>Evolving your culinary experience at college.</Text>
            </View>

            <View style={styles.formContainer}>
              <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                {/* Role Toggle */}
                <View style={styles.roleToggle}>
                  <TouchableOpacity 
                    style={[styles.roleOption, role === 'student' && styles.roleOptionActive]}
                    onPress={() => setRole('student')}
                  >
                    <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, role === 'admin' && styles.roleOptionActive]}
                    onPress={() => setRole('admin')}
                  >
                    <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>Admin</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputs}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>EMAIL</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="name@university.edu"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={styles.passwordField}>
                      <TextInput
                        style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.toggleText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.loginBtn, loading && styles.btnLoading]} 
                    onPress={login}
                    disabled={loading}
                  >
                    <LinearGradient 
                      colors={['#FF5722', '#E64A19']} 
                      start={{x:0, y:0}} end={{x:1, y:0}}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.loginBtnText}>
                        {loading ? 'AUTHENTICATING...' : 'SECURE SIGN IN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR LOGIN WITH</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity 
                    style={styles.googleBtn} 
                    onPress={googleLogin}
                    disabled={role !== 'student'}
                  >
                    <Text style={[styles.googleBtnText, role !== 'student' && { opacity: 0.5 }]}>
                      CONTINUE WITH GOOGLE
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
              
              <View style={styles.registerRow}>
                <Text style={styles.accountText}>New to the mess? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerText}>Join SRM_KITCHEN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  fullBg: { ...StyleSheet.absoluteFillObject },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: height * 0.08, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { width: 100, height: 100, marginBottom: 20, position: 'relative' },
  mainLogo: { width: '100%', height: '100%', borderRadius: 28 },
  logoGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FF5722', borderRadius: 28, opacity: 0.2, transform: [{ scale: 1.1 }] },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  formContainer: { flex: 1, justifyContent: 'center' },
  glassCard: { borderRadius: 35, padding: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30 },
  
  roleToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 5, marginBottom: 25 },
  roleOption: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  roleOptionActive: { backgroundColor: '#FF5722', shadowColor: '#FF5722', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  roleText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 14, textTransform: 'uppercase' },
  roleTextActive: { color: '#FFF' },

  inputs: { gap: 20 },
  inputWrapper: { gap: 8 },
  inputLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 18, color: '#FFF', fontSize: 16, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  passwordField: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, paddingRight: 15 },
  toggleText: { color: '#FF5722', fontSize: 10, fontWeight: '900' },

  loginBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 10, elevation: 8 },
  btnGradient: { paddingVertical: 20, alignItems: 'center' },
  loginBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  btnLoading: { opacity: 0.7 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { paddingHorizontal: 15, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '900' },

  googleBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, paddingVertical: 18, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  googleBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  footer: { alignItems: 'center', gap: 20, marginTop: 30 },
  forgotText: { color: '#FF5722', fontWeight: '800', fontSize: 14 },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  accountText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  registerText: { color: '#FFF', fontWeight: '900', fontSize: 15, textDecorationLine: 'underline' }
});
