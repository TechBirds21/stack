import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu,
  Bell,
  User,
  Search,
  Download,
  FileText,
  Printer,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  HelpCircle,
  FileImage,
  Shield,
  Globe,
  Wallet,
  Building2,
  Map,
  Languages,
  BarChart3,
  LogOut,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AddUserModal from '@/components/admin/AddUserModal';
import AddPropertyModal from '@/components/admin/AddPropertyModal';
import EditUserModal from '@/components/admin/EditUserModal';
import NotificationPanel from '@/components/admin/NotificationPanel';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  pendingApprovals: number;
  notifications: any[];
}

interface User {
  id: string;
  custom_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: string;
  status: string;
  verification_status: string;
  agent_license_number: string;
  created_at: string;
}

interface Property {
  id: string;
  custom_id: string;
  title: string;
  property_type: string;
  city: string;
  price: number;
  monthly_rent: number;
  listing_type: string;
  status: string;
  featured: boolean;
  verified: boolean;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    custom_id: string;
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
  agent: {
    first_name: string;
    last_name: string;
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
  
  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Data state
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingApprovals: 0,
    notifications: []
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUserType, setFilterUserType] = useState('all');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchProperties(),
        fetchBookings(),
        fetchInquiries(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersCount, propertiesCount, bookingsCount, inquiriesCount, approvalsCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
      ]);

      setStats(prev => ({
        ...prev,
        totalUsers: usersCount.count || 0,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalInquiries: inquiriesCount.count || 0,
        pendingApprovals: approvalsCount.count || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const fetchNotifications = async () => {
    try {
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

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

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      responded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: 'dashboard'
    },
    {
      id: 'manage-admin',
      label: 'Manage Admin',
      icon: Shield,
      children: [
        { id: 'admin-users', label: 'Admin Users', path: 'admin-users' },
        { id: 'roles', label: 'Roles & Privileges', path: 'roles' }
      ]
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: Users,
      children: [
        { id: 'users', label: 'Users', path: 'users' },
        { id: 'agents', label: 'Agents', path: 'agents' }
      ]
    },
    {
      id: 'request-tour',
      label: 'Request Tour',
      icon: Calendar,
      children: [
        { id: 'bookings', label: 'Bookings', path: 'bookings' }
      ]
    },
    {
      id: 'listing-management',
      label: 'Listing Management',
      icon: Building2,
      children: [
        { id: 'properties', label: 'Properties', path: 'properties' },
        { id: 'inquiries', label: 'Inquiries', path: 'inquiries' }
      ]
    },
    {
      id: 'credentials',
      label: 'Credentials',
      icon: Shield,
      children: [
        { id: 'api-credentials', label: 'API Credentials', path: 'api-credentials' },
        { id: 'payment-gateways', label: 'Payment Gateways', path: 'payment-gateways' }
      ]
    },
    {
      id: 'site-management',
      label: 'Site Management',
      icon: Settings,
      children: [
        { id: 'global-settings', label: 'Global Settings', path: 'global-settings' },
        { id: 'social-media', label: 'Social Media Links', path: 'social-media' }
      ]
    },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: 'reports' },
    { id: 'transactions', label: 'Transactions', icon: Wallet, path: 'transactions' },
    { id: 'countries', label: 'Countries', icon: Globe, path: 'countries' },
    { id: 'states', label: 'States', icon: Map, path: 'states' },
    { id: 'cities', label: 'Cities', icon: Building2, path: 'cities' },
    { id: 'currencies', label: 'Currencies', icon: Wallet, path: 'currencies' },
    { id: 'languages', label: 'Languages', icon: Languages, path: 'languages' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
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

        <div className="bg-white rounded-lg shadow p-6">
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          </div>
          <div className="p-6">
            {stats.notifications.length > 0 ? (
              <div className="space-y-4">
                {stats.notifications.slice(0, 5).map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
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

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-900">Add New User</span>
                </div>
                <span className="text-blue-600">→</span>
              </button>
              
              <button
                onClick={() => setShowAddPropertyModal(true)}
                className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-900">Add New Property</span>
                </div>
                <span className="text-green-600">→</span>
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-900">Manage Users</span>
                </div>
                <span className="text-purple-600">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = (data: any[], columns: any[], title: string, onAdd?: () => void) => {
    // Apply filters
    let filteredData = data.filter(item => {
      const matchesSearch = Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      let matchesStatusFilter = true;
      if (filterStatus !== 'all') {
        matchesStatusFilter = item.status === filterStatus || item.verification_status === filterStatus;
      }
      
      let matchesUserTypeFilter = true;
      if (filterUserType !== 'all' && item.user_type) {
        matchesUserTypeFilter = item.user_type === filterUserType;
      }
      
      return matchesSearch && matchesStatusFilter && matchesUserTypeFilter;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="bg-[#3B5998] text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchAllData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add {title.slice(0, -1)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 ml-2">entries</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => exportToCSV(filteredData, title.toLowerCase())}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  Excel
                </button>
                <button
                  onClick={() => exportToCSV(filteredData, title.toLowerCase())}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center"
                >
                  <Printer size={14} className="mr-1" />
                  Print
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                {title === 'Users' && (
                  <select
                    value={filterUserType}
                    onChange={(e) => {
                      setFilterUserType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {title === 'Users' && (
                        <button 
                          onClick={() => handleEditUser(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => title === 'Users' ? handleDeleteUser(item.id) : handleDeleteProperty(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === page
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      
      case 'users':
        const userColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'user_type', header: 'Type', render: (user: User) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.user_type === 'admin' ? 'bg-red-100 text-red-800' :
              user.user_type === 'agent' ? 'bg-purple-100 text-purple-800' :
              user.user_type === 'seller' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {user.user_type}
            </span>
          )},
          { key: 'agent_license_number', header: 'License', render: (user: User) => user.agent_license_number || 'N/A' },
          { key: 'status', header: 'Status', render: (user: User) => getStatusBadge(user.status) },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return renderTable(users, userColumns, 'Users', () => setShowAddUserModal(true));
      
      case 'agents':
        const agentUsers = users.filter(user => user.user_type === 'agent');
        const agentColumns = [
          { key: 'custom_id', header: 'ID' },
          { key: 'first_name', header: 'Name', render: (user: User) => `${user.first_name} ${user.last_name}` },
          { key: 'email', header: 'Email' },
          { key: 'phone_number', header: 'Phone' },
          { key: 'agent_license_number', header: 'License Number', render: (user: User) => user.agent_license_number || 'Pending' },
          { key: 'status', header: 'Status', render: (user: User) => getStatusBadge(user.status) },
          { key: 'verification_status', header: 'Verification', render: (user: User) => getStatusBadge(user.verification_status) }
        ];
        return renderTable(agentUsers, agentColumns, 'Agents');
      
      case 'properties':
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
            `${property.users?.first_name} ${property.users?.last_name} (${property.users?.custom_id})`
          },
          { key: 'status', header: 'Status', render: (property: Property) => getStatusBadge(property.status) }
        ];
        return renderTable(properties, propertyColumns, 'Properties', () => setShowAddPropertyModal(true));
      
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
        return renderTable(bookings, bookingColumns, 'Bookings');
      
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
        return renderTable(inquiries, inquiryColumns, 'Inquiries');
      
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
      {/* Sidebar */}
      <div className={`bg-[#3B5998] text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded">
              <Home className="h-6 w-6 text-[#3B5998]" />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-lg font-bold">HOME & OWN</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-blue-700 transition-colors ${
                      expandedMenus.includes(item.id) ? 'bg-blue-700' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon size={20} />
                      {!sidebarCollapsed && (
                        <span className="ml-3 text-sm">{item.label}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      expandedMenus.includes(item.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )
                    )}
                  </button>
                  {expandedMenus.includes(item.id) && !sidebarCollapsed && (
                    <div className="ml-4 border-l border-blue-600">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setActiveTab(child.path)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            activeTab === child.path
                              ? 'bg-green-500 text-white'
                              : 'text-gray-300 hover:bg-blue-700'
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab(item.path)}
                  className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                    activeTab === item.path
                      ? 'bg-green-500 text-white'
                      : 'text-gray-300 hover:bg-blue-700'
                  }`}
                >
                  <item.icon size={20} />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#3B5998] text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-blue-700 rounded"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationPanel />
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-[#3B5998]" />
              </div>
              <span className="text-sm">{user?.first_name} {user?.last_name}</span>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-blue-700 rounded"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-[#3B5998] text-white text-center py-4">
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
    </div>
  );
};

export default AdminDashboard;