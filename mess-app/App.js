import { Text, TextInput } from 'react-native';
import OrderHistoryScreen from './screens/student/OrderHistoryScreen';
import MenuManagerScreen from './screens/admin/MenuManagerScreen';
import AddItemScreen from './screens/admin/AddItemScreen';
import WalletScreen from './screens/student/WalletScreen';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import AdManagerScreen from './screens/admin/AdManagerScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/student/HomeScreen';
import CartScreen from './screens/student/CartScreen';
import OrderTrackScreen from './screens/student/OrderTrackScreen';
import PickupCodeScreen from './screens/student/PickupCodeScreen';
import AdminDashScreen from './screens/admin/AdminDashScreen';
import OrderQueueScreen from './screens/admin/OrderQueueScreen';
import SettingsScreen from './screens/student/SettingsScreen';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => { checkLogin(); }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token');
    const role = await AsyncStorage.getItem('role');
    if (!token) setInitialRoute('Login');
    else if (role === 'admin' || role === 'superadmin') setInitialRoute('AdminDash');
    else setInitialRoute('Home');
  };

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
