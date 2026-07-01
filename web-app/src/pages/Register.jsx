import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const determineRole = (emailAddress) => {
    const lower = emailAddress.toLowerCase();
    if (lower.includes('admin')) return 'Admin';
    if (lower.includes('tech')) return 'Technician';
    return 'Citizen';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !email || !password) {
      return alert('All fields are required.');
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        role: determineRole(email),
      });
      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration Error:', error);
      const message = error.response?.data?.message || error.message || 'Unable to register.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 460, width: '100%' }}>
        <div className="topbar">
          <div>
            <h1>Create your account</h1>
            <p>Register quickly and get access to the civic reporting system.</p>
          </div>
          <Link to="/login" className="link-button">Sign in</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="John Doe"
          />

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
            placeholder="Choose a strong password"
          />

          <button className="button primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
