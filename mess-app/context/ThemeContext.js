import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) {
          setThemeMode(savedTheme);
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
      background: isDark ? '#121212' : '#f5f5f5',
      card: isDark ? '#1E1E1E' : '#fff',
      text: isDark ? '#FFF' : '#333',
      textSecondary: isDark ? '#AAA' : '#999',
      primary: '#6C63FF',
      primaryLight: isDark ? 'rgba(108, 99, 255, 0.2)' : 'rgba(108, 99, 255, 0.1)',
      border: isDark ? '#333' : '#e0e0e0',
      error: isDark ? '#CF6679' : '#f44336',
      success: isDark ? '#03DAC6' : '#4CAF50',
      warning: '#FFD700',
      tabBackground: isDark ? '#2C2C2C' : '#f0f0f0',
      headerText: '#fff',
      overlay: 'rgba(0,0,0,0.6)',
      inputBg: isDark ? '#2C2C2C' : '#f5f5f5',
      divider: isDark ? '#2C2C2C' : '#eee',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
