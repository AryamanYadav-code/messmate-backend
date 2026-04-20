import React, { useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, 
  Animated, Share, SafeAreaView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PickupCodeScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const order = route?.params?.order;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true })
    ]).start();
  }, []);

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.primary} />
          <Text style={styles.errorTitle}>Pipeline Disconnected</Text>
          <Text style={styles.errorSub}>Could not retrieve order details. Please return to your active tracking dashboard.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('Home')}>
            <Text style={styles.btnText}>Return to Portal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const shareCode = async () => {
    try {
      await Share.share({
        message: `My MessMate Pickup Code for Order #${order.order_id} is: ${order.pickup_code}`,
      });
    } catch (error) { console.log(error.message); }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Celebration Background */}
      <LinearGradient colors={isDark ? ['#1A1A1F', '#0F0F12'] : [colors.primary, '#E64A19']} style={styles.bgSurface}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
      </LinearGradient>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
           <View style={styles.successBadge}>
             <BlurView intensity={20} tint="light" style={styles.badgeBlur}>
                <Ionicons name="checkmark-done" size={40} color="#FFF" />
             </BlurView>
           </View>

           <Text style={styles.readyTitle}>ORDER READY!</Text>
           <Text style={styles.readySub}>Your meal is waiting at the counter.</Text>

           <View style={styles.glassCardWrap}>
             <BlurView intensity={30} tint="light" style={styles.glassCard}>
                <Text style={styles.codeLabel}>PICKUP AUTHENTICATION CODE</Text>
                <View style={styles.codeBox}>
                   <Text style={styles.codeText}>{order.pickup_code || '------'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.orderMeta}>
                   <View>
                      <Text style={styles.metaLabel}>ORDER ID</Text>
                      <Text style={styles.metaValue}>#{order.order_id}</Text>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.metaLabel}>AMOUNT PAID</Text>
                      <Text style={styles.metaValue}>₹{order.total_amount}</Text>
                   </View>
                </View>
             </BlurView>
           </View>

           <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
                 <BlurView intensity={20} tint="light" style={styles.shareBlur}>
                    <Ionicons name="share-outline" size={24} color="#FFF" />
                 </BlurView>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.replace('Home')}>
                 <LinearGradient colors={['#FFF', '#F1F1F1']} style={styles.doneBtnIn}>
                    <Text style={styles.doneBtnText}>COMPLETE COLLECTION</Text>
                 </LinearGradient>
              </TouchableOpacity>
           </View>

           <TouchableOpacity style={styles.feedbackLink} onPress={() => navigation.navigate('Feedback', { order_id: order.order_id })}>
              <Text style={styles.feedbackText}>Share Experience</Text>
              <Ionicons name="star-outline" size={14} color="#FFF" style={{ marginLeft: 5 }} />
           </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgSurface: { ...StyleSheet.absoluteFillObject },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -100, right: -100 },
  orb2: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(0,0,0,0.1)', bottom: -50, left: -50 },

  safeArea: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },

  successBadge: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 25, elevation: 15, shadowColor: '#FFF', shadowOpacity: 0.3, shadowRadius: 20 },
  badgeBlur: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },

  readyTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 2, fontStyle: 'italic' },
  readySub: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8, marginBottom: 40 },

  glassCardWrap: { width: '100%', borderRadius: 35, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  glassCard: { padding: 35, alignItems: 'center' },
  codeLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 20 },
  codeBox: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 30, paddingVertical: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  codeText: { fontSize: 52, fontWeight: '900', color: '#FFF', letterSpacing: 10 },
  
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 35 },
  
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  metaLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  actionRow: { flexDirection: 'row', marginTop: 50, width: '100%', gap: 15 },
  shareBtn: { width: 65, height: 65, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  shareBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  doneBtn: { flex: 1, height: 65, borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  doneBtnIn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doneBtnText: { color: colors.primary, fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  feedbackLink: { flexDirection: 'row', alignItems: 'center', marginTop: 30, opacity: 0.8 },
  feedbackText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 20 },
  errorSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  btn: { backgroundColor: colors.primary, padding: 20, borderRadius: 15, marginTop: 30, width: '100%', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});
