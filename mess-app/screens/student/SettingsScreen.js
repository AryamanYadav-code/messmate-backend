import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert, Switch, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { savePushToken } from '../../services/pushNotifications';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, changeTheme } = useTheme();
  const styles = getStyles(colors);

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
  const [syncingNotifs, setSyncingNotifs] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const n = await AsyncStorage.getItem('name');
    const r = await AsyncStorage.getItem('role');
    const id = await AsyncStorage.getItem('user_id');
    const e = await AsyncStorage.getItem('email');
    const dm = await AsyncStorage.getItem('darkMode');
    const notif = await AsyncStorage.getItem('notifications');
    setName(n || '');
    setRole(r || '');
    setUserId(id || '');
    setEmail(e || '');
    setDarkMode(isDark);
    setNotifications(notif !== 'false');
  };

  const [passwordStep, setPasswordStep] = useState(1); // 1=send otp, 2=enter otp+pass
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  const sendChangePasswordOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/change-password/send-otp', { user_id: parseInt(userId) });
      setOtpEmail(res.data.email);
      setPasswordStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!otp || !newPassword || !confirmPassword)
      return Alert.alert('Error', 'Please fill all fields');
    if (newPassword.length < 6)
      return Alert.alert('Error', 'New password must be at least 6 characters');
    if (newPassword !== confirmPassword)
      return Alert.alert('Error', 'New passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        user_id: parseInt(userId),
        otp,
        new_password: newPassword
      });
      Alert.alert('Success! 🎉', 'Password changed successfully!');
      closePasswordModal();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const closePasswordModal = () => {
    setPasswordModal(false);
    setPasswordStep(1);
    setOtp(''); setNewPassword(''); setConfirmPassword(''); setOtpEmail('');
  };

  const toggleDarkMode = async (val) => {
    setDarkMode(val);
    changeTheme(val ? 'dark' : 'light');
  };

  const toggleNotifications = async (val) => {
    setNotifications(val);
    await AsyncStorage.setItem('notifications', val.toString());
    if (!val) {
      try {
        await api.post('/auth/save-token', { user_id: parseInt(userId), push_token: null });
      } catch (err) {
        console.log('Error clearing push token', err);
      }
    } else {
      syncNotifs();
    }
  };

  const syncNotifs = async () => {
    setSyncingNotifs(true);
    try {
      const result = await savePushToken(userId);
      if (result.ok) {
        Alert.alert('Success', 'Push notifications synced successfully.');
      } else {
        Alert.alert('Notice', result.error || 'Could not sync notifications. Please ensure you have allowed notifications in your phone settings.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sync notifications');
    } finally {
      setSyncingNotifs(false);
    }
  };

  const logout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try { await api.post('/auth/logout'); } catch (err) { console.log(err); }
        await AsyncStorage.clear();
        navigation.replace('Login');
      }}
    ]);
  };

  const getRoleBadgeColor = () => {
    if (role === 'admin') return { bg: '#E8F5E9', text: '#4CAF50' };
    if (role === 'superadmin') return { bg: '#FFF3E0', text: '#FF9800' };
    return { bg: '#EEF', text: '#6C63FF' };
  };

  const roleColor = getRoleBadgeColor();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 30 }}/>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email || 'No email saved'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleColor.text }]}>
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👤</Text>
              <View>
                <Text style={styles.settingLabel}>Full Name</Text>
                <Text style={styles.settingValue}>{name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider}/>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🎓</Text>
              <View>
                <Text style={styles.settingLabel}>Role</Text>
                <Text style={styles.settingValue}>{role?.charAt(0).toUpperCase() + role?.slice(1)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider}/>

          <TouchableOpacity style={styles.settingRow} onPress={() => setPasswordModal(true)}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingValue}>Update your password</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <View>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingValue}>Switch theme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#ddd', true: '#6C63FF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider}/>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingValue}>Order status alerts</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#ddd', true: '#6C63FF' }}
              thumbColor="#fff"
            />
          </View>

        </View>

        {/* App Info Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📱</Text>
              <View>
                <Text style={styles.settingLabel}>App Version</Text>
                <Text style={styles.settingValue}>1.0.0 (Beta)</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider}/>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🏫</Text>
              <View>
                <Text style={styles.settingLabel}>College</Text>
                <Text style={styles.settingValue}>SRMIST Ramapuram</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider}/>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>⚡</Text>
              <View>
                <Text style={styles.settingLabel}>Built by</Text>
                <Text style={styles.settingValue}>Aryaman — Project Alpha</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>MessMate v1.0 • Made with ❤️ at SRMIST</Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={passwordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              {passwordStep === 2 && (
                <TouchableOpacity onPress={() => setPasswordStep(1)}>
                  <Text style={styles.modalBack}>‹ Back</Text>
                </TouchableOpacity>
              )}
            </View>

            {passwordStep === 1 ? (
              <>
                <Text style={styles.modalSubtitle}>
                  We'll send a 6-digit verification code to your registered email to confirm it's you.
                </Text>
                <View style={styles.emailInfo}>
                  <Text style={styles.emailInfoIcon}>✉️</Text>
                  <Text style={styles.emailInfoText}>{email || 'your registered email'}</Text>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closePasswordModal}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, loading && { backgroundColor: '#aaa' }]}
                    onPress={sendChangePasswordOtp}
                    disabled={loading}>
                    <Text style={styles.saveBtnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit code sent to {otpEmail || 'your email'} and set your new password.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="6-digit OTP code"
                  placeholderTextColor="#bbb"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="New password (min 6 chars)"
                  placeholderTextColor="#bbb"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#bbb"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closePasswordModal}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, loading && { backgroundColor: '#aaa' }]}
                    onPress={changePassword}
                    disabled={loading}>
                    <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.headerText, fontSize: 32, lineHeight: 36 },
  headerTitle: { color: colors.headerText, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, elevation: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  profileEmail: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  roleBadgeText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 20, elevation: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { fontSize: 20, width: 32, textAlign: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  settingValue: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  arrow: { fontSize: 20, color: colors.border },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 58 },
  logoutBtn: { backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: colors.border },
  logoutIcon: { fontSize: 18 },
  logoutText: { color: colors.error, fontWeight: 'bold', fontSize: 15 },
  footer: { textAlign: 'center', color: colors.textSecondary, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  modalInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalBack: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 19 },
  emailInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg, padding: 12, borderRadius: 10, marginBottom: 20 },
  emailInfoIcon: { fontSize: 18 },
  emailInfoText: { fontSize: 13, color: colors.text, fontWeight: '500', flex: 1 },
});
