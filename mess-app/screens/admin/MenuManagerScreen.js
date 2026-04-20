import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  SafeAreaView, 
  RefreshControl, 
  Image,
  Dimensions,
  Platform,
  StatusBar,
  TextInput
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  Layout, 
  useAnimatedStyle, 
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const PulseIndicator = ({ active }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    ),
    transform: [
      { scale: withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(1.2, { duration: 1000 })
          ),
          -1,
          true
        )
      }
    ]
  }));

  return (
    <Animated.View style={[
      styles.pulseDot, 
      { backgroundColor: active ? '#4CAF50' : '#FF5252' },
      active && animatedStyle
    ]} />
  );
};

export default function MenuManagerScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [menu, setMenu] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: '🍽️' },
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🍲' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snacks', label: 'Snacks', icon: '☕' },
  ];

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenu(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  }, []);

  const toggleStock = async (item) => {
    try {
      await api.put(`/menu/${item.item_id}/toggle-stock`);
      fetchMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not update stock status');
    }
  };

  const deleteItem = (item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${item.name}" from the menu permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/menu/${item.item_id}`);
              fetchMenu();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const filteredMenu = (selectedCategory === 'all' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory)
  ).filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#1A1A1E', '#0F0F12']}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerSubtitle}>COMMAND CENTER</Text>
              <Text style={styles.headerTitle}>Menu Catalog</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddItem')}
            >
              <LinearGradient
                colors={['#FF5722', '#FF9800']}
                style={styles.addIconGradient}
              >
                <Text style={styles.addIconText}>+</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <BlurView intensity={10} tint="dark" style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search catalog..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          </View>

          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInRight.delay(index * 100)}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(item.id)}
                  style={[
                    styles.categoryTab,
                    selectedCategory === item.id && styles.categoryTabActive
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{item.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === item.id && styles.categoryLabelActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      layout={Layout.springify()}
      style={styles.cardContainer}
    >
      <TouchableOpacity 
        style={styles.glassCard}
        onLongPress={() => deleteItem(item)}
        onPress={() => toggleStock(item)}
      >
        <BlurView intensity={24} tint="dark" style={styles.cardBlur}>
          <Image 
            source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
            style={styles.itemImage}
          />
          
          <View style={styles.itemDetails}>
            <View style={styles.nameRow}>
              <View style={[styles.vegIndicator, { borderColor: item.is_veg ? '#4CAF50' : '#FF5252' }]}>
                <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#FF5252' }]} />
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: item.is_available ? '#4CAF50' : '#FF5252' }]} />
            </View>

            <View style={styles.catWrap}>
              <Text style={styles.catText}>{item.category.toUpperCase()}</Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      
      <FlatList
        data={filteredMenu}
        keyExtractor={item => item.item_id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FF5722"
            colors={['#FF5722']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>Start building your menu by adding your first masterpiece.</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => navigation.navigate('AddItem')}
            >
              <Text style={styles.emptyAddButtonText}>Add New Item</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.bottomMesh}>
        <View style={styles.meshOrb1} />
        <View style={styles.meshOrb2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  headerContainer: {
    paddingBottom: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
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
  titleContainer: {
    flex: 1,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
  },
  addIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addIconText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
    marginTop: -2,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(255,87,34,0.1)',
    borderColor: 'rgba(255,87,34,0.3)',
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  categoryLabelActive: {
    color: '#FF5722',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  cardContainer: {
    width: (width - 50) / 2,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  glassCard: {
    flex: 1,
  },
  cardBlur: {
    padding: 12,
  },
  itemImage: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    backgroundColor: '#1A1A1E',
    marginBottom: 12,
  },
  itemDetails: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegIndicator: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF5722',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catWrap: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    width: width - 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
    lineHeight: 20,
  },
  emptyAddButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#FF5722',
  },
  emptyAddButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomMesh: {
    position: 'absolute',
    bottom: -height * 0.2,
    width: width,
    height: height * 0.5,
    opacity: 0.3,
    zIndex: -1,
  },
  meshOrb1: {
    position: 'absolute',
    bottom: 0,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
  },
  meshOrb2: {
    position: 'absolute',
    bottom: 100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
});
