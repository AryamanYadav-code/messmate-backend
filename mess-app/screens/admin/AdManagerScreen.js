import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TextInput, 
  Image, 
  ScrollView, 
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  Layout,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const AdCard = ({ item, index, onToggle, onDelete }) => (
  <Animated.View 
    entering={FadeInDown.delay(index * 100).duration(600)}
    layout={Layout.springify()}
    style={styles.adCardContainer}
  >
    <BlurView intensity={15} tint="dark" style={styles.adBlur}>
      <View style={styles.adImageWrapper}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.adImage} resizeMode="cover"/>
        ) : (
          <View style={styles.adImagePlaceholder}>
            <Text style={styles.placeholderText}>NO IMAGE</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15, 15, 18, 0.8)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.is_approved ? '#4CAF50' : '#FF5252' }]} />
          <Text style={[styles.statusText, { color: item.is_approved ? '#4CAF50' : '#FF5252' }]}>
            {item.is_approved ? 'ACTIVE' : 'DORMANT'}
          </Text>
        </View>
      </View>

      <View style={styles.adContent}>
        <Text style={styles.adTitle} numberOfLines={1}>{item.title.toUpperCase()}</Text>
        <Text style={styles.adLink} numberOfLines={1}>{item.link_url || 'Internal Navigation'}</Text>
        
        <View style={styles.adActions}>
          <TouchableOpacity 
            onPress={() => onToggle(item.ad_id)}
            style={styles.actionButton}
          >
            <BlurView intensity={20} tint="light" style={styles.actionBlur}>
              <Text style={[styles.actionLabel, { color: item.is_approved ? '#FF9800' : '#4CAF50' }]}>
                {item.is_approved ? 'DEACT' : 'ACT'}
              </Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onDelete(item.ad_id)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Text style={styles.actionLabelDelete}>RESCIND</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  </Animated.View>
);

export default function AdManagerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAds();
    setRefreshing(false);
  }, []);

  const addAd = async () => {
    if (!title || !imageUrl) return Alert.alert('Protocol Error', 'Campaign title and visual source required.');
    setLoading(true);
    try {
      await api.post('/ads', { title, image_url: imageUrl, link_url: linkUrl });
      Alert.alert('Deployment Success', 'Marketing campaign is now pending activation.');
      setTitle(''); setImageUrl(''); setLinkUrl('');
      setShowForm(false);
      fetchAds();
    } catch (err) {
      Alert.alert('System Error', err.response?.data?.error || 'Campaign deployment failed.');
    } finally { setLoading(false); }
  };

  const removeAd = (id) => {
    Alert.alert(
      'Rescind Campaign',
      'This action will permanently purge this advertisement from all terminals.',
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'EXECUTE', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/ads/${id}`);
              fetchAds();
            } catch (err) { Alert.alert('Error', 'Purge unsuccessful.'); }
          }
        }
      ]
    );
  };

  const toggleAd = async (id) => {
    try {
      await api.put(`/ads/${id}/toggle`);
      fetchAds();
    } catch (err) { Alert.alert('Error', 'Communication relay failure.'); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F0F12', '#1A1A1E', '#0F0F12']} style={StyleSheet.absoluteFill} />
      
      {/* Background Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]} />
      <View style={[styles.orb, { bottom: -150, left: -150, backgroundColor: 'rgba(255, 152, 0, 0.1)' }]} />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.meshHeader}>
          <LinearGradient 
            colors={['rgba(255, 87, 34, 0.6)', 'rgba(255, 87, 34, 0.2)', 'transparent']} 
            style={styles.meshGradient} 
          />
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BlurView intensity={20} tint="light" style={styles.blurBtn}>
                <Text style={styles.backIcon}>‹</Text>
              </BlurView>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerSubtitle}>MEDIA COMMAND</Text>
              <Text style={styles.headerTitle}>Campaign Manager</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowForm(!showForm)}
              style={styles.addBtn}
            >
              <LinearGradient
                colors={showForm ? ['#4B4B50', '#2C2C2E'] : ['#FF5722', '#FF9800']}
                style={styles.addBtnGradient}
              >
                <Text style={styles.addBtnText}>{showForm ? '✕' : '+'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={ads}
          keyExtractor={item => item.ad_id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
          }
          ListHeaderComponent={showForm && (
            <Animated.View 
              entering={SlideInUp.duration(500)}
              exiting={SlideOutDown.duration(400)}
              style={styles.formCard}
            >
              <BlurView intensity={30} tint="dark" style={styles.formBlur}>
                <Text style={styles.formHeader}>NEW DEPLOYMENT</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CAMPAIGN TITLE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Midnight Feast Protocol"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IMAGE ARCHIVE URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://cdn.messmate.com/luxe.jpg"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    autoCapitalize="none"
                  />
                </View>

                {imageUrl.length > 10 && (
                  <View style={styles.previewWrapper}>
                    <Text style={styles.label}>VISUAL PREVIEW</Text>
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                  </View>
                )}

                <View style={styles.inputGroup}>
                   <Text style={styles.label}>REDIRECT PROTOCOL (LINK)</Text>
                   <TextInput
                     style={styles.input}
                     placeholder="Optional redirect URI"
                     placeholderTextColor="rgba(255,255,255,0.2)"
                     value={linkUrl}
                     onChangeText={setLinkUrl}
                     autoCapitalize="none"
                   />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={addAd}
                  disabled={loading}
                >
                  <LinearGradient colors={['#FF5722', '#FF9800']} style={styles.submitGradient}>
                    <Text style={styles.submitBtnText}>{loading ? 'INITIALIZING...' : 'DEPLOY CAMPAIGN'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}
          renderItem={({ item, index }) => (
            <AdCard 
              item={item} 
              index={index} 
              onToggle={toggleAd} 
              onDelete={removeAd} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛰️</Text>
              <Text style={styles.emptyText}>No Active Broadcasts</Text>
              <Text style={styles.emptySub}>Awaiting campaign initialization from command center.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 10
  },
  meshHeader: { position: 'relative', overflow: 'hidden', paddingBottom: 10 },
  meshGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, opacity: 0.6 },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 15, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)', 
  },
  blurBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 32, color: '#FFF', fontWeight: '200', marginTop: -4 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  headerTitleContainer: { alignItems: 'center' },
  headerSubtitle: { fontSize: 9, fontWeight: '900', color: '#FF5722', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  addBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  addBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' },
  formCard: { marginBottom: 24, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  formBlur: { padding: 20 },
  formHeader: { fontSize: 10, fontWeight: '900', color: '#FF5722', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  input: { 
    height: 52, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  previewWrapper: { marginBottom: 16 },
  previewImage: { width: '100%', height: 160, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  submitGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },

  adCardContainer: { width: (width - 48) / 2, marginBottom: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  adBlur: { },
  adImageWrapper: { width: '100%', height: (width - 48) / 2, overflow: 'hidden' },
  adImage: { width: '100%', height: '100%' },
  adImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#1A1A1E', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: 8, letterSpacing: 1 },
  statusBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: 6, 
    paddingVertical: 3, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  statusDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  adContent: { padding: 12 },
  adTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: -0.2 },
  adLink: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: '600' },
  adActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, height: 32, borderRadius: 10, overflow: 'hidden' },
  actionBlur: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  actionLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  deleteButton: { backgroundColor: 'rgba(255, 82, 82, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.2)' },
  actionLabelDelete: { fontSize: 7, fontWeight: '900', color: '#FF5252', letterSpacing: 1 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, opacity: 0.2, marginBottom: 20 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '800' },
  emptySub: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }
});
