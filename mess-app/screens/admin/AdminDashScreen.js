import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AdminDashScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [stats, setStats] = useState({ total_orders: 0, total_users: 0, revenue: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const isSuperAdmin = userRole === 'superadmin';
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    AsyncStorage.getItem('role').then((role) => {
      if (mountedRef.current) setUserRole(role || '');
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(useCallback(() => {
    fetchStats();
    fetchPending();
    const interval = setInterval(() => {
      fetchStats();
      fetchPending();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []));

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (mountedRef.current) {
        setStats({
          total_orders: res.data?.total_orders || 0,
          total_users: res.data?.total_users || 0,
          revenue: res.data?.revenue || 0,
        });
      }
    } catch (err) { console.log(err); }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/orders/admin/pending');
      const orders = Array.isArray(res.data) ? res.data : [];
      // The backend route '/admin/pending' already returns only active orders
      // (pending, approved, preparing, ready). We should count all of them.
      const pending = orders.length;
      if (mountedRef.current) setPendingCount(pending);
    } catch (err) { console.log(err); }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'role', 'name', 'user_id', 'email']);
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Welcome back</Text>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#6C63FF' }]}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statNumWhite}>{stats.total_orders}</Text>
            <Text style={styles.statLabelWhite}>Total Orders</Text>
          </View>

          {isSuperAdmin && (
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎓</Text>
              <Text style={styles.statNum}>{stats.total_users}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          )}

          {isSuperAdmin && (
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statNum}>₹{stats.revenue || 0}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          )}

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

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminOrderHistory')}>
          <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
            <Text style={styles.actionIconText}>📜</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Order History</Text>
            <Text style={styles.actionSub}>View past orders & earnings</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Settings')}>
          <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.actionIconText}>⚙️</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Account Settings</Text>
            <Text style={styles.actionSub}>Manage password & theme</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {isSuperAdmin && (
          <>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Students')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.actionIconText}>🎓</Text>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Student Management</Text>
                <Text style={styles.actionSub}>View and manage student accounts</Text>
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
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FeedbackView')}>
             <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
               <Text style={styles.actionIconText}>⭐</Text>
             </View>
             <View style={styles.actionInfo}>
               <Text style={styles.actionTitle}>Customer Feedback</Text>
               <Text style={styles.actionSub}>View ratings and reviews</Text>
             </View>
             <Text style={styles.arrow}>›</Text>
             </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Staff')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.actionIconText}>👨‍🍳</Text>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Staff Management</Text>
                <Text style={styles.actionSub}>Add or remove sub-admins</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerTitle: { color: colors.headerText, fontSize: 22, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 18, alignSelf: 'center' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 13 },
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, width: '47%', elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  statNumWhite: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statLabelWhite: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  actionCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionIconText: { fontSize: 24 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  actionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: '#FF9800', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  arrow: { fontSize: 22, color: colors.border },
});

