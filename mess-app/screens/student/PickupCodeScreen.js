 import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PickupCodeScreen({ route, navigation }) {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Order is Ready!</Text>
      <Text style={styles.subtitle}>Show this code at the counter</Text>

      <View style={styles.codeBox}>
        <Text style={styles.code}>{order.pickup_code}</Text>
      </View>

      <Text style={styles.note}>Order #{order.order_id}</Text>
      <Text style={styles.note}>Total: ₹{order.total_amount}</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.btnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40, textAlign: 'center' },
  codeBox: { backgroundColor: '#6C63FF', borderRadius: 20, padding: 40, marginBottom: 30 },
  code: { fontSize: 52, fontWeight: 'bold', color: '#fff', letterSpacing: 8 },
  note: { fontSize: 16, color: '#888', marginBottom: 8 },
  btn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30, width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
