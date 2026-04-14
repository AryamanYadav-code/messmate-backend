import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import api from '../../services/api';

export default function FeedbackViewScreen({ navigation }) {
  const [feedback, setFeedback] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => { fetchFeedback(); }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/orders/feedback/all');
      setFeedback(res.data);
      if (res.data.length > 0) {
        const avg = res.data.reduce((sum, f) => sum + f.rating, 0) / res.data.length;
        setAvgRating(avg.toFixed(1));
      }
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedback();
    setRefreshing(false);
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Feedback</Text>
        <View style={{ width: 30 }}/>
      </View>

      <View style={styles.avgCard}>
        <Text style={styles.avgNumber}>{avgRating || '—'}</Text>
        <Text style={styles.avgStars}>★★★★★</Text>
        <Text style={styles.avgLabel}>Average Rating ({feedback.length} reviews)</Text>
      </View>

      <FlatList
        data={feedback}
        keyExtractor={item => item.feedback_id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']}/>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.studentInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.student_name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{item.student_name}</Text>
                  <Text style={styles.orderInfo}>Order #{item.order_id} • ₹{item.total_amount}</Text>
                </View>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingStars}>{renderStars(item.rating)}</Text>
                <Text style={styles.ratingNum}>{item.rating}/5</Text>
              </View>
            </View>
            {item.review_text ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewText}>"{item.review_text}"</Text>
              </View>
            ) : null}
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No feedback yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 32, lineHeight: 36 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avgCard: { backgroundColor: '#6C63FF', paddingVertical: 20, alignItems: 'center' },
  avgNumber: { fontSize: 48, fontWeight: 'bold', color: '#FFD700' },
  avgStars: { fontSize: 24, color: '#FFD700', marginTop: 4 },
  avgLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 16 },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  orderInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  ratingBadge: { alignItems: 'flex-end' },
  ratingStars: { fontSize: 14, color: '#FFD700' },
  ratingNum: { fontSize: 12, color: '#888', marginTop: 2 },
  reviewBox: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 8 },
  reviewText: { fontSize: 13, color: '#555', fontStyle: 'italic', lineHeight: 20 },
  date: { fontSize: 11, color: '#aaa' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888' },
}); 
