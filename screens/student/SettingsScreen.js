import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, 
  TextInput, Alert, Switch, Modal, ActivityIndicator, Dimensions, Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { savePushToken } from '../../services/pushNotifications';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, changeTheme } = useTheme();
  const styles = getStyles(colors, isDark);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [darkMode, setDarkMode] = useState(isDark);
  const [notifications, setNotifications] = useState(true);
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [otp, setOtp] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const loadUserData = async () => {
    const n = await AsyncStorage.getItem('name');
    const r = await AsyncStorage.getItem('role');
    const id = await AsyncStorage.getItem('user_id');
    const e = await AsyncStorage.getItem('email');
    const notif = await AsyncStorage.getItem('notifications');
    setName(n || '');
    setRole(r || 'Student');
    setUserId(id || '');
    setEmail(e || '');
    setDarkMode(isDark);
    setNotifications(notif !== 'false');
  };

  const sendChangePasswordOtp = async () => {
    setLoading(true);
    try {
      await api.post('/auth/change-password/send-otp', { user_id: parseInt(userId) });
      setPasswordStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!otp || !newPassword || !confirmPassword) return Alert.alert('Error', 'Please fill all fields');
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        user_id: parseInt(userId),
        otp,
        new_password: newPassword
      });
      Alert.alert('Success', 'Password updated!');
      closePasswordModal();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Update failed');
    } finally { setLoading(false); }
  };

  const closePasswordModal = () => {
    setPasswordModal(false);
    setPasswordStep(1);
    setOtp(''); setNewPassword(''); setConfirmPassword('');
  };

  const toggleDarkMode = (val) => {
    setDarkMode(val);
    changeTheme(val ? 'dark' : 'light');
  };

  const toggleNotifications = async (val) => {
    setNotifications(val);
    await AsyncStorage.setItem('notifications', val.toString());
    
    // Register or remove the token from the backend
    await savePushToken(userId, !val);
    if(val) {
      Alert.alert('Notifications Enabled', 'Your device has been re-linked to SRM_KITCHEN.');
    }
  };

  const handleTestNotification = async () => {
    if (!notifications) {
      Alert.alert('Action Required', 'Please enable push notifications first.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/test-push', { userId });
      Alert.alert('Success', 'Verification ping sent to Expo server. It should arrive in a few seconds.');
    } catch (error) {
      console.log('Test notification failed', error);
      Alert.alert('Configuration Issue', 'Could not send test ping. Ensure your device is registered.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Alert.alert('Logout', 'Ready to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          // Explicitly unregister THIS device's token on the backend 
          // before clearing credentials
          await savePushToken(userId, true);
        } catch (e) {
          console.log('Error unregistering token on logout', e);
        }
        
        await AsyncStorage.clear();
        setLoading(false);
        navigation.replace('Login');
      }}
    ]);
  };

  const SettingRow = ({ icon, label, sub, isSwitch, value, onValueChange, action }) => (
    <TouchableOpacity style={styles.settingRow} onPress={action} disabled={isSwitch}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#3D3D4A', true: colors.primary }}
          thumbColor="#FFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#444' : '#CCC'} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient 
        colors={isDark ? ['#1A1A1F', '#0F0F12'] : [colors.primary, '#E64A19']} 
        style={styles.header}
      >
        <View style={styles.headerTop}>
           <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
             <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                <Ionicons name="chevron-back" size={22} color="#FFF" />
             </BlurView>
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Account Settings</Text>
           <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim }]}>
           <LinearGradient colors={isDark ? ['#1C1C24', '#15151A'] : ['#FFF', '#F8FAFC']} style={styles.profileIn}>
              <View style={styles.avatarWrap}>
                 <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                 </LinearGradient>
              </View>
              <View>
                 <Text style={styles.nameText}>{name || 'Premium User'}</Text>
                 <Text style={styles.emailText}>{email || 'ID: ' + userId}</Text>
                 <View style={styles.roleTag}>
                    <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                 </View>
              </View>
           </LinearGradient>
        </Animated.View>

        <Text style={styles.sectionHeader}>Authentication</Text>
        <View style={styles.groupCard}>
           <SettingRow 
             icon="lock-closed-outline" 
             label="Security Credentials" 
             sub="Update your app account password" 
             action={() => setPasswordModal(true)}
           />
           <View style={styles.divider} />
           <SettingRow 
             icon="notifications-outline" 
             label="Push Notifications" 
             sub="Stay updated on order status" 
             isSwitch 
             value={notifications}
             onValueChange={toggleNotifications}
           />
        </View>

        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.groupCard}>
           <SettingRow 
             icon="moon-outline" 
             label="Luxury Dark Mode" 
             sub="Deep charcoal obsidian theme" 
             isSwitch 
             value={darkMode}
             onValueChange={toggleDarkMode}
           />
           <View style={styles.divider} />
            <SettingRow 
              icon="business-outline" 
              label="Primary Campus" 
              sub="SRMIST Ramapuram" 
            />
         </View>

         <Text style={styles.sectionHeader}>System Diagnostics</Text>
         <View style={styles.groupCard}>
            <SettingRow 
              icon="pulse-outline" 
              label="Verify Notification Link" 
              sub="Send a test ping to this device" 
              action={handleTestNotification}
            />
         </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
           <LinearGradient colors={['#FF525215', '#FF525205']} style={styles.logoutIn}>
              <Text style={styles.logoutText}>Disconnect Session</Text>
              <Ionicons name="log-out-outline" size={20} color="#FF5252" />
           </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.legal}>SRM_KITCHEN Student Portal • SRMIST • Release 1.2.0</Text>
      </ScrollView>

      {/* Reused Password Modal with Premium Styling */}
      <Modal visible={passwordModal} transparent animationType="slide">
         <BlurView intensity={30} tint="dark" style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
               <View style={styles.handle} />
               <Text style={styles.modalTitle}>Update Security</Text>
               <Text style={styles.modalSubtitle}>Please follow the steps to reset your credentials.</Text>
               
               {passwordStep === 1 ? (
                 <View style={{ marginTop: 20 }}>
                    <TouchableOpacity style={styles.primaryModalBtn} onPress={sendChangePasswordOtp}>
                       <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.modalGrad}>
                          <Text style={styles.modalBtnText}>Send Verification OTP</Text>
                       </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={closePasswordModal}>
                       <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                 </View>
               ) : (
                 <View style={{ marginTop: 20 }}>
                    <TextInput style={styles.input} placeholder="OTP Code" placeholderTextColor="#666" value={otp} onChangeText={setOtp} />
                    <TextInput style={styles.input} placeholder="New Password" placeholderTextColor="#666" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                    <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#666" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                    <TouchableOpacity style={styles.primaryModalBtn} onPress={changePassword}>
                       <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.modalGrad}>
                          <Text style={styles.modalBtnText}>Save Changes</Text>
                       </LinearGradient>
                    </TouchableOpacity>
                 </View>
               )}
            </View>
         </BlurView>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 160, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  scrollContent: { padding: 25, paddingBottom: 60 },
  
  profileCard: { marginBottom: 35, borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  profileIn: { padding: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
  avatarWrap: { marginRight: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  nameText: { fontSize: 20, fontWeight: '900', color: colors.text },
  emailText: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  roleTag: { backgroundColor: colors.primary + '15', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  roleText: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  sectionHeader: { fontSize: 12, fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, marginLeft: 10 },
  groupCard: { backgroundColor: colors.card, borderRadius: 24, padding: 10, marginBottom: 30, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', marginLeft: 70 },

  logoutBtn: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: '#FF525230' },
  logoutIn: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutText: { color: '#FF5252', fontSize: 16, fontWeight: '900' },

  legal: { textAlign: 'center', color: colors.textSecondary, fontSize: 11, opacity: 0.5 },

  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: isDark ? '#1C1C24' : '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  handle: { width: 40, height: 4, backgroundColor: isDark ? '#333' : '#EEE', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 5 },
  primaryModalBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 15 },
  modalGrad: { padding: 18, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: 'center', marginTop: 5 },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  input: { backgroundColor: isDark ? '#111' : '#F1F5F9', borderRadius: 15, padding: 16, color: colors.text, marginBottom: 15, borderWidth: 1, borderColor: isDark ? '#222' : '#EEE', fontWeight: '800' }
});
