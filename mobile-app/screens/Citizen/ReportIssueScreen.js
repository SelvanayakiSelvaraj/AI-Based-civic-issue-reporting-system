import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, 
  ScrollView, Animated, Platform, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../src/config'; 

const ISSUE_TYPES = [
  { id: 'water', label: 'Water Leak', icon: '💧', color: '#3b82f6' },
  { id: 'road', label: 'Road Damage', icon: '🛣️', color: '#f59e0b' },
  { id: 'electricity', label: 'Power Outage', icon: '⚡', color: '#eab308' },
  { id: 'trash', label: 'Waste Issue', icon: '🗑️', color: '#10b981' },
  { id: 'sewage', label: 'Sewage/Drains', icon: '🚱', color: '#8b5cf6' },
  { id: 'other', label: 'Other', icon: '📝', color: '#ec4899' },
];

const ReportIssueScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]); // Re-animate on step change

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) setImage(result.assets ? result.assets[0] : result);
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission to access location was denied');
    let loc = await Location.getCurrentPositionAsync({});
    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!type) return Alert.alert('Selection Required', 'Please select a category.');
      if (type === 'Other' && !customType.trim()) return Alert.alert('Input Required', 'Please detail the custom issue.');
    }
    if (step === 2 && !description.trim()) {
      return Alert.alert('Input Required', 'Please provide a description.');
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!location || !image) {
      return Alert.alert("Missing Details", "Please attach a photo and fetch your GPS location.");
    }
    try {
      setIsSubmitting(true);
      const finalType = type === 'Other' ? customType : type;
      const data = {
        type: finalType,
        description: description,
        location: location,
        imageUrl: image.base64 ? `data:image/jpeg;base64,${image.base64}` : null,
      };

      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      await axios.post(`${API_URL}/complaints`, data, config);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission Error:', error);
      const errorMsg = error.response?.data?.message || "Unable to reach the server. Is the backend running?";
      Alert.alert("Submission Failed", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.progressDot, i <= step ? styles.progressActive : null]} />
          ))}
        </View>

        {isSubmitted ? (
          <Animated.View style={[styles.mainCard, styles.successCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.successIconBg}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
            <Text style={styles.successTitle}>Report Submitted!</Text>
            <Text style={styles.successMessage}>
              Thank you for helping improve our city. Your report has been received and assigned to the relevant department.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.ticketText}>A confirmation email has been sent to your registered address.</Text>
            
            <TouchableOpacity 
              style={[styles.navButton, styles.doneButton]} 
              onPress={() => navigation.navigate('CitizenDashboard')}
            >
              <Text style={styles.doneButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.mainCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {step === 1 && (
            <View>
              <Text style={styles.headerTitle}>1. Select Category</Text>
              <Text style={styles.subtext}>What kind of civic issue are you reporting?</Text>
              <View style={styles.categoryContainer}>
                {ISSUE_TYPES.map((item) => (
                  <TouchableOpacity 
                    key={item.id} activeOpacity={0.7}
                    style={[styles.categoryBox, type === item.label && { borderColor: item.color, backgroundColor: item.color + '20' }]}
                    onPress={() => setType(item.label)}
                  >
                    <Text style={styles.categoryIcon}>{item.icon}</Text>
                    <Text style={[styles.categoryLabel, type === item.label && { color: item.color, fontWeight: '700' }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {type === 'Other' && (
                <TextInput
                  style={styles.input}
                  placeholder="Specify issue type..."
                  placeholderTextColor="#9ca3af"
                  value={customType}
                  onChangeText={setCustomType}
                />
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.headerTitle}>2. Details</Text>
              {location && (
                <Text style={styles.locText}>
                  Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              )}
              <Text style={styles.subtext}>Provide as much information as you can to help responders.</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the problem, severity, and any hazards..."
                placeholderTextColor="#9ca3af"
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.headerTitle}>3. Evidence & Location</Text>
              <Text style={styles.subtext}>A picture and GPS point are required to submit.</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={pickImage} activeOpacity={0.8}>
                  <Text style={styles.actionIcon}>📸</Text>
                  <Text style={styles.actionText}>{image ? "Change Photo" : "Upload Photo"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, location && styles.actionSuccess]} onPress={getLocation} activeOpacity={0.8}>
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={[styles.actionText, location && { color: '#10b981' }]}>
                    {location ? "Location Saved!" : "Fetch GPS"}
                  </Text>
                </TouchableOpacity>
              </View>

              {image && (
                <View style={styles.imageContainer}>
                 <Image source={{ uri: image.uri }} style={styles.previewImage} />
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.navButton} onPress={() => setStep(step - 1)}>
                <Text style={styles.navButtonText}>Back</Text>
              </TouchableOpacity>
            ) : <View style={{flex: 1}}/>}

            {step < 3 ? (
              <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.navButton, styles.nextButton, isSubmitting && {backgroundColor: '#94a3b8'}]} 
                onPress={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>Submit Report</Text>}
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'web' ? 40 : 60, paddingBottom: 60, alignItems: 'center' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, width: '100%', maxWidth: 200 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#334155', marginHorizontal: 5 },
  progressActive: { backgroundColor: '#3b82f6', width: 24 },
  mainCard: { width: '100%', maxWidth: 600, backgroundColor: '#1e293b', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  subtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 30 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryBox: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { fontSize: 28, marginBottom: 8 },
  categoryLabel: { fontSize: 13, color: '#cbd5e1', fontWeight: '500' },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 16, color: '#f8fafc', fontSize: 15, marginBottom: 10 },
  textArea: { height: 140, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionButton: { width: '48%', backgroundColor: '#334155', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  actionSuccess: { backgroundColor: '#10b98115', borderColor: '#10b981' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionText: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  imageContainer: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 25 },
  previewImage: { width: '100%', height: 200, resizeMode: 'cover' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  navButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#334155', marginRight: 10 },
  nextButton: { backgroundColor: '#3b82f6', marginRight: 0, marginLeft: 10 },
  navButtonText: { color: '#cbd5e1', fontSize: 16, fontWeight: '600' },
  nextButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  // Success Styles
  successCard: { alignItems: 'center', paddingVertical: 50 },
  successIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b98120', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIcon: { fontSize: 40 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#f8fafc', marginBottom: 12 },
  successMessage: { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginBottom: 20 },
  ticketText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30, fontStyle: 'italic' },
  doneButton: { backgroundColor: '#3b82f6', width: '100%', marginTop: 10 },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ReportIssueScreen;
