import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../src/config';

const DashboardScreen = ({ navigation }) => {
  const { userData, logout } = useContext(AuthContext);

  const ACTIONS = [
    { 
      id: 'report', 
      title: 'Report Issue', 
      subtitle: 'File a new civic complaint', 
      icon: '📢', 
      color: '#3b82f6',
      screen: 'ReportIssue' 
    },
    { 
      id: 'track', 
      title: 'My Reports', 
      subtitle: 'Monitor progress & fixes', 
      icon: '📊', 
      color: '#10b981',
      screen: 'MyReports' 
    },
  ];

  const [stats, setStats] = useState({ active: 0, resolved: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userData?.token || ''}` } };
        const res = await axios.get(`${API_URL}/complaints/my`, config);
        const complaints = res.data;
        const activeCount = complaints.filter(c => c.status !== 'Completed').length;
        const resolvedCount = complaints.filter(c => c.status === 'Completed').length;
        setStats({ active: activeCount, resolved: resolvedCount });
      } catch (error) {
        console.log('Failed to fetch stats for dashboard');
      }
    };
    if (userData) {
      fetchStats();
    }
  }, [userData]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userData?.name || 'Citizen'} 👋</Text>
            <Text style={styles.subtitle}>Together, we make our city better.</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={logout}>
            <Text style={styles.profileText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active Issues</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved Issues</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Main Actions</Text>
        
        {ACTIONS.map(action => (
          <TouchableOpacity 
            key={action.id}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📢 Current Announcements</Text>
          <Text style={styles.infoText}>Maintenance work scheduled for main water line in Zone 7 this weekend.</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'web' ? 40 : 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  profileBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ef444415' },
  profileText: { color: '#ef4444', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { 
    width: '48%', 
    backgroundColor: '#1e293b', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#334155',
    alignItems: 'center'
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#94a3b8' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 15, marginLeft: 5 },
  actionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1e293b', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155'
  },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionIcon: { fontSize: 24 },
  actionTextContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  actionSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  arrowText: { fontSize: 20, color: '#334155', fontWeight: 'bold' },
  infoBox: { backgroundColor: '#3b82f610', padding: 20, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3b82f640' },
  infoTitle: { color: '#3b82f6', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: '#94a3b8', fontSize: 13, lineHeight: 20 }
});

export default DashboardScreen;
