import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, RefreshControl, Image, TextInput, Modal } from 'react-native';
import api from '../../services/api';

export default function MenuManagerScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('lunch');
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const CATEGORIES = [
    { key: 'breakfast', icon: '🌅' },
    { key: 'lunch', icon: '☀️' },
    { key: 'dinner', icon: '🌙' },
    { key: 'snacks', icon: '🍿' },
  ];

  useEffect(() => { fetchItems(); }, [category]);

  const fetchItems = async () => {
    try {
      const res = await api.get(`/menu/${category}`);
      setItems(res.data);
    } catch (err) { console.log(err); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const removeItem = async (id, name) => {
    Alert.alert('Remove Item', `Remove "${name}" from menu?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/menu/${id}`);
          fetchItems();
        } catch (err) { Alert.alert('Error', 'Could not remove item'); }
      }}
    ]);
  };

  const openEditImage = (item) => {
    setSelectedItem(item);
    setNewImageUrl(item.image_url || '');
    setEditModal(true);
  };

  const saveImage = async () => {
    if (!newImageUrl) return Alert.alert('Error', 'Please enter an image URL');
    try {
      await api.put(`/menu/${selectedItem.item_id}/image`, { image_url: newImageUrl });
      Alert.alert('Success!', 'Image updated!');
      setEditModal(false);
      fetchItems();
    } catch (err) {
      Alert.alert('Error', 'Could not update image');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Manager</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddItem', { onGoBack: fetchItems })}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catBtn, category === cat.key && styles.catBtnActive]}
            onPress={() => setCategory(cat.key)}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[styles.catText, category === cat.key && styles.catTextActive]}>
              {cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.item_id.toString()}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']}/>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => openEditImage(item)}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover"/>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.editImageBadge}>
                <Text style={styles.editImageBadgeText}>✏️</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.itemInfo}>
              <View style={styles.itemNameRow}>
                <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#f44336' }]}/>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              <View style={styles.itemBottom}>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
                <View style={[styles.vegBadge, { backgroundColor: item.is_veg ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.vegBadgeText, { color: item.is_veg ? '#4CAF50' : '#f44336' }]}>
                    {item.is_veg ? 'Veg' : 'Non-Veg'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeItem(item.item_id, item.name)}>
              <Text style={styles.removeBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽</Text>
            <Text style={styles.emptyText}>No items in {category}</Text>
            <TouchableOpacity
              style={styles.addEmptyBtn}
              onPress={() => navigation.navigate('AddItem', { onGoBack: fetchItems })}>
              <Text style={styles.addEmptyBtnText}>+ Add First Item</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Image</Text>
            <Text style={styles.modalSubtitle}>{selectedItem?.name}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Paste image URL here"
              placeholderTextColor="#bbb"
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              autoCapitalize="none"
            />

            {newImageUrl.length > 10 && (
              <Image
                source={{ uri: newImageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveImage}>
                <Text style={styles.saveBtnText}>Save Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  categoryRow: { backgroundColor: '#fff', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, gap: 8 },
  catBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: '#f5f5f5' },
  catBtnActive: { backgroundColor: '#6C63FF' },
  catIcon: { fontSize: 18, marginBottom: 2 },
  catText: { fontSize: 11, color: '#888', fontWeight: '500' },
  catTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', elevation: 2, flexDirection: 'row', height: 90 },
  itemImage: { width: 90, height: '100%' },
  imagePlaceholder: { width: 90, height: '100%', backgroundColor: '#f0f0ff', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderIcon: { fontSize: 22 },
  imagePlaceholderText: { fontSize: 10, color: '#6C63FF', fontWeight: '600', marginTop: 2 },
  editImageBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  editImageBadgeText: { fontSize: 10 },
  itemInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1 },
  itemDesc: { fontSize: 11, color: '#aaa' },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#6C63FF' },
  vegBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  vegBadgeText: { fontSize: 10, fontWeight: '600' },
  removeBtn: { padding: 12, justifyContent: 'center' },
  removeBtnText: { fontSize: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 20 },
  addEmptyBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addEmptyBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  modalInput: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 12, fontSize: 14, color: '#333', backgroundColor: '#fafafa', marginBottom: 12 },
  previewImage: { width: '100%', height: 130, borderRadius: 12, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#eee', alignItems: 'center' },
  cancelBtnText: { color: '#888', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
