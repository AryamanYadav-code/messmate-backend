import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, 
    SafeAreaView, Animated, Dimensions, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function FeedbackScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { order_id, total_amount } = route.params || { order_id: '0', total_amount: '0' };
  
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const bounceAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const animateStar = (index) => {
    setRating(index + 1);
    Animated.sequence([
      Animated.spring(bounceAnims[index], { toValue: 1.5, friction: 3, useNativeDriver: true }),
      Animated.spring(bounceAnims[index], { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const submitFeedback = async () => {
    if (rating === 0) return Alert.alert('Attention', 'Please touch a star to rate your meal!');
    setLoading(true);
    try {
      await api.post(`/orders/${order_id}/feedback`, {
        rating,
        review_text: review
      });
      Alert.alert('Pure Excellence! 🎉', 'Your feedback has been recorded in the Obsidian vaults.', [
        { text: 'Finish', onPress: () => navigation.replace('Home') }
      ]);
    } catch (err) {
      Alert.alert('Sync Error', err.response?.data?.error || 'Failed to submit feedback');
    } finally { setLoading(false); }
  };

  const EMOJIS = ['😞', '😕', '😐', '😊', '😍'];
  const LABELS = ['Needs Refinement', 'Fair Experience', 'Standard Quality', 'Great Service', 'Exceptional Quality'];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Depth */}
      <View style={styles.orb1} />
      
      <LinearGradient colors={isDark ? ['#1A1A1F', '#0F0F12'] : [colors.primary, '#E64A19']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
             <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                   <Ionicons name="chevron-back" size={22} color="#FFF" />
                </BlurView>
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Rate Experience</Text>
             <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.ScrollView contentContainerStyle={styles.scrollContent} style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
           <Text style={styles.summaryLabel}>ORDER REFERENCE</Text>
           <Text style={styles.summaryValue}>#MS-{order_id.toString().padStart(5, '0')}</Text>
           <View style={styles.summaryBadge}>
              <Text style={styles.badgeText}>COMPLETED</Text>
           </View>
        </View>

        <Text style={styles.question}>How would you rate the gastronomy and service level?</Text>

        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map(idx => (
            <TouchableOpacity key={idx} onPress={() => animateStar(idx)} activeOpacity={0.7} style={styles.starBtn}>
              <Animated.View style={{ transform: [{ scale: bounceAnims[idx] }] }}>
                <Ionicons 
                  name={rating > idx ? "star" : "star-outline"} 
                  size={42} 
                  color={rating > idx ? "#FFD700" : (isDark ? "#333" : "#DDD")} 
                />
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <View style={styles.reactionWrap}>
             <Text style={styles.emojiText}>{EMOJIS[rating - 1]}</Text>
             <Text style={styles.ratingLabelText}>{LABELS[rating - 1]}</Text>
          </View>
        )}

        <View style={styles.inputWrap}>
           <Text style={styles.inputLabel}>ELABORATE ON YOUR EXPERIENCE</Text>
           <BlurView intensity={isDark ? 10 : 50} tint={isDark ? "dark" : "light"} style={styles.inputBlur}>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your thoughts with our culinary team..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
           </BlurView>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, rating === 0 && styles.disabledBtn]} 
          onPress={submitFeedback} 
          disabled={loading || rating === 0}
        >
          <LinearGradient colors={rating > 0 ? [colors.primary, '#F4511E'] : ['#3D3D4A', '#2D2D3A']} style={styles.btnIn}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>AUTHENTICATE FEEDBACK</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Home')}>
           <Text style={styles.skipText}>PROCEED WITHOUT RATING</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 140, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, overflow: 'hidden' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: colors.primary + '08', top: -100, right: -100 },

  scrollContent: { padding: 25 },

  summaryCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 35, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
  summaryLabel: { fontSize: 10, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 5 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  summaryBadge: { backgroundColor: '#4ADE8015', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 10 },
  badgeText: { color: '#4ADE80', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  question: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 24, marginBottom: 25 },
  
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 20 },
  starBtn: { padding: 5 },

  reactionWrap: { alignItems: 'center', marginBottom: 35 },
  emojiText: { fontSize: 48 },
  ratingLabelText: { fontSize: 15, fontWeight: '900', color: colors.primary, marginTop: 10, letterSpacing: 0.5 },

  inputWrap: { marginBottom: 35 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 12, marginLeft: 5 },
  inputBlur: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  reviewInput: { padding: 20, minHeight: 120, fontSize: 15, color: colors.text, fontWeight: '600' },

  submitBtn: { borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  disabledBtn: { shadowOpacity: 0, elevation: 0 },
  btnIn: { padding: 22, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },

  skipBtn: { alignItems: 'center', marginTop: 25, padding: 15 },
  skipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1, opacity: 0.7 }
});
