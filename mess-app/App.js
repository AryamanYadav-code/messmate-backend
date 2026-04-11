import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Text, TextInput } from 'react-native';
import OrderHistoryScreen from './screens/student/OrderHistoryScreen';
import MenuManagerScreen from './screens/admin/MenuManagerScreen';
import AddItemScreen from './screens/admin/AddItemScreen';
import WalletScreen from './screens/student/WalletScreen';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import api from './services/api';
import AdManagerScreen from './screens/admin/AdManagerScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/student/HomeScreen';
import CartScreen from './screens/student/CartScreen';
import OrderTrackScreen from './screens/student/OrderTrackScreen';
import PickupCodeScreen from './screens/student/PickupCodeScreen';
import AdminDashScreen from './screens/admin/AdminDashScreen';
import OrderQueueScreen from './screens/admin/OrderQueueScreen';
import AdminOrderHistoryScreen from './screens/admin/AdminOrderHistoryScreen';
import SettingsScreen from './screens/student/SettingsScreen';
import StudentsScreen from './screens/admin/StudentsScreen';
import StaffScreen from './screens/admin/StaffScreen';
import StudentOrderHistoryScreen from './screens/admin/StudentOrderHistoryScreen';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  
  return token.data;
}
const Stack = createNativeStackNavigator();

function MainNav() {
  const [initialRoute, setInitialRoute] = useState(null);
  const { isDark } = useTheme();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    checkLogin();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Listener keeps notification subscription active while app is in foreground.
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Listener can be extended for deep-link navigation on notification tap.
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const savePushToken = async (userId) => {
    try {
      if (!userId) return;

      const notificationsEnabled = await AsyncStorage.getItem('notifications');
      if (notificationsEnabled === 'false') return;

      const pushToken = await registerForPushNotifications();
      if (!pushToken) return;

      await api.post('/auth/save-token', {
        user_id: Number(userId),
        push_token: pushToken,
      });
    } catch (error) {
      console.log('Failed to save push token:', error?.message || error);
    }
  };

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token');
    const role = await AsyncStorage.getItem('role');
    const userId = await AsyncStorage.getItem('user_id');
    if (!token) {
      setInitialRoute('Login');
    } else if (role === 'admin' || role === 'superadmin') {
      setInitialRoute('AdminDash');
      savePushToken(userId);
    } else {
      setInitialRoute('Home');
      savePushToken(userId);
    }
  };
  

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="OrderTrack" component={OrderTrackScreen} />
        <Stack.Screen name="PickupCode" component={PickupCodeScreen} />
        <Stack.Screen name="AdminDash" component={AdminDashScreen} />
        <Stack.Screen name="OrderQueue" component={OrderQueueScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="MenuManager" component={MenuManagerScreen} />
        <Stack.Screen name="AddItem" component={AddItemScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="AdManager" component={AdManagerScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Students" component={StudentsScreen} />
        <Stack.Screen name="Staff" component={StaffScreen} />
        <Stack.Screen name="AdminOrderHistory" component={AdminOrderHistoryScreen} />
        <Stack.Screen name="StudentOrderHistory" component={StudentOrderHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainNav />
    </ThemeProvider>
  );
}
