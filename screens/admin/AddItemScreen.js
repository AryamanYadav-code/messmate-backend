 import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AddItemScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('lunch');
  const [isVeg, setIsVeg] = useState(true);
  const [loading, setLoading] = useState(false);

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
      <TextInput style={styles.input} placeholder="e.g. Masala Dosa" placeholderTextColor={colors.textSecondary}
        value={name} onChangeText={setName}/>

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} placeholder="Short description" placeholderTextColor={colors.textSecondary}
        value={description} onChangeText={setDescription}/>

      <Text style={styles.label}>Price (₹)</Text>
      <TextInput style={styles.input} placeholder="e.g. 40" placeholderTextColor={colors.textSecondary}
        value={price} onChangeText={setPrice} keyboardType="numeric"/>

        <Text style={styles.label}>Image URL (optional)</Text>
<TextInput
  style={styles.input}
  placeholder="https://example.com/food.jpg"
  placeholderTextColor={colors.textSecondary}
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

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.inputBg },
  catBtnActive: { backgroundColor: colors.primary },
  catBtnText: { color: colors.textSecondary, fontWeight: '500' },
  catBtnTextActive: { color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: colors.inputBg, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#4CAF50' },
  typeBtnRed: { backgroundColor: '#f44336' },
  typeBtnText: { fontWeight: 'bold', color: colors.textSecondary },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
