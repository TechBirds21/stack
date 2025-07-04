import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PropertyDetails from './pages/property/PropertyDetails';
import Notifications from './pages/notifications/Notifications';
import AddNotification from './pages/notifications/AddNotification';
import NotificationAnalytics from './pages/notifications/NotificationAnalytics';
import ViewNotification from './pages/notifications/ViewNotification';
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

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/property/:id" element={<PropertyDetails />} />

        {/* Protected Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Notifications Routes */}
            <Route path="notifications" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="notifications/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddNotification />
              </ProtectedRoute>
            } />
            <Route path="notifications/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <NotificationAnalytics />
              </ProtectedRoute>
            } />
            <Route path="notifications/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ViewNotification />
              </ProtectedRoute>
            } />
            <Route path="notifications/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddNotification />
              </ProtectedRoute>
            } />
            
            <Route path="manage-admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="manage-admin/users/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddAdminUser />
              </ProtectedRoute>
            } />
            <Route path="manage-admin/roles" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RolesPrivileges />
              </ProtectedRoute>
            } />
            <Route path="manage-admin/sliders" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSliders />
              </ProtectedRoute>
            } />
            <Route path="manage-admin/sliders/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddSlider />
              </ProtectedRoute>
            } />
            <Route path="manage-users/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="manage-users/users/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddUser />
              </ProtectedRoute>
            } />
            <Route path="manage-users/agents" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Agents />
              </ProtectedRoute>
            } />
            <Route path="manage-users/agents/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddAgent />
              </ProtectedRoute>
            } />
            <Route path="manage-users/email" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmailToUsers />
              </ProtectedRoute>
            } />
            <Route path="home/sliders" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HomeSliders />
              </ProtectedRoute>
            } />
            <Route path="home/sliders/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddHomeSlider />
              </ProtectedRoute>
            } />
            <Route path="home/featured-cities" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <FeaturedCities />
              </ProtectedRoute>
            } />
            <Route path="home/featured-cities/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddFeaturedCity />
              </ProtectedRoute>
            } />
            <Route path="home/banners" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CommunityBanners />
              </ProtectedRoute>
            } />
            <Route path="home/banners/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddCommunityBanner />
              </ProtectedRoute>
            } />
            <Route path="home/pre-footers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PreFooters />
              </ProtectedRoute>
            } />
            <Route path="home/pre-footers/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddPreFooter />
              </ProtectedRoute>
            } />
            <Route path="tours/requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RequestTour />
              </ProtectedRoute>
            } />
            <Route path="tours/bookings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="listings/properties" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Properties />
              </ProtectedRoute>
            } />
            <Route path="listings/properties/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddProperty />
              </ProtectedRoute>
            } />
            <Route path="listings/onboard-requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PropertyOnboardRequests />
              </ProtectedRoute>
            } />
            <Route path="listings/categories" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PropertyCategories />
              </ProtectedRoute>
            } />
            <Route path="listings/categories/add" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddPropertyCategory />
              </ProtectedRoute>
            } />
        </Route>

          {/* Seller Dashboard Routes */}
          <Route path="/seller/dashboard" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Seller Dashboard</h1>
                <p>Welcome to your seller dashboard!</p>
              </div>
            </ProtectedRoute>
          } />

          {/* Buyer Dashboard Routes */}
          <Route path="/buyer/dashboard" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Buyer Dashboard</h1>
                <p>Welcome to your buyer dashboard!</p>
              </div>
            </ProtectedRoute>
          } />

          {/* Agent Dashboard Routes */}
          <Route path="/agent/dashboard" element={
            <ProtectedRoute allowedRoles={['agent']}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Agent Dashboard</h1>
                <p>Welcome to your agent dashboard!</p>
              </div>
            </ProtectedRoute>
          } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;