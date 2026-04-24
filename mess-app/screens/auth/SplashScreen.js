import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useTheme } from '../../context/ThemeContext';
import { savePushToken } from '../../services/pushNotifications';


export default function SplashScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start(() => {
            // Hide the native splash screen ONLY after the JS animation has started
            // This prevents the "black flicker"
            ExpoSplashScreen.hideAsync().catch(() => {});
        });

        const timer = setTimeout(() => {
            checkAuth();
        }, 1800);

        return () => clearTimeout(timer);
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const role = await AsyncStorage.getItem('role');
            const userId = await AsyncStorage.getItem('user_id');

            if (!token) {
                navigation.replace('Login');
            } else {
                if (userId) savePushToken(userId);

                if (role === 'admin' || role === 'superadmin') {
                    navigation.replace('AdminDash');
                } else {
                    navigation.replace('Home');
                }
            }
        } catch (error) {
            navigation.replace('Login');
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/icon_new.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>SRM KITCHEN</Text>
                <Text style={styles.tagline}>Modernizing your culinary experience</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>X-UPLIFT v1.2</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F0F12',
    },
    logoContainer: {
        width: 160,
        height: 160,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 120,
        height: 120,
    },
    title: {
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: -1,
        color: '#FFFFFF',
    },
    tagline: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        fontSize: 11,
        color: '#777',
        fontWeight: 'bold',
        letterSpacing: 2,
    }
});
