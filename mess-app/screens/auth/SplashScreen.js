import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { savePushToken } from '../../services/pushNotifications';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Start animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();

        // Check auth and navigate after 2.5 seconds
        const timer = setTimeout(() => {
            checkAuth();
        }, 2500);

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
                // Sync push token
                if (userId) savePushToken(userId);
                
                if (role === 'admin' || role === 'superadmin') {
                    navigation.replace('AdminDash');
                } else {
                    navigation.replace('Home');
                }
            }
        } catch (error) {
            console.error('Splash Screen Auth Check Error:', error);
            navigation.replace('Login');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <Image 
                    source={require('../../assets/images/icon.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#6C63FF' }]}>MessMate</Text>
                <Text style={styles.tagline}>Hassle-free meal management</Text>
            </Animated.View>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>Version 1.0.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
    },
    footerText: {
        fontSize: 12,
        color: '#AAA',
        fontWeight: 'bold',
    }
});
