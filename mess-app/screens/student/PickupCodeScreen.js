import React, { useEffect, useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, 
  Animated, Share, SafeAreaView, Alert, Clipboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PickupCodeScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const order = route?.params?.order;
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Clipboard.setString(order.pickup_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `My SRM_KITCHEN Pickup Code for Order #${order.order_id} is: ${order.pickup_code}`,
      });
    } catch (error) { console.log(error.message); }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Premium Hearth Background */}
      <View style={styles.bgContainer}>
        <LinearGradient 
          colors={['#1F1F23', '#000000']} 
          style={StyleSheet.absoluteFill} 
        />
        <View style={styles.heatOrb} />
        <View style={styles.accentOrb} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <BlurView intensity={20} tint="light" style={styles.backBlur}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AUTHENTICATION</Text>
            <View style={{ width: 44 }} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
           <View style={styles.indicatorContainer}>
              <LinearGradient colors={['#FF5722', '#FF9800']} style={styles.indicatorIcon}>
                 <Ionicons name="restaurant" size={32} color="#FFF" />
              </LinearGradient>
              <Text style={styles.readyTitle}>GATHERING REQUISITION</Text>
              <Text style={styles.readySub}>Your order is verified and ready for collection.</Text>
           </View>

           <TouchableOpacity activeOpacity={0.9} onPress={handleCopy} style={styles.glassCardWrap}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                style={styles.glassCardInner}
              >
                <View style={styles.codeHeader}>
                    <Text style={styles.codeLabel}>PICKUP AUTH CODE</Text>
                    {copied && (
                      <View style={styles.copyBadge}>
                          <Text style={styles.copyBadgeText}>COPIED</Text>
                      </View>
                    )}
                </View>

                <View style={styles.codeContainer}>
                   <Text style={styles.codeText}>{order.pickup_code || '------'}</Text>
                </View>

                <View style={styles.tapTip}>
                    <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.tapTipText}>Tap to copy security key</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.metaGrid}>
                   <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>ORDER ID</Text>
                      <Text style={styles.metaValue}>#{order.order_id}</Text>
                   </View>
                   <View style={[styles.metaItem, { alignItems: 'flex-end' }]}>
                      <Text style={styles.metaLabel}>AMOUNT</Text>
                      <Text style={styles.metaValue}>₹{order.total_amount}</Text>
                   </View>
                </View>
              </LinearGradient>
           </TouchableOpacity>

           <View style={styles.footerActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={shareCode}>
                 <BlurView intensity={15} tint="light" style={styles.secondaryBlur}>
                    <Ionicons name="share-social" size={24} color="#FFF" />
                 </BlurView>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.replace('Home')}>
                 <LinearGradient colors={['#FF5722', '#FF9800']} style={styles.primaryBtnIn}>
                    <Text style={styles.primaryBtnText}>DISMISS PORTAL</Text>
                 </LinearGradient>
              </TouchableOpacity>
           </View>

           <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={12} color="rgba(255,255,255,0.3)" />
              <Text style={styles.securityText}>Valid for one-time verification only</Text>
           </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  heatOrb: { 
    position: 'absolute', 
    width: width * 1.5, 
    height: width * 1.5, 
    borderRadius: width, 
    backgroundColor: 'rgba(255, 87, 34, 0.08)', 
    top: -width * 0.4, 
    right: -width * 0.4 
  },
  accentOrb: { 
    position: 'absolute', 
    width: width * 0.8, 
    height: width * 0.8, 
    borderRadius: width, 
    backgroundColor: 'rgba(255, 152, 0, 0.05)', 
    bottom: -100, 
    left: -100 
  },

  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingTop: 10
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  backBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '900', letterSpacing: 4 },

  content: { flex: 1, padding: 24, justifyContent: 'center' },
  
  indicatorContainer: { alignItems: 'center', marginBottom: 40 },
  indicatorIcon: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20, transform: [{ rotate: '-10deg' }] },
  readyTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 1, textAlign: 'center' },
  readySub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  glassCardWrap: { 
    borderRadius: 32, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  glassCardInner: { padding: 32 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  codeLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 },
  copyBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  copyBadgeText: { color: '#FF9800', fontSize: 10, fontWeight: '900' },

  codeContainer: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    paddingVertical: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  codeText: { fontSize: 56, fontWeight: '900', color: '#FFF', letterSpacing: 8 },
  
  tapTip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 6 },
  tapTipText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 30 },
  
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 6 },
  metaValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  footerActions: { flexDirection: 'row', marginTop: 40, gap: 16 },
  secondaryBtn: { width: 64, height: 64, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  primaryBtn: { flex: 1, height: 64, borderRadius: 24, overflow: 'hidden' },
  primaryBtnIn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },

  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 6, opacity: 0.5 },
  securityText: { fontSize: 11, color: '#FFF', fontWeight: '600', letterSpacing: 0.5 },

  emptyWrap: { alignItems: 'center', padding: 40, flex: 1, justifyContent: 'center' },
  errorTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 20 },
  errorSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  btn: { backgroundColor: '#FF5722', padding: 20, borderRadius: 20, marginTop: 30, width: '100%', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});
