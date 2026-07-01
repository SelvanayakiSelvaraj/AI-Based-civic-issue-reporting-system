import React, { useContext, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../src/config';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    
    try {
      console.log('Login attempt started...');
      setIsLoading(true);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      console.log('Login successful, routing to dashboard...');
      login(res.data.token, res.data.role, res.data);
    } catch (error) {
      console.error('Login Error:', error);
      const errorMsg = error.response?.data?.message || 'Login Failed: Unable to reach server';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.outerContainer}
    >
      <View style={styles.backgroundImage}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
      </View>

      <View style={styles.glassCard}>
        <Text style={styles.logo}>🏙️ CivicConnect</Text>
        <Text style={styles.subtitle}>Sign in to shape your city</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleLogin} 
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}> Create an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backgroundImage: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  blob1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#3b82f6', opacity: 0.3 },
  blob2: { position: 'absolute', bottom: -150, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: '#8b5cf6', opacity: 0.2 },
  glassCard: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  logo: { fontSize: 32, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#cbd5e1', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: '#334155', color: '#ffffff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  loginButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#94a3b8', fontSize: 14 },
  footerLink: { color: '#60a5fa', fontSize: 14, fontWeight: 'bold' }
});

export default LoginScreen;
