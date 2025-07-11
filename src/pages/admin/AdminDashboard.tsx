import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Property, Booking, Inquiry } from '@/types/admin';
import { getStatusBadge, formatCurrency, getUserTypeColor } from '@/utils/adminHelpers';

import ViewUserModal from '@/components/admin/ViewUserModal';
import ViewPropertyModal from '@/components/admin/ViewPropertyModal';
import ViewBookingModal from '@/components/admin/ViewBookingModal';
import ViewInquiryModal from '@/components/admin/ViewInquiryModal';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import EditPropertyModal from '@/components/admin/EditPropertyModal';
import AssignAgentModal from '@/components/admin/AssignAgentModal';
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
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showViewPropertyModal, setShowViewPropertyModal] = useState(false);
  const [showViewBookingModal, setShowViewBookingModal] = useState(false);
  const [showViewInquiryModal, setShowViewInquiryModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingApprovals: 0,
    notifications: [],
    dailyStats: { newUsers: 0, newProperties: 0, newBookings: 0, newInquiries: 0 },
    weeklyStats: { users: 0, properties: 0, bookings: 0, inquiries: 0 },
    propertyValues: { totalSaleValue: 0, totalRentValue: 0, averagePrice: 0, averageRent: 0 },
    unassignedProperties: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch all data
  const fetchAllData = () => {
    setIsRefreshing(true);
    
    // Fetch each data type separately to avoid Promise.all failures
    fetchStats()
      .then(() => fetchUsers())
      .then(() => fetchProperties())
      .then(() => fetchBookings())
      .then(() => fetchInquiries())
      .then(() => fetchNotifications())
      .catch(error => console.error('Error fetching data:', error))
      .finally(() => {
        setIsRefreshing(false);
        setLoading(false);
      });
  };
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        usersCount, propertiesCount, bookingsCount, inquiriesCount, approvalsCount,
        dailyUsers, dailyProperties, dailyBookings, dailyInquiries,
        weeklyUsers, weeklyProperties, weeklyBookings, weeklyInquiries,
        saleProperties, rentProperties, unassignedProps
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        
        // Daily stats
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', today),
        
        // Weekly stats
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        
        // Property values
        supabase.from('properties').select('price').eq('listing_type', 'SALE').not('price', 'is', null),
        supabase.from('properties').select('monthly_rent').eq('listing_type', 'RENT').not('monthly_rent', 'is', null),
        supabase.from('properties').select('*', { count: 'exact', head: true }).is('owner_id', null)
      ]);

      // Calculate property values
      const totalSaleValue = saleProperties.data?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const totalRentValue = rentProperties.data?.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) || 0;
      const averagePrice = saleProperties.data?.length ? totalSaleValue / saleProperties.data.length : 0;
      const averageRent = rentProperties.data?.length ? totalRentValue / rentProperties.data.length : 0;

      setStats({
        totalUsers: usersCount.count || 0,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalInquiries: inquiriesCount.count || 0,
        pendingApprovals: approvalsCount.count || 0,
        dailyStats: {
          newUsers: dailyUsers.count || 0,
          newProperties: dailyProperties.count || 0,
          newBookings: dailyBookings.count || 0,
          newInquiries: dailyInquiries.count || 0,
        },
        weeklyStats: {
          users: weeklyUsers.count || 0,
          properties: weeklyProperties.count || 0,
          bookings: weeklyBookings.count || 0,
          inquiries: weeklyInquiries.count || 0,
        },
        propertyValues: {
          totalSaleValue,
          totalRentValue,
          averagePrice,
          averageRent,
        },
        unassignedProperties: unassignedProps.count || 0,
        notifications: []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch properties
  const fetchProperties = async () => {
    try {
      console.log('Fetching properties...');
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          users:owner_id (
            first_name,
            last_name,
            custom_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings...');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            custom_id
          ),
          users:user_id (
            first_name,
            last_name,
            custom_id
          ),
          agent:agent_id (
            first_name,
            last_name,
            agent_license_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch inquiries
  const fetchInquiries = async () => {
    try {
      console.log('Fetching inquiries...');
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          properties (
            title,
            custom_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStats(prev => ({
        ...prev,
        notifications: data || []
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      fetchAllData();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Delete property
  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      fetchAllData();
      alert('Property deleted successfully!');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

  // Add booking
  const handleAddBooking = async () => {
    // Show add booking modal
    alert('Add booking functionality will be implemented here');
  };

  // Edit booking
  const handleEditBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    // Show edit booking modal
    alert('Edit booking functionality will be implemented here');
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      
      fetchAllData();
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    }
  };

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
      return; 
    }
    
    // Initial data fetch
    fetchAllData();

    // Set up a simple refresh interval instead of real-time subscriptions
    const refreshInterval = setInterval(() => {
      if (!isRefreshing) {
        fetchAllData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
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
  
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewUserModal(true);
  };
  
  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowEditPropertyModal(true);
  };
  
  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowViewPropertyModal(true);
  };
  
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewBookingModal(true);
  };
  
  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowViewInquiryModal(true);
  };

  const handleAssignAgent = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setSelectedInquiryId(inquiry.id);
    setShowAssignAgentModal(true);
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
            onView={handleViewUser}
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
            onView={handleViewUser}
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
            onEdit={handleEditProperty}
            onView={handleViewProperty}
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
            onEdit={handleEditProperty}
            onView={handleViewProperty}
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
            onEdit={handleEditProperty}
            onView={handleViewProperty}
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
            onAdd={handleAddBooking}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
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
            onAssignAgent={handleAssignAgent}
            onView={handleViewInquiry}
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
          isRefreshing={isRefreshing}
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
      
      <ViewUserModal
        isOpen={showViewUserModal}
        onClose={() => setShowViewUserModal(false)}
        user={selectedUser}
      />
      
      <ViewPropertyModal
        isOpen={showViewPropertyModal}
        onClose={() => setShowViewPropertyModal(false)}
        property={selectedProperty}
      />
      
      <ViewBookingModal
        isOpen={showViewBookingModal}
        onClose={() => setShowViewBookingModal(false)}
        booking={selectedBooking}
      />
      
      <ViewInquiryModal
        isOpen={showViewInquiryModal}
        onClose={() => setShowViewInquiryModal(false)}
        inquiry={selectedInquiry}
      />
      
      <EditPropertyModal
        isOpen={showEditPropertyModal}
        onClose={() => setShowEditPropertyModal(false)}
        onPropertyUpdated={fetchAllData}
        property={selectedProperty}
      />
      
      <AssignAgentModal
        isOpen={showAssignAgentModal}
        onClose={() => setShowAssignAgentModal(false)}
        inquiryId={selectedInquiryId}
        onAssigned={fetchAllData}
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