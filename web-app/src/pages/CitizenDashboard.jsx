import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS = {
  Pending: '#facc15',
  Assigned: '#2563eb',
  'In Progress': '#10b981',
  Completed: '#14b8a6',
};

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [type, setType] = useState('Water Leak');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const fetchComplaints = async () => {
    setError('');
    try {
      const response = await api.get('/complaints/my');
      setComplaints(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports.');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const summary = useMemo(() => {
    return complaints.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { Pending: 0, Assigned: 0, 'In Progress': 0, Completed: 0 }
    );
  }, [complaints]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!description.trim()) {
      return setError('Description is required.');
    }

    setIsLoading(true);

    try {
      const position = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          return resolve({ latitude: 0, longitude: 0 });
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          () => resolve({ latitude: 0, longitude: 0 }),
          { timeout: 8000 }
        );
      });

      const imageUrl = imageFile ? await readFileAsDataUrl(imageFile) : '';

      await api.post('/complaints', {
        type,
        description,
        location: position,
        imageUrl,
        audioUrl: '',
      });

      setDescription('');
      setType('Water Leak');
      setImageFile(null);
      setImagePreview('');
      await fetchComplaints();
      alert('Report submitted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit report.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="topbar">
          <div>
            <h1>Citizen Dashboard</h1>
            <p>Welcome back, {userName || 'Citizen'}. Track your reports and submit new issues from the web.</p>
          </div>
          <button className="button secondary" onClick={() => { logout(); navigate('/login'); }}>
            Log out
          </button>
        </div>

        <div className="grid grid-2">
          <div className="card" style={{ padding: '24px' }}>
            <h2>Create a report</h2>
            <p className="note">Use the form below to create a new complaint. Location is filled from your browser when available.</p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="type">Issue type</label>
              <select id="type" className="select" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Water Leak</option>
                <option>Road Damage</option>
                <option>Power Outage</option>
                <option>Sewage/Drains</option>
                <option>Other</option>
              </select>

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the issue in detail"
              />

              <label htmlFor="reportImage">Upload photo (optional)</label>
              <input
                id="reportImage"
                className="input"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  setImageFile(selectedFile);
                  setImagePreview(selectedFile ? URL.createObjectURL(selectedFile) : '');
                }}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Selected evidence"
                  style={{ width: '100%', maxHeight: 250, objectFit: 'cover', borderRadius: 12, marginTop: 12 }}
                />
              )}

              {error && <p className="note" style={{ marginTop: 16 }}>{error}</p>}

              <button className="button primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting…' : 'Submit report'}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2>Report summary</h2>
            <div className="grid" style={{ gap: '12px', marginTop: 16 }}>
              {Object.entries(summary).map(([status, value]) => (
                <div key={status} className="badge" style={{ background: STATUS_COLORS[status] ? `${STATUS_COLORS[status]}22` : 'rgba(148, 163, 184, 0.12)' }}>
                  <span>{status}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            {complaints.length === 0 ? (
              <p className="note" style={{ marginTop: 18 }}>No reports found. Submit your first issue.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((item) => (
                    <tr key={item._id}>
                      <td>{item.type}</td>
                      <td style={{ color: STATUS_COLORS[item.status] || '#e2e8f0' }}>{item.status}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
