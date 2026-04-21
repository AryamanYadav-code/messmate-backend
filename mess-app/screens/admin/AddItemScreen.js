import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AddItemScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('lunch');
  const [isVeg, setIsVeg] = useState(true);
  const [loading, setLoading] = useState(false);

  const CATEGORIES = [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🍲' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snacks', label: 'Snacks', icon: '☕' },
  ];

  const addItem = async () => {
    if (!name || !price) return Alert.alert('Error', 'Name and price are required');
    if (loading) return;
    setLoading(true);
    try {
      await api.post('/menu', {
        name, 
        description,
        price: parseFloat(price),
        category,
        is_veg: isVeg ? 1 : 0,
        image_url: imageUrl || ''
      });
      Alert.alert('Success!', 'New item added to the catalog!', [
        { text: 'Great!', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A1A1E', '#0F0F12']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.meshHeader}>
            <LinearGradient 
              colors={['rgba(255, 87, 34, 0.4)', 'rgba(255, 87, 34, 0.15)', 'transparent']} 
              style={styles.meshGradient} 
            />
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backIcon}>‹</Text>
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerSubtitle}>NEW ADDITION</Text>
                <Text style={styles.headerTitle}>Dish Creation</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(600)}>
              {/* Image Preview / Placeholder */}
              <View style={styles.imageSection}>
                <BlurView intensity={20} tint="dark" style={styles.imageCard}>
                  {imageUrl.length > 10 ? (
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderIcon}>📸</Text>
                      <Text style={styles.imagePlaceholderText}>Visual representation of the dish</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.imageOverlay}
                  />
                  <View style={styles.imageUrlBadge}>
                    <Text style={styles.imageUrlBadgeText}>PREVIEW READY</Text>
                  </View>
                </BlurView>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ITEM NAME</Text>
                  <BlurView intensity={10} tint="dark" style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.input} 
                      placeholder="e.g. Royal Chicken Biryani" 
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={name} 
                      onChangeText={setName}
                    />
                  </BlurView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DESCRIPTION</Text>
                  <BlurView intensity={10} tint="dark" style={styles.inputWrapper}>
                    <TextInput 
                      style={[styles.input, styles.textArea]} 
                      placeholder="Briefly describe the culinary experience..." 
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      multiline
                      value={description} 
                      onChangeText={setDescription}
                    />
                  </BlurView>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>PRICE (₹)</Text>
                    <BlurView intensity={10} tint="dark" style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.input} 
                        placeholder="0.00" 
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={price} 
                        onChangeText={setPrice}
                        keyboardType="numeric"
                      />
                    </BlurView>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1.2 }]}>
                    <Text style={styles.label}>VISUAL URL</Text>
                    <BlurView intensity={10} tint="dark" style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.input} 
                        placeholder="https://..." 
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={imageUrl} 
                        onChangeText={setImageUrl}
                        autoCapitalize="none"
                      />
                    </BlurView>
                  </View>
                </View>

                <Text style={styles.label}>SERVICE CATEGORY</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={styles.catIcon}>{cat.icon}</Text>
                      <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>DIETARY PREFERENCE</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity 
                    style={[styles.typeBtn, isVeg && styles.typeBtnVeg]} 
                    onPress={() => setIsVeg(true)}
                  >
                    <View style={[styles.typeIndicator, { borderColor: isVeg ? '#FFF' : '#4CAF50' }]}>
                       {isVeg && <View style={styles.typeDot} />}
                    </View>
                    <Text style={[styles.typeText, isVeg && styles.typeTextActive]}>Pure Veg</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.typeBtn, !isVeg && styles.typeBtnNonVeg]} 
                    onPress={() => setIsVeg(false)}
                  >
                    <View style={[styles.typeIndicator, { borderColor: !isVeg ? '#FFF' : '#FF5252' }]}>
                       {!isVeg && <View style={[styles.typeDot, { backgroundColor: '#FF5252' }]} />}
                    </View>
                    <Text style={[styles.typeText, !isVeg && styles.typeTextActive]}>Non-Veg</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.submitBtn} 
                  onPress={addItem}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#FF5722', '#FF9800']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitBtnText}>
                      {loading ? 'PUBLISHING...' : 'PUBLISH DISH'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <View style={styles.meshContainer}>
        <View style={styles.meshOrb} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#FFF',
    marginLeft: -2,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5722',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageCard: {
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  imageUrlBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,87,34,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,87,34,0.3)',
  },
  imageUrlBadgeText: {
    color: '#FF5722',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  inputWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    padding: 16,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  catBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  catBtnActive: {
    backgroundColor: 'rgba(255,87,34,0.1)',
    borderColor: '#FF5722',
  },
  catIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  catLabelActive: {
    color: '#FF5722',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 10,
  },
  typeBtnVeg: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  typeBtnNonVeg: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  typeIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  typeTextActive: {
    color: '#FFF',
  },
  submitBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  meshContainer: {
    position: 'absolute',
    top: -100,
    right: -100,
    zIndex: -1,
    opacity: 0.2,
  },
  meshOrb: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF5722',
  },
  meshHeader: { position: 'relative', overflow: 'hidden', paddingBottom: 10 },
  meshGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, opacity: 0.6 }
});
