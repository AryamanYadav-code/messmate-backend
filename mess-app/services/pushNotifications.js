import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const EXPO_PROJECT_ID = 'e097d437-b436-4b1b-9348-5f5b34c214e6';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push Notifications: Must use physical device for push notifications');
    return null;
  }

  // CRITICAL: On Android 13+ (Samsung/Android 14/15), the channel MUST be created 
  // BEFORE requesting permissions, otherwise the OS may not trigger the prompt.
  if (Platform.OS === 'android') {
    console.log('Push Notifications: Setting up Android notification channel...');
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      description: 'Important notifications about your meal orders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  console.log('Push Notifications: Checking permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('Push Notifications: Requesting fresh permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push Notifications: Permission not granted. Current status:', finalStatus);
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    EXPO_PROJECT_ID;

  if (!projectId) {
    console.log('Push Notifications: No Project ID found');
    return null;
  }

  try {
    console.log('Push Notifications: Fetching Expo Push Token...');
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Push Notifications: Token fetched successfully');
    return token.data;
  } catch (error) {
    const message = error?.message || '';
    if (message.includes('Default FirebaseApp is not initialized')) {
      throw new Error('Firebase Android config missing. Add google-services.json and rebuild APK.');
    }
    throw error;
  }
}

export async function savePushToken(userId) {
  try {
    if (!userId) return;

    const parsedUserId = Number(userId);
    if (Number.isNaN(parsedUserId)) {
      throw new Error('Invalid user id for push token save');
    }

    const notificationsEnabled = await AsyncStorage.getItem('notifications');
    if (notificationsEnabled === 'false') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification status:', existingStatus);

    const pushToken = await registerForPushNotifications();
    console.log('Generated push token:', pushToken);

    if (!pushToken) {
      throw new Error('Push token not generated. Check app notification permission and device support.');
    }

    const response = await api.post('/auth/save-token', {
      user_id: parsedUserId,
      push_token: pushToken,
    });

    return { ok: true, token: pushToken, response: response.data };
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || 'Unknown push token save error';
    console.log('Failed to save push token:', message);
    return { ok: false, error: message };
  }
}