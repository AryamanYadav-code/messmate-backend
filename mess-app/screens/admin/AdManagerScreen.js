 import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TextInput, Image, ScrollView, RefreshControl } from 'react-native';
import api from '../../services/api';

export default function AdManagerScreen({ navigation }) {
  const [ads, setAds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    try {
      const res = await api.get('/ads/all');
      setAds(res.data);
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAds();
    setRefreshing(false);
  };

  const addAd = async () => {
    if (!title || !imageUrl) return Alert.alert('Error', 'Title and image URL are required');
    setLoading(true);
    try {
      await api.post('/ads', { title, image_url: imageUrl, link_url: linkUrl });
      Alert.alert('Success!', 'Ad added successfully!');
      setTitle(''); setImageUrl(''); setLinkUrl('');
      setShowForm(false);
      fetchAds();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add ad');
    } finally { setLoading(false); }
  };

  const removeAd = (id, title) => {
    Alert.alert('Remove Ad', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/ads/${id}`);
          fetchAds();
        } catch (err) { Alert.alert('Error', 'Could not remove ad'); }
      }}
    ]);
  };

  const toggleAd = async (id) => {
    try {
      await api.put(`/ads/${id}/toggle`);
      fetchAds();
    } catch (err) { Alert.alert('Error', 'Could not toggle ad'); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ad Manager</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Close' : '+ New Ad'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ads}
        keyExtractor={item => item.ad_id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']}/>}
        ListHeaderComponent={showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Advertisement</Text>

            <Text style={styles.label}>Ad Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Try Our Special Thali"
              placeholderTextColor="#bbb"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#bbb"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />

            {imageUrl.length > 10 && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            <Text style={styles.label}>Link URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor="#bbb"
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && { backgroundColor: '#aaa' }]}
              onPress={addAd}
              disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Adding...' : 'Add Advertisement'}</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.adCard}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.adImage} resizeMode="cover"/>
            ) : (
              <View style={styles.adImagePlaceholder}>
                <Text style={styles.adImagePlaceholderText}>No Image</Text>
              </View>
            )}
            <View style={styles.adInfo}>
              <View style={styles.adTitleRow}>
                <Text style={styles.adTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.statusDot, { backgroundColor: item.is_approved ? '#4CAF50' : '#f44336' }]}/>
              </View>
              <Text style={styles.adStatus}>{item.is_approved ? 'Active' : 'Hidden'}</Text>
              <View style={styles.adActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: item.is_approved ? '#FFF3E0' : '#E8F5E9' }]}
                  onPress={() => toggleAd(item.ad_id)}>
                  <Text style={[styles.actionBtnText, { color: item.is_approved ? '#FF9800' : '#4CAF50' }]}>
                    {item.is_approved ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
                  onPress={() => removeAd(item.ad_id, item.title)}>
                  <Text style={[styles.actionBtnText, { color: '#f44336' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No ads yet</Text>
            <Text style={styles.emptySub}>Tap "+ New Ad" to add one</Text>
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
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa', marginBottom: 12 },
  previewImage: { width: '100%', height: 140, borderRadius: 10, marginBottom: 12 },
  submitBtn: { backgroundColor: '#6C63FF', padding: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  adCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', elevation: 2, flexDirection: 'row', height: 100 },
  adImage: { width: 110, height: '100%' },
  adImagePlaceholder: { width: 110, height: '100%', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  adImagePlaceholderText: { color: '#aaa', fontSize: 12 },
  adInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  adTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  adStatus: { fontSize: 12, color: '#aaa' },
  adActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  emptySub: { color: '#aaa', fontSize: 14 },
});

