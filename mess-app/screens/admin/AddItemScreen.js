 import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import api from '../../services/api';

export default function AddItemScreen({ navigation }) {
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('lunch');
  const [isVeg, setIsVeg] = useState(true);

  const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks'];

  const addItem = async () => {
  if (!name || !price) return Alert.alert('Error', 'Name and price are required');
  if (loading) return;
  setLoading(true);
  try {
    await api.post('/menu', {
      name, description,
      price: parseFloat(price),
      category,
      is_veg: isVeg ? 1 : 0,
      image_url: imageUrl || ''
    });
    Alert.alert('Success!', 'Item added to menu!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  } catch (err) {
    Alert.alert('Error', err.response?.data?.error || 'Failed to add item');
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Menu Item</Text>

      <Text style={styles.label}>Item Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Masala Dosa"
        value={name} onChangeText={setName}/>

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} placeholder="Short description"
        value={description} onChangeText={setDescription}/>

      <Text style={styles.label}>Price (₹)</Text>
      <TextInput style={styles.input} placeholder="e.g. 40"
        value={price} onChangeText={setPrice} keyboardType="numeric"/>

        <Text style={styles.label}>Image URL (optional)</Text>
<TextInput
  style={styles.input}
  placeholder="https://example.com/food.jpg"
  value={imageUrl}
  onChangeText={setImageUrl}
  autoCapitalize="none"
/>
{imageUrl.length > 10 && (
  <Image
    source={{ uri: imageUrl }}
    style={{ width: '100%', height: 140, borderRadius: 10, marginBottom: 16 }}
    resizeMode="cover"
  />
)}

      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]}
            onPress={() => setCategory(cat)}>
            <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, isVeg && styles.typeBtnActive]}
          onPress={() => setIsVeg(true)}>
          <Text style={[styles.typeBtnText, isVeg && { color: '#fff' }]}>🟢 Veg</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, !isVeg && styles.typeBtnRed]}
          onPress={() => setIsVeg(false)}>
          <Text style={[styles.typeBtnText, !isVeg && { color: '#fff' }]}>🔴 Non-Veg</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={addItem}>
        <Text style={styles.submitBtnText}>Add Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  catBtnActive: { backgroundColor: '#6C63FF' },
  catBtnText: { color: '#888', fontWeight: '500' },
  catBtnTextActive: { color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#4CAF50' },
  typeBtnRed: { backgroundColor: '#f44336' },
  typeBtnText: { fontWeight: 'bold', color: '#555' },
  submitBtn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
