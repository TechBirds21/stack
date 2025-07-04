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
import SellerApprovals from './pages/admin/SellerApprovals';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/property/:id" element={<PropertyDetails />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/seller-approvals" element={<SellerApprovals />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;