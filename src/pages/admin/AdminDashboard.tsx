import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { User, Property, Booking, Inquiry } from '@/types/admin';
import { getStatusBadge, formatCurrency, getUserTypeColor } from '@/utils/adminHelpers';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import DashboardOverview from '@/components/admin/DashboardOverview';
import AdminTable from '@/components/admin/AdminTable';
import AddUserModal from '@/components/admin/AddUserModal';
import AddPropertyModal from '@/components/admin/AddPropertyModal';
import EditUserModal from '@/components/admin/EditUserModal';

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Data hook
  const {
    stats,
    users,
    properties,
    bookings,
    inquiries,
    loading,
    fetchAllData,
    handleDeleteUser,
    handleDeleteProperty
  } = useAdminData();

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchAllData();
  }, [user, navigate]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'users':
        setActiveTab('users');
        break;
      case 'properties':
        setActiveTab('properties');
        break;
      case 'bookings':
        setActiveTab('bookings');
        break;
      case 'inquiries':
        setActiveTab('inquiries');
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    // Define propertyColumns outside switch to avoid temporal dead zone
    const propertyColumns = [
      { key: 'custom_id', header: 'ID' },
      { key: 'title', header: 'Title' },
      { key: 'property_type', header: 'Type' },
      { key: 'city', header: 'City' },
      { key: 'listing_type', header: 'Listing Type' },
      { key: 'price', header: 'Price', render: (property: Property) => 
        property.listing_type === 'SALE' ? formatCurrency(property.price) : formatCurrency(property.monthly_rent) + '/month'
      },
      { key: 'owner', header: 'Owner', render: (property: Property) => 
        property.users ? `${property.users.first_name} ${property.users.last_name} (${property.users.custom_id})` : 'Unassigned'
      },
      { key: 'status', header: 'Status', render: (property: Property) => getStatusBadge(property.status) }
    ];

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            stats={stats}
            onCardClick={handleCardClick}
            onAddUser={() => setShowAddUserModal(true)}
            onAddProperty={() => setShowAddPropertyModal(true)}
            users={users}
            properties={properties}
            bookings={bookings}
            inquiries={inquiries}
            onRefresh={fetchAllData}
          />
        );
      
      case 'users':
        const userColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'user_type', header: 'Type', render: (user: User) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
              {user.user_type}
            </span>
          )},
          { key: 'status', header: 'Status', render: (user: User) => getStatusBadge(user.status) },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return (
          <AdminTable
            data={users}
            columns={userColumns}
            title="Users"
            onAdd={() => setShowAddUserModal(true)}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={fetchAllData}
          />
        );
      
      case 'agents':
        const agentUsers = users.filter(user => user.user_type === 'agent');
        const agentColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'agent_license_number', header: 'License Number', render: (user: User) => user.agent_license_number || 'Pending Verification' },
          { key: 'status', header: 'Status', render: (user: User) => getStatusBadge(user.status) },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return (
          <AdminTable
            data={agentUsers}
            columns={agentColumns}
            title="Agents"
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onRefresh={fetchAllData}
          />
        );
      
      case 'properties':
        return (
          <AdminTable
            data={properties}
            columns={propertyColumns}
            title="Properties"
            onAdd={() => setShowAddPropertyModal(true)}
            onDelete={handleDeleteProperty}
            onRefresh={fetchAllData}
          />
        );

      case 'properties-sale':
        const saleProperties = properties.filter(p => p.listing_type === 'SALE');
        return (
          <AdminTable
            data={saleProperties}
            columns={propertyColumns}
            title="Properties for Sale"
            onAdd={() => setShowAddPropertyModal(true)}
            onDelete={handleDeleteProperty}
            onRefresh={fetchAllData}
          />
        );

      case 'properties-rent':
        const rentProperties = properties.filter(p => p.listing_type === 'RENT');
        return (
          <AdminTable
            data={rentProperties}
            columns={propertyColumns}
            title="Properties for Rent"
            onAdd={() => setShowAddPropertyModal(true)}
            onDelete={handleDeleteProperty}
            onRefresh={fetchAllData}
          />
        );
      
      case 'bookings':
        const bookingColumns = [
          { key: 'booking_date', header: 'Date' },
          { key: 'booking_time', header: 'Time' },
          { key: 'property', header: 'Property', render: (booking: Booking) => 
            `${booking.properties?.title} (${booking.properties?.custom_id})`
          },
          { key: 'user', header: 'Customer', render: (booking: Booking) => 
            `${booking.users?.first_name} ${booking.users?.last_name} (${booking.users?.custom_id})`
          },
          { key: 'agent', header: 'Agent', render: (booking: Booking) => 
            booking.agent ? `${booking.agent.first_name} ${booking.agent.last_name} (${booking.agent.agent_license_number})` : 'Not Assigned'
          },
          { key: 'status', header: 'Status', render: (booking: Booking) => getStatusBadge(booking.status) }
        ];
        return (
          <AdminTable
            data={bookings}
            columns={bookingColumns}
            title="Bookings"
            onRefresh={fetchAllData}
          />
        );
      
      case 'inquiries':
        const inquiryColumns = [
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'property', header: 'Property', render: (inquiry: Inquiry) => 
            `${inquiry.properties?.title} (${inquiry.properties?.custom_id})`
          },
          { key: 'message', header: 'Message', render: (inquiry: Inquiry) => 
            inquiry.message.length > 50 ? inquiry.message.substring(0, 50) + '...' : inquiry.message
          },
          { key: 'status', header: 'Status', render: (inquiry: Inquiry) => getStatusBadge(inquiry.status) }
        ];
        return (
          <AdminTable
            data={inquiries}
            columns={inquiryColumns}
            title="Inquiries"
            onRefresh={fetchAllData}
          />
        );
      
      default:
        return (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        expandedMenus={expandedMenus}
        onTabChange={setActiveTab}
        onMenuToggle={toggleMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
        />

        {/* Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-[#3B5998] text-white text-center py-4 no-print">
          <p className="text-sm">© Home & Own 2025. All Rights Reserved</p>
        </footer>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={fetchAllData}
      />

      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={fetchAllData}
      />

      <EditUserModal
        isOpen={showEditUserModal}
        onClose={() => setShowEditUserModal(false)}
        onUserUpdated={fetchAllData}
        user={selectedUser}
      />

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;