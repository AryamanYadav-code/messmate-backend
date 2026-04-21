import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  ScrollView, ActivityIndicator, Dimensions, Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const STEPS = ['pending', 'approved', 'preparing', 'ready'];

export default function OrderTrackScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const { order_id } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 2000); // Faster refresh for "Live" feel

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${order_id}`);
      setOrder(res.data);
      if (loading) setLoading(false);
    } catch (err) { 
      console.log(err); 
      if (loading) setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentStep = STEPS.indexOf(order.status);

  const getStepIcon = (index) => {
    switch(index) {
      case 0: return 'time-outline';
      case 1: return 'checkmark-circle-outline';
      case 2: return 'restaurant-outline';
      case 3: return 'notifications-outline';
      default: return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Dynamic Background Orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <LinearGradient colors={isDark ? ['#1A1A1F', '#0F0F12'] : [colors.primary, '#E64A19']} style={styles.header}>
        <View style={styles.headerTop}>
           <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
             <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                <Ionicons name="chevron-back" size={22} color="#FFF" />
             </BlurView>
           </TouchableOpacity>
           <View>
             <Text style={styles.headerTitle}>Order Pipeline</Text>
             <View style={styles.liveContainer}>
               <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
               <Text style={styles.liveText}>LIVE UPDATES</Text>
             </View>
           </View>
           <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>TRANSACTION REFERENCE</Text>
          <Text style={styles.idValue}>#MS-{order.order_id.toString().padStart(5, '0')}</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
             <View>
               <Text style={styles.infoLabel}>PLACEMENT TIME</Text>
               <Text style={styles.infoText}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
               <Text style={styles.infoLabel}>LOCATION</Text>
               <Text style={styles.infoText}>Main Mess Hall</Text>
             </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Processing Status</Text>
        
        <View style={styles.timelineCard}>
          {STEPS.map((step, index) => {
            const isActive = index <= currentStep;
            const isCompleted = index < currentStep;
            const isLatest = index === currentStep;

            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.circle, 
                    isActive && styles.circleActive,
                    isLatest && styles.circleLatest
                  ]}>
                    <Ionicons 
                      name={isActive ? (isCompleted ? 'checkmark' : getStepIcon(index)) : getStepIcon(index)} 
                      size={18} 
                      color={isActive ? "#FFF" : "#666"} 
                    />
                  </View>
                  {index < STEPS.length - 1 && (
                    <View style={[styles.line, isActive && styles.lineActive]}>
                      {isCompleted && <LinearGradient colors={[colors.primary, colors.primary]} style={{ flex: 1 }} />}
                    </View>
                  )}
                </View>
                <View style={styles.stepRight}>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </Text>
                  <Text style={styles.stepSub}>
                    {index === 0 && "Transaction received & authenticated"}
                    {index === 1 && "Administrator verified your order"}
                    {index === 2 && "Chef is preparing your meal"}
                    {index === 3 && "Order is ready for pickup"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {order.status === 'ready' && (
          <TouchableOpacity style={styles.pickupBtn} onPress={() => navigation.navigate('PickupCode', { order })}>
            <LinearGradient colors={[colors.primary, '#F4511E']} style={styles.pickupBtnIn}>
               <Ionicons name="key-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
               <Text style={styles.pickupBtnText}>View Pickup Code</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.footerNote}>This screen will automatically transition when your order is ready.</Text>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 160, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontStyle: 'italic', fontWeight: '900', textAlign: 'center' },
  liveContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 6 },
  liveText: { color: '#4ADE80', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: colors.primary + '10', top: -50, right: -50 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#9C27B008', bottom: 100, left: -100 },

  scrollContent: { padding: 25 },

  idCard: { backgroundColor: colors.card, borderRadius: 28, padding: 25, marginBottom: 35, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', elevation: 5 },
  idLabel: { fontSize: 10, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
  idValue: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', marginVertical: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 9, fontWeight: '900', color: colors.primary, letterSpacing: 1, marginBottom: 4 },
  infoText: { fontSize: 13, fontWeight: '800', color: colors.text },

  sectionHeader: { fontSize: 12, fontWeight: '900', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20, marginLeft: 10 },
  
  timelineCard: { backgroundColor: colors.card, borderRadius: 28, padding: 25, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
  stepRow: { flexDirection: 'row', marginBottom: 5 },
  stepLeft: { alignItems: 'center', marginRight: 20 },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? '#1C1C24' : '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: isDark ? '#222' : '#EEE' },
  circleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleLatest: { shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  line: { width: 3, height: 60, backgroundColor: isDark ? '#222' : '#F1F5F9', marginVertical: 2 },
  lineActive: { backgroundColor: colors.primary + '40' },
  
  stepRight: { flex: 1, paddingTop: 6 },
  stepLabel: { fontSize: 17, fontWeight: '800', color: colors.textSecondary },
  stepLabelActive: { color: colors.text, fontWeight: '900' },
  stepSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },

  pickupBtn: { borderRadius: 24, overflow: 'hidden', marginTop: 35, elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12 },
  pickupBtnIn: { padding: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pickupBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  footerNote: { textAlign: 'center', color: colors.textSecondary, fontSize: 11, marginTop: 30, opacity: 0.6, fontStyle: 'italic' }
});