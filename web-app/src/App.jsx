import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NotFound from './pages/NotFound';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard'));

function RoleGuard({ allowed, children }) {
  const { userRole, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="page">
        <div className="loader">Loading…</div>
      </div>
    );
  }

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  return allowed.includes(userRole) ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="loader">Loading…</div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/citizen" element={<RoleGuard allowed={["Citizen"]}><CitizenDashboard /></RoleGuard>} />
        <Route path="/admin" element={<RoleGuard allowed={["Admin"]}><AdminDashboard /></RoleGuard>} />
        <Route path="/technician" element={<RoleGuard allowed={["Technician"]}><TechnicianDashboard /></RoleGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
