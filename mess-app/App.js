import * as Notifications from 'expo-notifications';
import { Text, TextInput, View, ActivityIndicator, Alert, Platform } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderHistoryScreen from './screens/student/OrderHistoryScreen';
import MenuManagerScreen from './screens/admin/MenuManagerScreen';
import AddItemScreen from './screens/admin/AddItemScreen';
import WalletScreen from './screens/student/WalletScreen';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { savePushToken } from './services/pushNotifications';
import AdManagerScreen from './screens/admin/AdManagerScreen';
import SplashScreen from './screens/auth/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
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
import FeedbackScreen from './screens/student/FeedbackScreen';
import FeedbackViewScreen from './screens/admin/FeedbackViewScreen';
import ScheduleOrderScreen from './screens/student/ScheduleOrderScreen';
import ScheduledOrdersScreen from './screens/admin/ScheduledOrdersScreen';
import AnalyticsScreen from './screens/admin/AnalyticsScreen';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX, // Ensure high priority for foreground
  }),
});

const Stack = createNativeStackNavigator();

function MainNav() {
  const { isDark } = useTheme();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    async function setupNotifications() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }

    setupNotifications();

    // Silent Push Token Sync on startup
    const syncTokenOnStartup = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        if (userId) {
          console.log('[App Startup] Silent token sync for user:', userId);
          await savePushToken(userId);
        }
      } catch (err) {
        console.log('[App Startup] Silent sync failed:', err.message);
      }
    };
    syncTokenOnStartup();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Hide console.log for production if needed
      console.log('Notification Received in Foreground:', notification.request.content.title);

      // Force a manual alert popup because sometimes the OS heads-up doesn't show in foreground
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || '',
        [{ text: 'OK' }]
      );
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

  

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="FeedbackView" component={FeedbackViewScreen} />
        <Stack.Screen name="ScheduleOrder" component={ScheduleOrderScreen} />
        <Stack.Screen name="ScheduledOrders" component={ScheduledOrdersScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
