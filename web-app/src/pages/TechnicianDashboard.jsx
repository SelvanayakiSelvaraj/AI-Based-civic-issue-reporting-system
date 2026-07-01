import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const statusColor = (status) => {
  switch (status) {
    case 'Pending':
      return '#facc15';
    case 'Assigned':
      return '#2563eb';
    case 'In Progress':
      return '#10b981';
    case 'Completed':
      return '#14b8a6';
    default:
      return '#94a3b8';
  }
};

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeUpdating, setActiveUpdating] = useState('');

  const fetchTasks = async () => {
    try {
      const response = await api.get('/complaints/assigned');
      setTasks(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to load tasks.');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (id, status) => {
    setActiveUpdating(id);
    try {
      await api.put(`/complaints/${id}/status`, { status });
      await fetchTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update task status.');
    } finally {
      setActiveUpdating('');
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="topbar">
          <div>
            <h1>Technician Task Board</h1>
            <p>Welcome back, {userName || 'Technician'}. Update statuses and keep the city moving.</p>
          </div>
          <button className="button secondary" onClick={() => { logout(); navigate('/login'); }}>
            Log out
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="note">No assigned tasks yet. Check back later once a task is assigned.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.type}</td>
                  <td>{task.description}</td>
                  <td style={{ color: statusColor(task.status) }}>{task.status}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {task.status !== 'In Progress' && (
                        <button
                          className="button primary"
                          type="button"
                          onClick={() => updateStatus(task._id, 'In Progress')}
                          disabled={activeUpdating === task._id}
                        >
                          {activeUpdating === task._id ? 'Updating…' : 'Start'}
                        </button>
                      )}
                      {task.status !== 'Completed' && (
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => updateStatus(task._id, 'Completed')}
                          disabled={activeUpdating === task._id}
                        >
                          {activeUpdating === task._id ? 'Updating…' : 'Complete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
