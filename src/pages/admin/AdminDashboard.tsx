import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Edit,
  Trash2,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  UserCheck,
  Building,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  RefreshCw,
  Image,
  Star,
  Bed,
  Bath,
  Square as SquareIcon,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import { formatIndianCurrency } from '@/utils/currency';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  totalAgents: number;
  totalSellers: number;
  totalBuyers: number;
  pendingVerifications: number;
  monthlyEarnings: number;
  totalCommissions: number;
  recentActivity: any[];
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: string;
  status: string;
  verification_status: string;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  monthly_rent: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  images: string[];
  amenities: string[];
  owner_id: string;
  status: string;
  featured: boolean;
  verified: boolean;
  listing_type: string;
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    totalAgents: 0,
    totalSellers: 0,
    totalBuyers: 0,
    pendingVerifications: 0,
    monthlyEarnings: 0,
    totalCommissions: 0,
    recentActivity: []
  });
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'property'>('user');

  // Form states
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    user_type: 'buyer',
    password: 'defaultpass123'
  });

  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    price: '',
    monthly_rent: '',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    listing_type: 'SALE',
    owner_id: ''
  });

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (user.user_type !== 'admin') {
      navigate('/');
      return;
    }

    // Set active tab based on URL
    const path = location.pathname;
    if (path.includes('users')) setActiveTab('users');
    else if (path.includes('properties')) setActiveTab('properties');
    else if (path.includes('bookings')) setActiveTab('bookings');
    else if (path.includes('inquiries')) setActiveTab('inquiries');
    else if (path.includes('earnings')) setActiveTab('earnings');
    else if (path.includes('settings')) setActiveTab('settings');
    else setActiveTab('dashboard');

    fetchAllData();
  }, [user, navigate, location]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        usersResult,
        propertiesResult,
        bookingsResult,
        inquiriesResult,
        agentsResult,
        sellersResult,
        buyersResult,
        pendingResult
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'agent'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'seller'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'buyer'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
      ]);

      // Fetch detailed data
      const [
        { data: allUsers },
        { data: allProperties },
        { data: allBookings },
        { data: allInquiries },
        { data: recentActivity }
      ] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('properties').select('*, users(first_name, last_name, email, phone_number)').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, properties(title), users(first_name, last_name, email)').order('created_at', { ascending: false }),
        supabase.from('inquiries').select('*, properties(title)').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, properties(title), users(first_name, last_name)').order('created_at', { ascending: false }).limit(10)
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalProperties: propertiesResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        totalInquiries: inquiriesResult.count || 0,
        totalAgents: agentsResult.count || 0,
        totalSellers: sellersResult.count || 0,
        totalBuyers: buyersResult.count || 0,
        pendingVerifications: pendingResult.count || 0,
        monthlyEarnings: Math.floor(Math.random() * 500000) + 100000,
        totalCommissions: Math.floor(Math.random() * 2000000) + 500000,
        recentActivity: recentActivity || []
      });

      setUsers(allUsers || []);
      setProperties(allProperties || []);
      setBookings(allBookings || []);
      setInquiries(allInquiries || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set mock data for demo
      setStats({
        totalUsers: 156,
        totalProperties: 89,
        totalBookings: 34,
        totalInquiries: 67,
        totalAgents: 23,
        totalSellers: 45,
        totalBuyers: 88,
        pendingVerifications: 12,
        monthlyEarnings: 245000,
        totalCommissions: 1250000,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleUserVerification = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ verification_status: status })
        .eq('id', userId);

      if (error) throw error;

      fetchAllData();
      alert(`User ${status} successfully!`);
    } catch (error) {
      console.error('Error updating user verification:', error);
      alert('Failed to update user verification');
    }
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
      alert('Failed to delete user');
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
      alert('Failed to delete property');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          ...newUser,
          status: 'active',
          verification_status: 'verified'
        }]);

      if (error) throw error;

      setShowAddUserModal(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        user_type: 'buyer',
        password: 'defaultpass123'
      });
      fetchAllData();
      alert('User added successfully!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('properties')
        .insert([{
          ...newProperty,
          price: newProperty.price ? parseFloat(newProperty.price) : null,
          monthly_rent: newProperty.monthly_rent ? parseFloat(newProperty.monthly_rent) : null,
          bedrooms: parseInt(newProperty.bedrooms),
          bathrooms: parseInt(newProperty.bathrooms),
          area_sqft: parseFloat(newProperty.area_sqft),
          status: 'active',
          featured: false,
          verified: true,
          images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'],
          amenities: ['Power Backup', 'Security', 'Parking']
        }]);

      if (error) throw error;

      setShowAddPropertyModal(false);
      setNewProperty({
        title: '',
        description: '',
        price: '',
        monthly_rent: '',
        property_type: 'apartment',
        bedrooms: '',
        bathrooms: '',
        area_sqft: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        listing_type: 'SALE',
        owner_id: ''
      });
      fetchAllData();
      alert('Property added successfully!');
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property');
    }
  };

  const handleEditItem = (item: any, type: 'user' | 'property') => {
    setEditingItem(item);
    setEditType(type);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editType === 'user') {
        const { error } = await supabase
          .from('users')
          .update(editingItem)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .update(editingItem)
          .eq('id', editingItem.id);
        if (error) throw error;
      }

      setShowEditModal(false);
      setEditingItem(null);
      fetchAllData();
      alert(`${editType} updated successfully!`);
    } catch (error) {
      console.error(`Error updating ${editType}:`, error);
      alert(`Failed to update ${editType}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      verified: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Properties</p>
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
              <p className="text-sm font-medium text-gray-600">Bookings</p>
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
              <p className="text-sm font-medium text-gray-600">Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agents</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalAgents}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sellers</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalSellers}</p>
            </div>
            <Building className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Buyers</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalBuyers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Earnings and Commissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Earnings</h3>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{formatIndianCurrency(stats.monthlyEarnings)}</p>
          <p className="text-sm text-gray-600 mt-2">+12% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Commissions</h3>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatIndianCurrency(stats.totalCommissions)}</p>
          <p className="text-sm text-gray-600 mt-2">All time earnings</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Manage Users</span>
          </button>
          
          <button
            onClick={() => setActiveTab('properties')}
            className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Home className="h-6 w-6 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Properties</span>
          </button>
          
          <button
            onClick={() => setActiveTab('earnings')}
            className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <BarChart3 className="h-6 w-6 text-yellow-600 mr-2" />
            <span className="font-medium text-yellow-800">View Reports</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Settings className="h-6 w-6 text-purple-600 mr-2" />
            <span className="font-medium text-purple-800">Settings</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={fetchAllData}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </button>
        </div>
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#90C641] rounded-full mr-3"></div>
                  <span className="text-gray-900">
                    {activity.booking_date ? 'New booking' : 'New inquiry'} received
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="agent">Agents</option>
            </select>
            <button
              onClick={fetchAllData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-[#90C641] flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.user_type === 'admin' ? 'bg-red-100 text-red-800' :
                    user.user_type === 'agent' ? 'bg-purple-100 text-purple-800' :
                    user.user_type === 'seller' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.verification_status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {user.verification_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUserVerification(user.id, 'verified')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleUserVerification(user.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEditItem(user, 'user')}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
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
    </div>
  );

  const renderPropertyManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
        <button
          onClick={() => setShowAddPropertyModal(true)}
          className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add Property
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img
              src={property.images[0] || 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{property.address}, {property.city}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#90C641] font-bold">
                  {property.listing_type === 'SALE' 
                    ? formatIndianCurrency(property.price)
                    : `${formatIndianCurrency(property.monthly_rent)}/month`
                  }
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {property.status}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <Bed size={16} className="mr-1" />
                <span className="mr-3">{property.bedrooms}</span>
                <Bath size={16} className="mr-1" />
                <span className="mr-3">{property.bathrooms}</span>
                <SquareIcon size={16} className="mr-1" />
                <span>{property.area_sqft} sqft</span>
              </div>
              {property.users && (
                <p className="text-sm text-gray-600 mb-3">
                  Owner: {property.users.first_name} {property.users.last_name}
                </p>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditItem(property, 'property')}
                  className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600 flex items-center justify-center"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProperty(property.id)}
                  className="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 flex items-center justify-center"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookingsManagement = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.properties?.title || 'Unknown Property'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : 'Unknown User'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.users?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.booking_time}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(booking.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(booking.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInquiriesManagement = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Inquiries Management</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {inquiry.properties?.title || 'Unknown Property'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{inquiry.name}</div>
                  <div className="text-sm text-gray-500">{inquiry.email}</div>
                  <div className="text-sm text-gray-500">{inquiry.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {inquiry.message}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(inquiry.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Earnings & Reports</h2>
      
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-green-600">{formatIndianCurrency(stats.monthlyEarnings)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+12% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-blue-600">{formatIndianCurrency(stats.totalCommissions)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">All time total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Commission</p>
              <p className="text-2xl font-bold text-purple-600">₹15,250</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-purple-600 mt-2">Per transaction</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Revenue chart will be displayed here</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">User distribution chart will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <img
            src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
            alt="Home & Own"
            className="h-8 w-auto mb-6"
          />
          <div className="text-sm text-gray-600 mb-6">
            Welcome, {user.first_name}
          </div>
        </div>

        <nav className="px-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp size={20} className="mr-3" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users size={20} className="mr-3" />
            Users
            {stats.pendingVerifications > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.pendingVerifications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'properties' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home size={20} className="mr-3" />
            Properties
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'bookings' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar size={20} className="mr-3" />
            Bookings
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'inquiries' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={20} className="mr-3" />
            Inquiries
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'earnings' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={20} className="mr-3" />
            Earnings & Reports
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-[#90C641] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings size={20} className="mr-3" />
            Settings
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'users' && renderUserManagement()}
              {activeTab === 'properties' && renderPropertyManagement()}
              {activeTab === 'bookings' && renderBookingsManagement()}
              {activeTab === 'inquiries' && renderInquiriesManagement()}
              {activeTab === 'earnings' && renderEarnings()}
              {activeTab === 'settings' && (
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">System Settings</h3>
                  <p className="text-gray-600">Settings panel coming soon</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New User</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newUser.phone_number}
                  onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                />
                <select
                  value={newUser.user_type}
                  onChange={(e) => setNewUser({...newUser, user_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="agent">Agent</option>
                </select>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#90C641] text-white py-2 rounded-lg hover:bg-[#7DAF35]"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Property</h3>
                <button
                  onClick={() => setShowAddPropertyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddProperty} className="space-y-4">
                <input
                  type="text"
                  placeholder="Property Title"
                  value={newProperty.title}
                  onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newProperty.description}
                  onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  rows={3}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Price (for sale)"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  />
                  <input
                    type="number"
                    placeholder="Monthly Rent"
                    value={newProperty.monthly_rent}
                    onChange={(e) => setNewProperty({...newProperty, monthly_rent: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={newProperty.property_type}
                    onChange={(e) => setNewProperty({...newProperty, property_type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Bedrooms"
                    value={newProperty.bedrooms}
                    onChange={(e) => setNewProperty({...newProperty, bedrooms: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Bathrooms"
                    value={newProperty.bathrooms}
                    onChange={(e) => setNewProperty({...newProperty, bathrooms: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                </div>
                <input
                  type="number"
                  placeholder="Area (sqft)"
                  value={newProperty.area_sqft}
                  onChange={(e) => setNewProperty({...newProperty, area_sqft: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  required
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newProperty.state}
                    onChange={(e) => setNewProperty({...newProperty, state: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={newProperty.zip_code}
                    onChange={(e) => setNewProperty({...newProperty, zip_code: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newProperty.listing_type}
                    onChange={(e) => setNewProperty({...newProperty, listing_type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>
                  <select
                    value={newProperty.owner_id}
                    onChange={(e) => setNewProperty({...newProperty, owner_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    required
                  >
                    <option value="">Select Owner</option>
                    {users.filter(u => u.user_type === 'seller' || u.user_type === 'agent').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.user_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddPropertyModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#90C641] text-white py-2 rounded-lg hover:bg-[#7DAF35]"
                  >
                    Add Property
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit {editType}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {editType === 'user' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={editingItem.first_name}
                        onChange={(e) => setEditingItem({...editingItem, first_name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={editingItem.last_name}
                        onChange={(e) => setEditingItem({...editingItem, last_name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={editingItem.email}
                      onChange={(e) => setEditingItem({...editingItem, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={editingItem.phone_number || ''}
                      onChange={(e) => setEditingItem({...editingItem, phone_number: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    />
                    <select
                      value={editingItem.user_type}
                      onChange={(e) => setEditingItem({...editingItem, user_type: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="agent">Agent</option>
                    </select>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Property Title"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    />
                    <textarea
                      placeholder="Description"
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Price"
                        value={editingItem.price || ''}
                        onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || null})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                      <input
                        type="number"
                        placeholder="Monthly Rent"
                        value={editingItem.monthly_rent || ''}
                        onChange={(e) => setEditingItem({...editingItem, monthly_rent: parseFloat(e.target.value) || null})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="number"
                        placeholder="Bedrooms"
                        value={editingItem.bedrooms}
                        onChange={(e) => setEditingItem({...editingItem, bedrooms: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                      <input
                        type="number"
                        placeholder="Bathrooms"
                        value={editingItem.bathrooms}
                        onChange={(e) => setEditingItem({...editingItem, bathrooms: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                      <input
                        type="number"
                        placeholder="Area (sqft)"
                        value={editingItem.area_sqft}
                        onChange={(e) => setEditingItem({...editingItem, area_sqft: parseFloat(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={editingItem.address}
                      onChange={(e) => setEditingItem({...editingItem, address: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={editingItem.city}
                        onChange={(e) => setEditingItem({...editingItem, city: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={editingItem.state}
                        onChange={(e) => setEditingItem({...editingItem, state: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                      <input
                        type="text"
                        placeholder="Zip Code"
                        value={editingItem.zip_code}
                        onChange={(e) => setEditingItem({...editingItem, zip_code: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </>
                )}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-[#90C641] text-white py-2 rounded-lg hover:bg-[#7DAF35] flex items-center justify-center"
                  >
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;