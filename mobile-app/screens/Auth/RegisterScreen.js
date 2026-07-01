import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/config';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    try {
      setIsLoading(true);
      // Auto-assign role based on email as a shortcut for the user
      let role = 'Citizen';
      if(email.toLowerCase().includes('admin')) role = 'Admin';
      if(email.toLowerCase().includes('tech')) role = 'Technician';

      await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      
      Alert.alert('Success 🎉', 'Account created successfully! Please log in.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Registration Error:', error);
      const errorMsg = error.response?.data?.message || 'Registration Failed: Unable to reach server';
      Alert.alert('Registration Failed', errorMsg);
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
        <Text style={styles.logo}>Create Account</Text>
        <Text style={styles.subtitle}>Join our community to report issues</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

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
          style={[styles.registerButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleRegister} 
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Register Now</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  backgroundImage: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  blob1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#ec4899', opacity: 0.2 },
  blob2: { position: 'absolute', bottom: -150, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: '#3b82f6', opacity: 0.15 },
  glassCard: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  logo: { fontSize: 28, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: '#334155', color: '#ffffff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  registerButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  registerButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#94a3b8', fontSize: 14 },
  footerLink: { color: '#60a5fa', fontSize: 14, fontWeight: 'bold' }
});

export default RegisterScreen;
