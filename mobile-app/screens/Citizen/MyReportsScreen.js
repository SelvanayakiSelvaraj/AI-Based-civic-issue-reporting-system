import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Image, Alert 
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../src/config';

const MyReportsScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const res = await axios.get(`${API_URL}/complaints/my`, config);
      setReports(res.data);
    } catch (error) {
      console.error('Error fetching my reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusInfo = (status) => {
    switch(status) {
      case 'Pending': return { color: '#f59e0b', label: 'Processing', icon: '⏳' };
      case 'Assigned': return { color: '#3b82f6', label: 'Tech Assigned', icon: '👤' };
      case 'In Progress': return { color: '#8b5cf6', label: 'Fixing', icon: '🛠️' };
      case 'Completed': return { color: '#10b981', label: 'Resolved!', icon: '✅' };
      default: return { color: '#64748b', label: status, icon: '📄' };
    }
  };

  const [proofs, setProofs] = useState({}); // { complaintId: imageUrl }

  const fetchProof = async (id) => {
    if (proofs[id]) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const res = await axios.get(`${API_URL}/complaints/${id}`, config);
      const imgUrl = res.data.completionImageUrl;
      if (imgUrl && !imgUrl.includes('undefined')) {
        setProofs(prev => ({ ...prev, [id]: imgUrl }));
      } else {
        Alert.alert("Notice", "No proof image available for this report.");
      }
    } catch (error) {
      console.error('Error fetching proof:', error);
      Alert.alert("Error", "Failed to fetch proof image.");
    }
  };

  const renderReportItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <View style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.reportType}>{item.type}</Text>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusLine, { backgroundColor: statusInfo.color + '30' }]}>
            <View style={[styles.statusProgress, { width: getProgressWidth(item.status), backgroundColor: statusInfo.color }]} />
          </View>
          <View style={styles.statusLabelRow}>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
              {statusInfo.icon} {statusInfo.label}
            </Text>
            {item.highRiskFlag && <Text style={styles.highRiskTag}>Risk Flag ⚠️</Text>}
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {item.status === 'Completed' && (
          <View style={styles.completionSection}>
            <Text style={styles.completionLabel}>Fixed Proof:</Text>
            {proofs[item._id] ? (
              <Image source={{ uri: proofs[item._id] }} style={styles.completionImg} />
            ) : (
              <TouchableOpacity 
                style={styles.viewProofBtn} 
                onPress={() => fetchProof(item._id)}
              >
                <Text style={styles.viewProofText}>🔍 Tap to View Proof</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const getProgressWidth = (status) => {
    switch(status) {
      case 'Pending': return '25%';
      case 'Assigned': return '50%';
      case 'In Progress': return '75%';
      case 'Completed': return '100%';
      default: return '10%';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monitoring Dashboard</Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={item => item._id}
        renderItem={renderReportItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchReports();}} tintColor="#3b82f6" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't reported any issues yet.</Text>
            <TouchableOpacity 
              style={styles.startBtn} 
              onPress={() => navigation.navigate('ReportIssue')}
            >
              <Text style={styles.startBtnText}>File My First Report</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#1e293b'
  },
  backBtn: { marginRight: 15, padding: 5 },
  backText: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  listContent: { padding: 16, paddingBottom: 40 },
  reportCard: { 
    backgroundColor: '#1e293b', 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  reportType: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  dateText: { fontSize: 12, color: '#64748b' },
  statusSection: { marginBottom: 15 },
  statusLine: { height: 6, borderRadius: 3, marginBottom: 8 },
  statusProgress: { height: 6, borderRadius: 3 },
  statusLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 13, fontWeight: '700' },
  highRiskTag: { fontSize: 10, color: '#ef4444', fontWeight: 'bold', backgroundColor: '#ef444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  description: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 0 },
  completionSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#334155' },
  completionLabel: { color: '#10b981', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  completionImg: { width: '100%', height: 160, borderRadius: 12 },
  viewProofBtn: { backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5, borderStyle: 'dashed', borderWidth: 1, borderColor: '#475569' },
  viewProofText: { color: '#3b82f6', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748b', fontSize: 16, marginBottom: 20 },
  startBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  startBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default MyReportsScreen;
