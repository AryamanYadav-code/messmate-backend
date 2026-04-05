import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl } from 'react-native';
import api from '../../services/api';

export default function StudentsScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const removeStudent = (id, name) => {
    Alert.alert('Remove Student', `Remove "${name}" from the app?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/students/${id}`);
          fetchStudents();
        } catch (err) { Alert.alert('Error', 'Could not remove student'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.count}>{students.length} total</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={item => item.user_id.toString()}
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
              <View style={styles.metaRow}>
                <View style={styles.balanceBadge}>
                  <Text style={styles.balanceText}>₹{item.wallet_balance} wallet</Text>
                </View>
                <View style={[styles.verifiedBadge, { backgroundColor: item.is_verified ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.verifiedText, { color: item.is_verified ? '#4CAF50' : '#f44336' }]}>
                    {item.is_verified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
              <Text style={styles.date}>
                Joined {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeStudent(item.user_id, item.name)}>
              <Text style={styles.removeBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyText}>No students registered yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 32, lineHeight: 36 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  count: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#6C63FF' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 12, color: '#888', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  balanceBadge: { backgroundColor: '#EEF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  balanceText: { fontSize: 11, color: '#6C63FF', fontWeight: '600' },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 11, color: '#aaa', marginTop: 4 },
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888' },
}); 
