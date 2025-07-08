import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Home, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Settings,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Plus,
  Bell,
  FileText,
  UserPlus,
  Building,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Upload,
  Download,
  Menu,
  ChevronDown,
  BarChart3,
  HelpCircle,
  CreditCard,
  Globe,
  MapPin,
  Languages,
  FileJson,
  Shield,
  Image,
  UserCog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import AddUserModal from '@/components/admin/AddUserModal';
import AddPropertyModal from '@/components/admin/AddPropertyModal';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  pendingSellerApprovals: number;
  recentActivity: any[];
  notifications: any[];
}

interface User {
  id: string;
  custom_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: string;
  status: string;
  verification_status: string;
  agent_license_number?: string;
  created_at: string;
}

interface Property {
  id: string;
  custom_id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price: number;
  monthly_rent: number;
  city: string;
  status: string;
  featured: boolean;
  verified: boolean;
  created_at: string;
  owner: {
    first_name: string;
    last_name: string;
    custom_id: string;
    agent_license_number?: string;
  };
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  properties: {
    title: string;
    custom_id: string;
  };
  users: {
    first_name: string;
    last_name: string;
    custom_id: string;
  };
  agent?: {
    first_name: string;
    last_name: string;
    custom_id: string;
    agent_license_number: string;
  };
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  properties: {
    title: string;
    custom_id: string;
  };
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingSellerApprovals: 0,
    recentActivity: [],
    notifications: []
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<'user' | 'property' | 'booking' | 'inquiry'>('user');

  // Sidebar menu items
  const menuItems = [
    { icon: <TrendingUp size={20} />, label: 'Dashboard', path: 'dashboard', highlight: true },
    {
      icon: <Settings size={20} />,
      label: 'Manage Admin',
      path: 'manage-admin',
      subItems: [
        { icon: <UserCog size={20} />, label: 'Admin Users', path: 'admin-users' },
        { icon: <Shield size={20} />, label: 'Roles & Privileges', path: 'roles' },
        { icon: <Image size={20} />, label: 'Admin Sliders', path: 'sliders' },
      ]
    },
    {
      icon: <Users size={20} />,
      label: 'Manage Users',
      path: 'users',
      subItems: [
        { icon: <UserCog size={20} />, label: 'Users', path: 'users' },
        { icon: <Shield size={20} />, label: 'Agents', path: 'agents' },
        { icon: <Image size={20} />, label: 'Email to Users', path: 'email' },
      ]
    },
    {
      icon: <Home size={20} />,
      label: 'Home Page',
      path: 'home-page',
      subItems: [
        { icon: <Image size={20} />, label: 'Sliders', path: 'home-sliders' },
        { icon: <Building size={20} />, label: 'Featured Cities', path: 'featured-cities' },
        { icon: <Image size={20} />, label: 'Community Banners', path: 'banners' },
        { icon: <Image size={20} />, label: 'Pre Footers', path: 'pre-footers' },
      ]
    },
    {
      icon: <Calendar size={20} />,
      label: 'Request Tour',
      path: 'bookings',
      subItems: [
        { icon: <Calendar size={20} />, label: 'Request Tour', path: 'tour-requests' },
        { icon: <Calendar size={20} />, label: 'Bookings', path: 'bookings' },
      ]
    },
    {
      icon: <Building size={20} />,
      label: 'Listing Management',
      path: 'properties',
      subItems: [
        { icon: <Home size={20} />, label: 'Properties', path: 'properties' },
        { icon: <FileText size={20} />, label: 'Property Onboard Requests', path: 'onboard-requests' },
        { icon: <Building size={20} />, label: 'Property Categories', path: 'categories' },
        { icon: <Building size={20} />, label: 'Property Types', path: 'types' },
        { icon: <Building size={20} />, label: 'Property Feature Types', path: 'features' },
        { icon: <Building size={20} />, label: 'Amenity Types', path: 'amenity-types' },
        { icon: <Building size={20} />, label: 'Amenities', path: 'amenities' },
        { icon: <CreditCard size={20} />, label: 'Property Payments', path: 'payments' },
      ]
    },
    {
      icon: <HelpCircle size={20} />,
      label: 'Help Management',
      path: 'help-management',
      subItems: [
        { icon: <Building size={20} />, label: 'Help Categories', path: 'help-categories' },
        { icon: <HelpCircle size={20} />, label: 'Helps', path: 'helps' },
      ]
    },
    {
      icon: <FileText size={20} />,
      label: 'Blog Management',
      path: 'blog-management',
      subItems: [
        { icon: <Building size={20} />, label: 'Blog Categories', path: 'blog-categories' },
        { icon: <FileText size={20} />, label: 'Blogs', path: 'blogs' },
      ]
    },
    {
      icon: <Shield size={20} />,
      label: 'Credentials',
      path: 'credentials',
      subItems: [
        { icon: <Shield size={20} />, label: 'API Credentials', path: 'api' },
        { icon: <CreditCard size={20} />, label: 'Payment Gateways', path: 'payment' },
        { icon: <Settings size={20} />, label: 'Email Configurations', path: 'email' },
      ]
    },
    {
      icon: <Settings size={20} />,
      label: 'Site Management',
      path: 'site-settings',
      subItems: [
        { icon: <Settings size={20} />, label: 'Global Settings', path: 'global' },
        { icon: <Globe size={20} />, label: 'Social Media Links', path: 'social' },
        { icon: <FileText size={20} />, label: 'Meta Informations', path: 'meta' },
        { icon: <CreditCard size={20} />, label: 'Fees', path: 'fees' },
      ]
    },
    { icon: <FileText size={20} />, label: 'Reports', path: 'reports' },
    { icon: <CreditCard size={20} />, label: 'Transactions', path: 'transactions' },
    { icon: <Globe size={20} />, label: 'Countries', path: 'countries' },
    { icon: <MapPin size={20} />, label: 'States', path: 'states' },
    { icon: <Building size={20} />, label: 'Cities', path: 'cities' },
    { icon: <MapPin size={20} />, label: 'Zones', path: 'zones' },
    { icon: <CreditCard size={20} />, label: 'Currencies', path: 'currencies' },
    { icon: <Languages size={20} />, label: 'Languages', path: 'languages' },
    { icon: <FileJson size={20} />, label: 'Static Pages', path: 'static-pages' },
  ];

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (user.user_type !== 'admin') {
      navigate('/');
      return;
    }

    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchUsers(),
        fetchProperties(),
        fetchBookings(),
        fetchInquiries()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch counts
      const [usersCount, propertiesCount, bookingsCount, inquiriesCount, notificationsData] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      // Fetch pending seller approvals
      const { count: pendingApprovals } = await supabase
        .from('seller_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      setStats({
        totalUsers: usersCount.count || 0,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalInquiries: inquiriesCount.count || 0,
        pendingSellerApprovals: pendingApprovals || 0,
        recentActivity: [],
        notifications: notificationsData.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
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

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:users!properties_owner_id_fkey (
            first_name,
            last_name,
            custom_id,
            agent_license_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            custom_id
          ),
          users!bookings_user_id_fkey (
            first_name,
            last_name,
            custom_id
          ),
          agent:users!bookings_agent_id_fkey (
            first_name,
            last_name,
            custom_id,
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

  const fetchInquiries = async () => {
    try {
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEdit = (item: any, type: 'user' | 'property' | 'booking' | 'inquiry') => {
    setEditingItem(item);
    setEditingType(type);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string, type: 'user' | 'property' | 'booking' | 'inquiry') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from(type === 'user' ? 'users' : `${type}s`).delete().eq('id', id);
      
      if (error) throw error;
      
      // Refresh data
      switch (type) {
        case 'user':
          fetchUsers();
          break;
        case 'property':
          fetchProperties();
          break;
        case 'booking':
          fetchBookings();
          break;
        case 'inquiry':
          fetchInquiries();
          break;
      }
      
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      new: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      responded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 text-sm bg-green-500 text-white rounded">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Recent Notifications
          </h3>
        </div>
        <div className="p-6">
          {stats.notifications.length > 0 ? (
            <div className="space-y-4">
              {stats.notifications.map((notification, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsersTable = () => {
    const filteredUsers = users.filter(user => {
      const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.custom_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || user.user_type === filterType;
      return matchesSearch && matchesFilter;
    });

    const paginatedUsers = filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Users Management</h3>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Users
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-4 flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm">entries</span>
            </div>
            
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                Excel
              </button>
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                CSV
              </button>
              <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center">
                <Download size={14} className="mr-1" />
                Print
              </button>
            </div>

            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((currentPage - 1) * itemsPerPage) + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.custom_id}</div>
                      {user.agent_license_number && (
                        <div className="text-sm text-purple-600 font-medium">
                          License: {user.agent_license_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-gray-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user, 'user')}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-1 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, 'user')}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {renderPagination(filteredUsers.length)}
      </div>
    );
  };

  const renderPropertiesTable = () => {
    const filteredProperties = properties.filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.custom_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || property.listing_type === filterType;
      return matchesSearch && matchesFilter;
    });

    const paginatedProperties = filteredProperties.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Properties Management</h3>
            <button
              onClick={() => setShowAddPropertyModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Properties
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-4 flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm">entries</span>
            </div>
            
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                Excel
              </button>
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                CSV
              </button>
              <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center">
                <Download size={14} className="mr-1" />
                Print
              </button>
            </div>

            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProperties.map((property, index) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((currentPage - 1) * itemsPerPage) + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.custom_id}</div>
                      <div className="text-sm text-gray-500">{property.city} - {property.property_type}</div>
                      <div className="text-sm text-gray-500">
                        {property.listing_type === 'SALE' 
                          ? `₹${property.price?.toLocaleString()}`
                          : `₹${property.monthly_rent?.toLocaleString()}/month`
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Home size={20} className="text-gray-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(property.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(property, 'property')}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-1 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id, 'property')}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {renderPagination(filteredProperties.length)}
      </div>
    );
  };

  const renderBookingsTable = () => {
    const filteredBookings = bookings.filter(booking => {
      const matchesSearch = booking.properties?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.users?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.agent?.first_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || booking.status === filterType;
      return matchesSearch && matchesFilter;
    });

    const paginatedBookings = filteredBookings.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bookings Management</h3>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-4 flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm">entries</span>
            </div>
            
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                Excel
              </button>
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                CSV
              </button>
              <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center">
                <Download size={14} className="mr-1" />
                Print
              </button>
            </div>

            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBookings.map((booking, index) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((currentPage - 1) * itemsPerPage) + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.properties?.title}</div>
                      <div className="text-sm text-gray-500">
                        Customer: {booking.users?.first_name} {booking.users?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Date: {new Date(booking.booking_date).toLocaleDateString()}
                      </div>
                      {booking.agent && (
                        <div className="text-sm text-purple-600">
                          Agent: {booking.agent.first_name} {booking.agent.last_name} ({booking.agent.agent_license_number})
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Calendar size={20} className="text-gray-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(booking, 'booking')}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-1 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id, 'booking')}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {renderPagination(filteredBookings.length)}
      </div>
    );
  };

  const renderInquiriesTable = () => {
    const filteredInquiries = inquiries.filter(inquiry => {
      const matchesSearch = inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           inquiry.properties?.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || inquiry.status === filterType;
      return matchesSearch && matchesFilter;
    });

    const paginatedInquiries = filteredInquiries.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Inquiries Management</h3>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-4 flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm">entries</span>
            </div>
            
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                Excel
              </button>
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                CSV
              </button>
              <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center">
                <Download size={14} className="mr-1" />
                Print
              </button>
            </div>

            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInquiries.map((inquiry, index) => (
                <tr key={inquiry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((currentPage - 1) * itemsPerPage) + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{inquiry.name}</div>
                      <div className="text-sm text-gray-500">{inquiry.email}</div>
                      <div className="text-sm text-gray-500">Property: {inquiry.properties?.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        Message: {inquiry.message}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <MessageSquare size={20} className="text-gray-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(inquiry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(inquiry, 'inquiry')}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-1 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(inquiry.id, 'inquiry')}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {renderPagination(filteredInquiries.length)}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            navigate('/');
          }}
          userType="buyer"
        />
      </div>
    );
  }

  if (user.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/HomeandOwn-Logo-white.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lYW5kT3duLUxvZ28td2hpdGUucG5nIiwiaWF0IjoxNzQ1MTM1MjIzLCJleHAiOjE3OTY5NzUyMjN9.UHJ1y1O95ZdO26aduzYKkFSlWOw0_PtMpNajPL8Lj1M"
              alt="Home & Own"
              className="h-8 w-auto mr-4"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-white" />
              {stats.notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-blue-800 text-white min-h-screen transition-all duration-300 overflow-hidden`}>
          <nav className="p-4">
            {/* Dashboard */}
            <div className="mb-2">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setCurrentPage(1);
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-300 hover:bg-blue-700'
                }`}
              >
                <TrendingUp size={20} className="mr-3" />
                Dashboard
              </button>
            </div>

            {/* Menu Items */}
            {menuItems.slice(1).map((item, index) => (
              <div key={index} className="mb-1">
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                        expandedItems.includes(item.path) ? 'bg-blue-700' : 'text-gray-300 hover:bg-blue-700'
                      }`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3 text-sm">{item.label}</span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform ${expandedItems.includes(item.path) ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    <div className={`ml-4 border-l border-blue-600 overflow-hidden transition-all duration-200 ${
                      expandedItems.includes(item.path) ? 'max-h-[500px]' : 'max-h-0'
                    }`}>
                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => {
                            if (subItem.path === 'users') {
                              setActiveTab('users');
                            } else if (subItem.path === 'properties') {
                              setActiveTab('properties');
                            } else if (subItem.path === 'bookings') {
                              setActiveTab('bookings');
                            } else if (subItem.path === 'inquiries') {
                              setActiveTab('inquiries');
                            }
                            setCurrentPage(1);
                            setSearchTerm('');
                            setFilterType('all');
                          }}
                          className={`w-full flex items-center px-4 py-2 text-left text-sm transition-colors ${
                            (subItem.path === 'users' && activeTab === 'users') ||
                            (subItem.path === 'properties' && activeTab === 'properties') ||
                            (subItem.path === 'bookings' && activeTab === 'bookings') ||
                            (subItem.path === 'inquiries' && activeTab === 'inquiries')
                              ? 'bg-green-500 text-white' 
                              : 'text-gray-300 hover:bg-blue-700'
                          }`}
                        >
                          {subItem.icon}
                          <span className="ml-3">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab(item.path);
                      setCurrentPage(1);
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === item.path 
                        ? 'bg-green-500 text-white' 
                        : 'text-gray-300 hover:bg-blue-700'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3 text-sm">{item.label}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Home size={16} className="mr-2" />
              <span>Home Page</span>
              <ChevronRight size={16} className="mx-2" />
              <span className="text-gray-800 capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'users' && renderUsersTable()}
              {activeTab === 'properties' && renderPropertiesTable()}
              {activeTab === 'bookings' && renderBookingsTable()}
              {activeTab === 'inquiries' && renderInquiriesTable()}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-blue-800 text-white text-center py-4">
        <p>© Home & Own 2025. All Rights Reserved</p>
      </footer>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={fetchUsers}
      />

      <AddPropertyModal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onPropertyAdded={fetchProperties}
      />
    </div>
  );
};

export default AdminDashboard;