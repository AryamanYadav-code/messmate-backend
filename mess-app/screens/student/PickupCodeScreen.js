 import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function PickupCodeScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Feedback', {
       order_id: order.order_id,
       total_amount: order.total_amount
       })}>
      <Text style={styles.btnText}>Rate Your Order ⭐</Text>
      </TouchableOpacity>

<TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Home')}>
  <Text style={styles.skipBtnText}>Skip</Text>
</TouchableOpacity>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40, textAlign: 'center' },
  codeBox: { backgroundColor: colors.primary, borderRadius: 20, padding: 40, marginBottom: 30 },
  code: { fontSize: 52, fontWeight: 'bold', color: '#fff', letterSpacing: 8 },
  note: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30, width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipBtn: { marginTop: 12, alignItems: 'center' },
  skipBtnText: { color: '#888', fontSize: 14 },
});
