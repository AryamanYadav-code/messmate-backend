import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import api from '../../services/api';

export default function FeedbackScreen({ route, navigation }) {
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
          placeholderTextColor="#bbb"
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#6C63FF', paddingTop: 50, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 24 },
  orderInfo: { backgroundColor: '#f0f0ff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 30 },
  orderInfoText: { fontSize: 13, color: '#888' },
  orderInfoAmount: { fontSize: 22, fontWeight: 'bold', color: '#6C63FF', marginTop: 4 },
  question: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  starBtn: { padding: 4 },
  star: { fontSize: 44, color: '#ddd' },
  starActive: { color: '#FFD700' },
  emojiRow: { alignItems: 'center', marginBottom: 24 },
  emoji: { fontSize: 48 },
  ratingLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 8 },
  reviewLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  reviewInput: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', backgroundColor: '#fafafa', height: 120, marginBottom: 20 },
  submitBtn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitBtnDisabled: { backgroundColor: '#aaa' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipBtn: { alignItems: 'center' },
  skipBtnText: { color: '#888', fontSize: 14 },
}); 
