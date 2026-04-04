import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function AdminDashScreen({ navigation }) {
  const [stats, setStats] = useState({ total_orders: 0, total_users: 0, revenue: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchPending();
    const interval = setInterval(() => {
      fetchStats();
      fetchPending();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/orders/admin/pending');
      setPendingCount(res.data.filter(o => o.status === 'pending').length);
    } catch (err) { console.log(err); }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Welcome back</Text>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#6C63FF' }]}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statNumWhite}>{stats.total_orders}</Text>
            <Text style={styles.statLabelWhite}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎓</Text>
            <Text style={styles.statNum}>{stats.total_users}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statNum}>₹{stats.revenue || 0}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={[styles.statCard, pendingCount > 0 && { borderColor: '#FF9800', borderWidth: 2 }]}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={[styles.statNum, pendingCount > 0 && { color: '#FF9800' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('OrderQueue')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EEF' }]}>
            <Text style={styles.actionIconText}>📋</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Order Queue</Text>
            <Text style={styles.actionSub}>Approve and manage orders</Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MenuManager')}>
          <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.actionIconText}>🍽</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Menu Manager</Text>
            <Text style={styles.actionSub}>Add or remove menu items</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdManager')}>
  <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
    <Text style={styles.actionIconText}>📢</Text>
  </View>
  <View style={styles.actionInfo}>
    <Text style={styles.actionTitle}>Ad Manager</Text>
    <Text style={styles.actionSub}>Upload and manage ads</Text>
  </View>
  <Text style={styles.arrow}>›</Text>
</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 13 },
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '47%', elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statNumWhite: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statLabelWhite: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  actionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionIconText: { fontSize: 24 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  actionSub: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { backgroundColor: '#FF9800', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  arrow: { fontSize: 22, color: '#ccc' },
});

