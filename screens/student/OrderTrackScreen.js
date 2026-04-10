import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const STEPS = ['pending', 'approved', 'preparing', 'ready'];

export default function OrderTrackScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

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

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  orderId: { fontSize: 14, color: colors.textSecondary, marginBottom: 40 },
  progressContainer: { marginLeft: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepLeft: { alignItems: 'center', marginRight: 16 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' },
  circleActive: { backgroundColor: colors.primary },
  circleText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  line: { width: 2, height: 40, backgroundColor: colors.border },
  lineActive: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 16, color: colors.textSecondary, paddingTop: 8 },
  stepLabelActive: { color: colors.text, fontWeight: 'bold' },
  codeBtn: { backgroundColor: colors.success, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  codeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  refreshNote: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 20 }
});