 import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Success', 'Registered! Please login.');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName}/>
      <TextInput style={styles.input} placeholder="Email" value={email}
        onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
      <TextInput style={styles.input} placeholder="Password" value={password}
        onChangeText={setPassword} secureTextEntry/>
      <TouchableOpacity style={styles.btn} onPress={register}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#6C63FF', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  btn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#6C63FF', textAlign: 'center', fontSize: 14 }
});
