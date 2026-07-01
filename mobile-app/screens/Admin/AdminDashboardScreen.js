import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Modal, ScrollView, RefreshControl 
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../src/config';

const AdminDashboardScreen = ({ navigation }) => {
  const { userToken, logout } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [complaintDetail, setComplaintDetail] = useState(null);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const [compRes, techRes] = await Promise.all([
        axios.get(`${API_URL}/complaints`, config),
        axios.get(`${API_URL}/auth/technicians`, config)
      ]);
      setComplaints(compRes.data);
      setTechnicians(techRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const res = await axios.get(`${API_URL}/complaints/${id}`, config);
      setComplaintDetail(res.data);
    } catch (error) {
      alert('Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAssign = async (technicianId) => {
    setAssigning(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      await axios.put(`${API_URL}/complaints/${selectedComplaint._id}/assign`, { technicianId }, config);
      setAssignModalVisible(false);
      fetchData(); // Refresh list
    } catch (error) {
      alert('Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const renderComplaintItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.complaintCard, item.highRiskFlag && styles.highRiskCard]}
      onPress={() => fetchDetail(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.complaintType}>{item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      {item.highRiskFlag && (
        <View style={styles.riskIndicator}>
          <Text style={styles.riskText}>⚠️ HIGH RISK AREA</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.footerInfo}>By: {item.userId?.name || 'User'}</Text>
        {item.status === 'Pending' ? (
          <TouchableOpacity 
            style={styles.assignBtn} 
            onPress={(e) => {
              e.stopPropagation();
              setSelectedComplaint(item);
              setAssignModalVisible(true);
            }}
          >
            <Text style={styles.assignBtnText}>Assign Tech</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.assignedToText}>To: {item.assignedTo?.name || 'Tech'}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#f59e0b';
      case 'Assigned': return '#3b82f6';
      case 'In Progress': return '#8b5cf6';
      case 'Completed': return '#10b981';
      default: return '#64748b';
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
        <View>
          <Text style={styles.headerTitle}>System Admin</Text>
          <Text style={styles.headerSubtitle}>Allocation & Oversight</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={item => item._id}
        renderItem={renderComplaintItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports found</Text>
          </View>
        }
      />

      {/* Assignment Modal */}
      <Modal
        visible={assignModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Technician</Text>
            <Text style={styles.modalSubtitle}>Issue: {selectedComplaint?.type}</Text>
            
            <ScrollView style={styles.techList}>
              {technicians.map(tech => (
                <TouchableOpacity 
                  key={tech._id} 
                  style={styles.techItem}
                  onPress={() => handleAssign(tech._id)}
                  disabled={assigning}
                >
                  <View style={styles.techAvatar}>
                    <Text style={styles.avatarText}>{tech.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.techName}>{tech.name}</Text>
                    <Text style={styles.techEmail}>{tech.email}</Text>
                  </View>
                  {assigning && <ActivityIndicator size="small" color="#3b82f6" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setAssignModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            {detailLoading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ margin: 50 }} />
            ) : complaintDetail ? (
              <ScrollView>
                <Text style={styles.modalTitle}>{complaintDetail.type}</Text>
                <Text style={styles.modalSubtitle}>Reported by {complaintDetail.userId?.name}</Text>
                
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Description:</Text>
                  <Text style={styles.sectionValue}>{complaintDetail.description}</Text>
                </View>

                {complaintDetail.imageUrl && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Evidence Photo:</Text>
                    <Image source={{ uri: complaintDetail.imageUrl }} style={styles.detailImage} />
                  </View>
                )}

                {complaintDetail.completionImageUrl && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Completion Proof:</Text>
                    <Image source={{ uri: complaintDetail.completionImageUrl }} style={styles.detailImage} />
                  </View>
                )}

                {complaintDetail.location && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Location Coordinates:</Text>
                    <Text style={[styles.sectionValue, { color: '#3b82f6' }]}>
                       {complaintDetail.location.latitude.toFixed(6)}, {complaintDetail.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : null}

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                setDetailModalVisible(false);
                setComplaintDetail(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#1e293b'
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  headerSubtitle: { fontSize: 13, color: '#94a3b8' },
  logoutBtn: { padding: 8, borderRadius: 8, backgroundColor: '#ef444420' },
  logoutText: { color: '#ef4444', fontWeight: '600' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  listContent: { padding: 15, paddingBottom: 40 },
  complaintCard: { 
    backgroundColor: '#1e293b', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  highRiskCard: { borderColor: '#ef4444', borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  complaintType: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  description: { color: '#94a3b8', fontSize: 14, marginBottom: 15 },
  riskIndicator: { backgroundColor: '#ef444415', padding: 8, borderRadius: 8, marginBottom: 15 },
  riskText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  footerInfo: { fontSize: 12, color: '#64748b' },
  assignBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  assignBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  assignedToText: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748b', fontSize: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#1e293b', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24, 
    maxHeight: '80%' 
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  techList: { marginBottom: 20 },
  techItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#334155', 
    borderRadius: 12, 
    marginBottom: 10 
  },
  techAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#475569', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  avatarText: { color: '#f8fafc', fontWeight: 'bold' },
  techName: { color: '#f8fafc', fontWeight: '600', fontSize: 16 },
  techEmail: { color: '#94a3b8', fontSize: 12 },
  cancelBtn: { padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600' },

  // Detail Modal Specific
  detailSection: { marginBottom: 20 },
  sectionLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  sectionValue: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },
  detailImage: { width: '100%', height: 250, borderRadius: 16, marginTop: 10, resizeMode: 'cover', backgroundColor: '#0f172a' }
});

export default AdminDashboardScreen;
