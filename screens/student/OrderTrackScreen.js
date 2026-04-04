import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../../services/api';

const STEPS = ['pending', 'approved', 'preparing', 'ready'];

export default function OrderTrackScreen({ route, navigation }) {
  const { order_id } = route.params;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${order_id}`);
      setOrder(res.data);
    } catch (err) { console.log(err); }
  };

  if (!order) return <View style={styles.container}><Text>Loading...</Text></View>;

  const currentStep = STEPS.indexOf(order.status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Tracking</Text>
      <Text style={styles.orderId}>Order #{order.order_id}</Text>

      <View style={styles.progressContainer}>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.circle, index <= currentStep && styles.circleActive]}>
                <Text style={styles.circleText}>{index <= currentStep ? '✓' : (index + 1).toString()}</Text>
              </View>
              {index < STEPS.length - 1 && (
                <View style={[styles.line, index < currentStep && styles.lineActive]}/>
              )}
            </View>
            <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </Text>
          </View>
        ))}
      </View>

      {order.status === 'ready' && (
        <TouchableOpacity style={styles.codeBtn}
          onPress={() => navigation.navigate('PickupCode', { order })}>
          <Text style={styles.codeBtnText}>View Pickup Code</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.refreshNote}>Auto-refreshes every 5 seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  orderId: { fontSize: 14, color: '#888', marginBottom: 40 },
  progressContainer: { marginLeft: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepLeft: { alignItems: 'center', marginRight: 16 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  circleActive: { backgroundColor: '#6C63FF' },
  circleText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  line: { width: 2, height: 40, backgroundColor: '#eee' },
  lineActive: { backgroundColor: '#6C63FF' },
  stepLabel: { fontSize: 16, color: '#aaa', paddingTop: 8 },
  stepLabelActive: { color: '#333', fontWeight: 'bold' },
  codeBtn: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  codeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  refreshNote: { textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 20 }
});