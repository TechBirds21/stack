import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/client/Home';
import Buy from './pages/client/Buy';
import Rent from './pages/client/Rent';
import Sell from './pages/client/Sell';
import Agents from './pages/client/Agents';
import PropertyDetails from './pages/client/PropertyDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import MyBookings from './pages/client/MyBookings';
import MyInquiries from './pages/client/MyInquiries';
import EmailVerification from './pages/EmailVerification';
import AgentAssignments from './pages/agent/AgentAssignments';
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect admin users to dashboard
    if (user?.user_type === 'admin' && window.location.pathname === '/') {
      navigate('/admin');
    }
  }, [user, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/rent" element={<Rent />} />
      <Route path="/sell" element={<Sell />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/my-inquiries" element={<MyInquiries />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/agent/assignments" element={<AgentAssignments />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/*" element={<AdminDashboard />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;