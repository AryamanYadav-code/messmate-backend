import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function FeedbackScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { order_id, total_amount } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a rating!');
    setLoading(true);
    try {
      await api.post(`/orders/${order_id}/feedback`, {
        rating,
        review_text: review
      });
      Alert.alert('Thank you! 🎉', 'Your feedback helps us improve!', [
        { text: 'OK', onPress: () => navigation.replace('Home') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit feedback');
    } finally { setLoading(false); }
  };

  const EMOJIS = ['😞', '😕', '😐', '😊', '😄'];
  const LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoText}>Order #{order_id}</Text>
          <Text style={styles.orderInfoAmount}>₹{total_amount}</Text>
        </View>

        <Text style={styles.question}>How was your experience?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <View style={styles.emojiRow}>
            <Text style={styles.emoji}>{EMOJIS[rating - 1]}</Text>
            <Text style={styles.ratingLabel}>{LABELS[rating - 1]}</Text>
          </View>
        )}

        <Text style={styles.reviewLabel}>Write a review (optional)</Text>
        <TextInput
          style={styles.reviewInput}
          placeholder="Tell us about your experience..."
          placeholderTextColor={colors.textSecondary}
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
          onPress={submitFeedback}
          disabled={loading || rating === 0}>
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Home')}>
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { color: colors.headerText, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 24 },
  orderInfo: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 30 },
  orderInfoText: { fontSize: 13, color: colors.textSecondary },
  orderInfoAmount: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  question: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  starBtn: { padding: 4 },
  star: { fontSize: 44, color: colors.border },
  starActive: { color: colors.warning },
  emojiRow: { alignItems: 'center', marginBottom: 24 },
  emoji: { fontSize: 48 },
  ratingLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 8 },
  reviewLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  reviewInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg, height: 120, marginBottom: 20 },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitBtnDisabled: { backgroundColor: colors.textSecondary },
  submitBtnText: { color: colors.headerText, fontSize: 16, fontWeight: 'bold' },
  skipBtn: { alignItems: 'center' },
  skipBtnText: { color: colors.textSecondary, fontSize: 14 },
});
