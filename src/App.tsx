import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AddAdminUser from './pages/admin/AddAdminUser';
import RolesPrivileges from './pages/admin/RolesPrivileges';
import AdminSliders from './pages/admin/AdminSliders';
import AddSlider from './pages/admin/AddSlider';
import Users from './pages/users/Users';
import AddUser from './pages/users/AddUser';
import Agents from './pages/users/Agents';
import AddAgent from './pages/users/AddAgent';
import EmailToUsers from './pages/users/EmailToUsers';
import HomeSliders from './pages/home/Sliders';
import AddHomeSlider from './pages/home/AddSlider';
import FeaturedCities from './pages/home/FeaturedCities';
import AddFeaturedCity from './pages/home/AddFeaturedCity';
import CommunityBanners from './pages/home/CommunityBanners';
import AddCommunityBanner from './pages/home/AddCommunityBanner';
import PreFooters from './pages/home/PreFooters';
import AddPreFooter from './pages/home/AddPreFooter';
import RequestTour from './pages/tours/RequestTour';
import Bookings from './pages/tours/Bookings';
import Properties from './pages/listings/Properties';
import AddProperty from './pages/listings/AddProperty';
import PropertyOnboardRequests from './pages/listings/PropertyOnboardRequests';
import PropertyCategories from './pages/listings/PropertyCategories';
import AddPropertyCategory from './pages/listings/AddPropertyCategory';
import Help from './components/Help';
import Home from './pages/client/Home';
import Buy from './pages/client/Buy';
import Rent from './pages/client/Rent';
import Sell from './pages/client/Sell';
import ClientAgents from './pages/client/Agents';
import PropertyDetails from './pages/client/PropertyDetails';
import Login from './pages/auth/Login';

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
          <Route path="/agents" element={<ClientAgents />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/admin" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="manage-admin/users" element={<AdminUsers />} />
            <Route path="manage-admin/users/add" element={<AddAdminUser />} />
            <Route path="manage-admin/roles" element={<RolesPrivileges />} />
            <Route path="manage-admin/sliders" element={<AdminSliders />} />
            <Route path="manage-admin/sliders/add" element={<AddSlider />} />
            <Route path="manage-users/users" element={<Users />} />
            <Route path="manage-users/users/add" element={<AddUser />} />
            <Route path="manage-users/agents" element={<Agents />} />
            <Route path="manage-users/agents/add" element={<AddAgent />} />
            <Route path="manage-users/email" element={<EmailToUsers />} />
            <Route path="home/sliders" element={<HomeSliders />} />
            <Route path="home/sliders/add" element={<AddHomeSlider />} />
            <Route path="home/featured-cities" element={<FeaturedCities />} />
            <Route path="home/featured-cities/add" element={<AddFeaturedCity />} />
            <Route path="home/banners" element={<CommunityBanners />} />
            <Route path="home/banners/add" element={<AddCommunityBanner />} />
            <Route path="home/pre-footers" element={<PreFooters />} />
            <Route path="home/pre-footers/add" element={<AddPreFooter />} />
            <Route path="tours/requests" element={<RequestTour />} />
            <Route path="tours/bookings" element={<Bookings />} />
            <Route path="listings/properties" element={<Properties />} />
            <Route path="listings/properties/add" element={<AddProperty />} />
            <Route path="listings/onboard-requests" element={<PropertyOnboardRequests />} />
            <Route path="listings/categories" element={<PropertyCategories />} />
            <Route path="listings/categories/add" element={<AddPropertyCategory />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;