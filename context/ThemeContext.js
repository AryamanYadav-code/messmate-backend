import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('dark'); // Default to dark as requested

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) {
          setThemeMode(savedTheme);
        } else {
          setThemeMode('dark'); // Ensure dark mode on first load
        }
      } catch (err) {
        console.log('Error loading theme:', err);
      }
    };
    loadTheme();
  }, []);

  const changeTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (err) {
      console.log('Error saving theme:', err);
    }
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  const theme = {
    isDark,
    mode: themeMode,
    changeTheme,
    colors: {
      background: isDark ? '#0F0F12' : '#F7F9FC', // Deep Charcoal vs Soft Light
      card: isDark ? '#1C1C24' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#1A1A1E',
      textSecondary: isDark ? '#A0A0AB' : '#686777',
      primary: '#FF5722', // Tangerine Orange
      primaryLight: isDark ? 'rgba(255, 87, 34, 0.15)' : 'rgba(255, 87, 34, 0.08)',
      border: isDark ? '#2C2C35' : '#E2E8F0',
      error: isDark ? '#FF5252' : '#DC2626',
      success: isDark ? '#4ADE80' : '#16A34A',
      warning: '#FACC15',
      tabBackground: isDark ? '#1C1C24' : '#F1F5F9',
      headerText: '#FFFFFF',
      overlay: 'rgba(0,0,0,0.75)',
      inputBg: isDark ? '#15151A' : '#F1F5F9',
      divider: isDark ? '#2C2C35' : '#E2E8F0',
      // Added immersive tokens
      glass: isDark ? 'rgba(28, 28, 36, 0.8)' : 'rgba(255, 255, 255, 0.85)',
      cardElevated: isDark ? '#252531' : '#FFFFFF',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
