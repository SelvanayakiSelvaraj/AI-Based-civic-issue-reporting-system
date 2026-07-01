import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Image, Alert, RefreshControl, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../src/config';

const TaskBoardScreen = () => {
  const { userToken, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const res = await axios.get(`${API_URL}/complaints/assigned`, config);
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async (complaintId, status) => {
    let completionImageUrl = null;

    if (status === 'Completed') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled) return;
      
      const asset = result.assets[0];
      if (asset.base64) {
        completionImageUrl = `data:image/jpeg;base64,${asset.base64}`;
      } else if (asset.uri && asset.uri.startsWith('data:')) {
        completionImageUrl = asset.uri;
      } else {
        Alert.alert("Error", "Could not read image data. Please try another photo.");
        return;
      }
    }

    setUpdatingId(complaintId);
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      await axios.put(`${API_URL}/complaints/${complaintId}/status`, { 
        status, 
        completionImageUrl 
      }, config);
      fetchTasks();
      Alert.alert("Success", `Task status updated to ${status}`);
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    } finally {
      setUpdatingId(null);
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
        Alert.alert("Notice", "No proof image available.");
      }
    } catch (error) {
      console.error('Error fetching proof:', error);
      Alert.alert("Error", "Failed to fetch proof image.");
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.taskType}>{item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.locationContainer}>
        <Text style={styles.locationLabel}>📍 Location:</Text>
        <Text style={styles.locationVal}>{item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}</Text>
      </View>

      {item.status !== 'Completed' && (
        <View style={styles.actionRow}>
          {item.status === 'Assigned' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.startBtn]} 
              onPress={() => handleUpdateStatus(item._id, 'In Progress')}
              disabled={updatingId === item._id}
            >
              {updatingId === item._id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Start Work</Text>}
            </TouchableOpacity>
          )}
          
          {(item.status === 'In Progress' || item.status === 'Assigned') && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.finishBtn]} 
              onPress={() => handleUpdateStatus(item._id, 'Completed')}
              disabled={updatingId === item._id}
            >
              {updatingId === item._id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Mark Fixed</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {item.status === 'Completed' && (
        <View style={styles.proofContainer}>
          <Text style={styles.proofLabel}>Completion Proof:</Text>
          {proofs[item._id] ? (
            <Image source={{ uri: proofs[item._id] }} style={styles.proofImage} />
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

  const getStatusColor = (status) => {
    switch(status) {
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
          <Text style={styles.headerTitle}>Task Board</Text>
          <Text style={styles.headerSubtitle}>Field Service Management</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchTasks();}} tintColor="#3b82f6" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks assigned to you yet.</Text>
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
  taskCard: { 
    backgroundColor: '#1e293b', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskType: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  description: { color: '#94a3b8', fontSize: 14, marginBottom: 15, lineHeight: 20 },
  locationContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#0f172a', padding: 10, borderRadius: 8 },
  locationLabel: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold', marginRight: 5 },
  locationVal: { color: '#f8fafc', fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  startBtn: { backgroundColor: '#8b5cf6', marginRight: 10 },
  finishBtn: { backgroundColor: '#10b981' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  proofContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#334155' },
  proofLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  proofImage: { width: '100%', height: 150, borderRadius: 12, resizeMode: 'cover' },
  viewProofBtn: { backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5, borderStyle: 'dashed', borderWidth: 1, borderColor: '#475569' },
  viewProofText: { color: '#3b82f6', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748b', fontSize: 16 }
});

export default TaskBoardScreen;
