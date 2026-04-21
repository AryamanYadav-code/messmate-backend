import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            checkAuth();
        }, 2200);

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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/srm_kitchen_logo.jpg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>SRM_KITCHEN</Text>
                <Text style={[styles.tagline, { color: colors.textSecondary }]}>Modernizing your culinary experience</Text>
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
    },
    logoContainer: {
        width: 140,
        height: 140,
        backgroundColor: 'rgba(255, 87, 34, 0.05)',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 15,
        marginTop: 6,
        fontWeight: '600',
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
