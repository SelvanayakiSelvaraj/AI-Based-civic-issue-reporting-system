import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      return alert('Please fill in both email and password.');
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      login({ token: response.data.token, role: response.data.role, name: response.data.name });
      switch (response.data.role?.toLowerCase()) {
        case 'admin':
          navigate('/admin');
          break;
        case 'technician':
        case 'tech':
          navigate('/technician');
          break;
        default:
          navigate('/citizen');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to login. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <div className="topbar">
          <div>
            <h1>CivicConnect</h1>
            <p>Secure login for citizens, admins, and technicians.</p>
          </div>
          <Link to="/register" className="link-button">Create account</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />

          <button className="button primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
