import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl, TextInput, Modal } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function StaffScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [staff, setStaff] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      setStaff(res.data);
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  };

  const addStaff = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password)
      return Alert.alert('Error', 'Please fill all fields');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail))
      return Alert.alert('Error', 'Please enter a valid email address');
    if (password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/admin/staff', { name: cleanName, email: cleanEmail, password });
      Alert.alert('Staff Added! 📧', `Verification email sent to ${cleanEmail}. They need to verify before logging in.`);
      setShowModal(false);
      setName(''); setEmail(''); setPassword('');
      fetchStaff();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add staff');
    } finally { setLoading(false); }
  };

  const removeStaff = (id, name) => {
    Alert.alert('Remove Staff', `Remove "${name}" from staff?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/staff/${id}`);
          fetchStaff();
        } catch (err) { Alert.alert('Error', 'Could not remove staff'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Staff members can approve orders and manage the menu. They cannot access student management or staff management.
        </Text>
      </View>

      <FlatList
        data={staff}
        keyExtractor={item => String(item.user_id ?? item.id ?? item.email)}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']}/>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.date}>
                Added {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.staffBadge}>
              <Text style={styles.staffBadgeText}>Staff</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeStaff(item.user_id, item.name)}>
              <Text style={styles.removeBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👨‍🍳</Text>
            <Text style={styles.emptyText}>No staff registered yet</Text>
            <TouchableOpacity style={styles.addEmptyBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.addEmptyBtnText}>+ Add First Staff Member</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Staff Member</Text>
            <Text style={styles.modalSubtitle}>They will have access to order queue and menu manager only</Text>

            <TextInput style={styles.input} placeholder="Full Name"
              placeholderTextColor="#bbb" value={name} onChangeText={setName}/>
            <TextInput style={styles.input} placeholder="Email address"
              placeholderTextColor="#bbb" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"/>
            <TextInput style={styles.input} placeholder="Password (min 6 characters)"
              placeholderTextColor="#bbb" value={password} onChangeText={setPassword}
              secureTextEntry/>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setShowModal(false);
                setName(''); setEmail(''); setPassword('');
              }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, loading && { backgroundColor: '#aaa' }]}
                onPress={addStaff} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Adding...' : 'Add Staff'}</Text>
              </TouchableOpacity>
            </View>
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
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  infoBox: { backgroundColor: colors.primaryLight, margin: 12, borderRadius: 12, padding: 12 },
  infoText: { fontSize: 12, color: colors.primary, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  staffBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  staffBadgeText: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 20 },
  addEmptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addEmptyBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
}); 
