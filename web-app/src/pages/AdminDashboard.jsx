import React, { useEffect, useMemo, useState } from 'react';
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selection, setSelection] = useState({});
  const [analytics, setAnalytics] = useState({ stats: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, techRes, analyticsRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/auth/technicians'),
        api.get('/complaints/analytics'),
      ]);

      setComplaints(complaintsRes.data);
      setTechnicians(
        techRes.data && techRes.data.length > 0
          ? techRes.data
          : [{ _id: 'fallback-tech', name: 'Expert Technician', email: 'tech@gmail.com', role: 'Technician' }]
      );
      setAnalytics(analyticsRes.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to load admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totals = useMemo(
    () => analytics.stats.reduce((acc, item) => {
      acc.total += item.count;
      if (item.highRiskCount) acc.highRisk += item.highRiskCount;
      return acc;
    }, { total: 0, highRisk: 0 }),
    [analytics.stats]
  );

  const handleAssign = async (complaintId) => {
    const technicianId = selection[complaintId];
    if (!technicianId) {
      return alert('Select a technician first.');
    }

    try {
      await api.put(`/complaints/${complaintId}/assign`, { technicianId });
      alert('Technician assigned successfully.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to assign technician.');
    }
  };

  const handleAssignDefault = async () => {
    try {
      const response = await api.put('/complaints/assign-default');
      alert(response.data.message || 'Default technician assigned successfully.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to assign default technician.');
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="topbar">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {userName || 'Admin'}. Monitor reports and assign tasks with one click.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="button warning" type="button" onClick={handleAssignDefault}>
              Assign default technician to all reports
            </button>
            <button className="button secondary" onClick={() => { logout(); navigate('/login'); }}>
              Log out
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="loader">Loading admin panel…</div>
        ) : (
          <>
            <div className="grid grid-2" style={{ marginBottom: 24 }}>
              <div className="card" style={{ padding: '24px' }}>
                <h2>Report totals</h2>
                <div className="badge">Total reports: {totals.total}</div>
                <div className="badge" style={{ marginTop: 12 }}>High risk: {totals.highRisk}</div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <h2>Severity by type</h2>
                {analytics.stats.length === 0 ? (
                  <p className="note">No analytics available yet.</p>
                ) : (
                  <ul style={{ marginTop: 12, gap: 10, display: 'grid' }}>
                    {analytics.stats.map((item) => (
                      <li key={item._id} className="badge" style={{ background: 'rgba(15, 23, 42, 0.75)' }}>
                        {item._id}: {item.count} reports, {item.highRiskCount} high risk
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h2>Open complaints</h2>
              <p className="note">Assign a technician to get work started quickly.</p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint._id}>
                      <td>{complaint.type}</td>
                      <td>{complaint.userId?.name || complaint.userId?.email || 'Unknown'}</td>
                      <td style={{ color: statusColor(complaint.status) }}>{complaint.status}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <select
                            className="select"
                            value={selection[complaint._id] || ''}
                            onChange={(event) => setSelection((state) => ({ ...state, [complaint._id]: event.target.value }))}
                          >
                            <option value="">Select technician</option>
                            {technicians.map((tech) => (
                              <option key={tech._id} value={tech._id}>{tech.name}</option>
                            ))}
                          </select>
                          <button
                            className="button primary"
                            type="button"
                            onClick={() => handleAssign(complaint._id)}
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
