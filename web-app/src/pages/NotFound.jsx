import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center', maxWidth: 540 }}>
        <h1>Page not found</h1>
        <p className="note" style={{ marginTop: 20 }}>
          The page you are looking for does not exist. Use the link below to return to the login page.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link to="/login" className="button secondary">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
