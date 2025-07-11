import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext'; 

import Home from './pages/client/Home';
import Buy from './pages/client/Buy';
import Rent from './pages/client/Rent';
import Sell from './pages/client/Sell';
import Agents from './pages/client/Agents';
import PropertyDetails from './pages/client/PropertyDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import About from './pages/client/About';
import Host from './pages/client/Host';
import Community from './pages/client/Community';
import MyBookings from './pages/client/MyBookings';
import MyInquiries from './pages/client/MyInquiries';
import EmailVerification from './pages/EmailVerification';
import AgentAssignments from './pages/agent/AgentAssignments';
import AgentDashboard from './pages/agent/AgentDashboard';
import { Toaster } from 'react-hot-toast';
import Profile from './pages/client/Profile';

function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto-redirect admin users to dashboard
    if (user?.user_type === 'admin' && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
    
    // Auto-redirect agent users to dashboard
    if (user?.user_type === 'agent' && location.pathname === '/') {
      navigate('/agent/dashboard', { replace: true });
    }
  }, [user, navigate, location.pathname]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/rent" element={<Rent />} />
      <Route path="/sell" element={<Sell />} />
      <Route path="/about" element={<About />} />
      <Route path="/host" element={<Host />} />
      <Route path="/community" element={<Community />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/my-inquiries" element={<MyInquiries />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/agent/assignments" element={<AgentAssignments />} />
      <Route path="/agent/dashboard/*" element={<AgentDashboard />} />
      <Route path="/agent/dashboard" element={<AgentDashboard />} />

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
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;