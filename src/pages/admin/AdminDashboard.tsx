import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Building,
  DollarSign,
  BarChart3,
  Shield,
  Phone,
  Mail,
  MapPin,
  Star,
  Image as ImageIcon,
  X,
  Upload,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import { formatIndianCurrency } from '@/utils/currency';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: string;
  status: string;
  verification_status: string;
  date_of_birth: string;
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
  listing_type: string;
  furnishing_status: string;
  created_at: string;
  users?: User;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string;
  created_at: string;
  agent_id?: string;
  properties: Property;
  users: User;
  agent?: User;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  properties: Property;
  users?: User;
}

interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalSellers: number;
  totalBuyers: number;
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  monthlyEarnings: number;
  totalCommissions: number;
  avgCommission: number;
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAgents: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    monthlyEarnings: 0,
    totalCommissions: 0,
    avgCommission: 0
  });

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Filter states
  const [userFilter, setUserFilter] = useState({ search: '', type: '', status: '' });
  const [propertyFilter, setPropertyFilter] = useState({ search: '', type: '', status: '', listing: '' });
  const [bookingFilter, setBookingFilter] = useState({ search: '', status: '' });
  const [inquiryFilter, setInquiryFilter] = useState({ search: '', status: '' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: 'buyer',
    status: 'active',
    verification_status: 'pending',
    date_of_birth: '',
    password: ''
  });

  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    price: '',
    monthly_rent: '',
    security_deposit: '',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    listing_type: 'SALE',
    furnishing_status: 'Unfurnished',
    owner_id: '',
    status: 'active',
    amenities: [] as string[],
    images: [] as string[]
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newImage, setNewImage] = useState('');

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
        fetchUsers(),
        fetchProperties(),
        fetchBookings(),
        fetchInquiries(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
            id,
            first_name,
            last_name,
            email,
            phone_number,
            user_type
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
            id,
            title,
            address,
            city,
            price,
            monthly_rent,
            listing_type,
            owner_id,
            users:owner_id (
              id,
              first_name,
              last_name,
              email,
              phone_number,
              user_type
            )
          ),
          users (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            user_type
          ),
          agent:agent_id (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            user_type
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
            id,
            title,
            address,
            city,
            price,
            monthly_rent,
            listing_type,
            owner_id,
            users:owner_id (
              id,
              first_name,
              last_name,
              email,
              phone_number,
              user_type
            )
          ),
          users (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersCount, propertiesCount, bookingsCount, inquiriesCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true })
      ]);

      const agentsCount = users.filter(u => u.user_type === 'agent').length;
      const sellersCount = users.filter(u => u.user_type === 'seller').length;
      const buyersCount = users.filter(u => u.user_type === 'buyer').length;

      setStats({
        totalUsers: usersCount.count || 0,
        totalAgents: agentsCount,
        totalSellers: sellersCount,
        totalBuyers: buyersCount,
        totalProperties: propertiesCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalInquiries: inquiriesCount.count || 0,
        monthlyEarnings: 125000, // Mock data
        totalCommissions: 45000, // Mock data
        avgCommission: 2500 // Mock data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            email: userForm.email,
            first_name: userForm.first_name,
            last_name: userForm.last_name,
            phone_number: userForm.phone_number,
            user_type: userForm.user_type,
            status: userForm.status,
            verification_status: userForm.verification_status,
            date_of_birth: userForm.date_of_birth
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .insert({
            email: userForm.email,
            first_name: userForm.first_name,
            last_name: userForm.last_name,
            phone_number: userForm.phone_number,
            user_type: userForm.user_type,
            status: userForm.status,
            verification_status: userForm.verification_status,
            date_of_birth: userForm.date_of_birth
          });

        if (error) throw error;
      }

      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      fetchUsers();
      alert(editingUser ? 'User updated successfully!' : 'User created successfully!');
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    }
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const propertyData = {
        title: propertyForm.title,
        description: propertyForm.description,
        price: propertyForm.price ? parseFloat(propertyForm.price) : null,
        monthly_rent: propertyForm.monthly_rent ? parseFloat(propertyForm.monthly_rent) : null,
        security_deposit: propertyForm.security_deposit ? parseFloat(propertyForm.security_deposit) : null,
        property_type: propertyForm.property_type,
        bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : null,
        bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : null,
        area_sqft: propertyForm.area_sqft ? parseFloat(propertyForm.area_sqft) : null,
        address: propertyForm.address,
        city: propertyForm.city,
        state: propertyForm.state,
        zip_code: propertyForm.zip_code,
        listing_type: propertyForm.listing_type,
        furnishing_status: propertyForm.furnishing_status,
        owner_id: propertyForm.owner_id,
        status: propertyForm.status,
        amenities: propertyForm.amenities,
        images: propertyForm.images
      };

      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert(propertyData);

        if (error) throw error;
      }

      setShowPropertyModal(false);
      setEditingProperty(null);
      resetPropertyForm();
      fetchProperties();
      alert(editingProperty ? 'Property updated successfully!' : 'Property created successfully!');
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error saving property. Please try again.');
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
      fetchUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
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
      fetchProperties();
      alert('Property deleted successfully!');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error deleting property. Please try again.');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      user_type: 'buyer',
      status: 'active',
      verification_status: 'pending',
      date_of_birth: '',
      password: ''
    });
  };

  const resetPropertyForm = () => {
    setPropertyForm({
      title: '',
      description: '',
      price: '',
      monthly_rent: '',
      security_deposit: '',
      property_type: 'apartment',
      bedrooms: '',
      bathrooms: '',
      area_sqft: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      listing_type: 'SALE',
      furnishing_status: 'Unfurnished',
      owner_id: '',
      status: 'active',
      amenities: [],
      images: []
    });
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number || '',
      user_type: user.user_type,
      status: user.status,
      verification_status: user.verification_status,
      date_of_birth: user.date_of_birth || '',
      password: ''
    });
    setShowUserModal(true);
  };

  const openEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyForm({
      title: property.title,
      description: property.description,
      price: property.price?.toString() || '',
      monthly_rent: property.monthly_rent?.toString() || '',
      security_deposit: property.security_deposit?.toString() || '',
      property_type: property.property_type,
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      area_sqft: property.area_sqft?.toString() || '',
      address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      listing_type: property.listing_type,
      furnishing_status: property.furnishing_status || 'Unfurnished',
      owner_id: property.owner_id,
      status: property.status,
      amenities: property.amenities || [],
      images: property.images || []
    });
    setShowPropertyModal(true);
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !propertyForm.amenities.includes(newAmenity.trim())) {
      setPropertyForm({
        ...propertyForm,
        amenities: [...propertyForm.amenities, newAmenity.trim()]
      });
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setPropertyForm({
      ...propertyForm,
      amenities: propertyForm.amenities.filter((_, i) => i !== index)
    });
  };

  const addImage = () => {
    if (newImage.trim() && !propertyForm.images.includes(newImage.trim())) {
      setPropertyForm({
        ...propertyForm,
        images: [...propertyForm.images, newImage.trim()]
      });
      setNewImage('');
    }
  };

  const removeImage = (index: number) => {
    setPropertyForm({
      ...propertyForm,
      images: propertyForm.images.filter((_, i) => i !== index)
    });
  };

  const getStatusBadge = (status: string, type: 'user' | 'property' | 'booking' | 'inquiry' = 'user') => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      new: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUserTypeBadge = (type: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      agent: 'bg-purple-100 text-purple-800',
      seller: 'bg-green-100 text-green-800',
      buyer: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    return (
      (userFilter.search === '' || 
       user.first_name.toLowerCase().includes(userFilter.search.toLowerCase()) ||
       user.last_name.toLowerCase().includes(userFilter.search.toLowerCase()) ||
       user.email.toLowerCase().includes(userFilter.search.toLowerCase())) &&
      (userFilter.type === '' || user.user_type === userFilter.type) &&
      (userFilter.status === '' || user.status === userFilter.status)
    );
  });

  const filteredProperties = properties.filter(property => {
    return (
      (propertyFilter.search === '' || 
       property.title.toLowerCase().includes(propertyFilter.search.toLowerCase()) ||
       property.city.toLowerCase().includes(propertyFilter.search.toLowerCase())) &&
      (propertyFilter.type === '' || property.property_type === propertyFilter.type) &&
      (propertyFilter.status === '' || property.status === propertyFilter.status) &&
      (propertyFilter.listing === '' || property.listing_type === propertyFilter.listing)
    );
  });

  const filteredBookings = bookings.filter(booking => {
    return (
      (bookingFilter.search === '' || 
       booking.properties?.title.toLowerCase().includes(bookingFilter.search.toLowerCase()) ||
       booking.users?.first_name.toLowerCase().includes(bookingFilter.search.toLowerCase())) &&
      (bookingFilter.status === '' || booking.status === bookingFilter.status)
    );
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    return (
      (inquiryFilter.search === '' || 
       inquiry.properties?.title.toLowerCase().includes(inquiryFilter.search.toLowerCase()) ||
       inquiry.name.toLowerCase().includes(inquiryFilter.search.toLowerCase())) &&
      (inquiryFilter.status === '' || inquiry.status === inquiryFilter.status)
    );
  });

  // Pagination logic
  const paginate = (items: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const totalPages = (items: any[]) => Math.ceil(items.length / itemsPerPage);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E40AF] text-white min-h-screen">
        <div className="p-6">
          <img
            src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/HomeandOwn-Logo-white.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lYW5kT3duLUxvZ28td2hpdGUucG5nIiwiaWF0IjoxNzQ1MTM1MjIzLCJleHAiOjE3OTY5NzUyMjN9.UHJ1y1O95ZdO26aduzYKkFSlWOw0_PtMpNajPL8Lj1M"
            alt="Home & Own"
            className="h-10 w-auto mb-6"
          />
        </div>
        
        <nav className="px-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <BarChart3 size={20} className="mr-3" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'users' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <Users size={20} className="mr-3" />
                User Management
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.totalUsers}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('agents')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'agents' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <Shield size={20} className="mr-3" />
                Agent Management
                <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.totalAgents}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('properties')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'properties' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <Home size={20} className="mr-3" />
                Property Management
                <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.totalProperties}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'bookings' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <Calendar size={20} className="mr-3" />
                Booking Management
                <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.totalBookings}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'inquiries' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <MessageSquare size={20} className="mr-3" />
                Inquiry Management
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.totalInquiries}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'earnings' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <DollarSign size={20} className="mr-3" />
                Earnings & Reports
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'settings' ? 'bg-[#22C55E] text-white' : 'text-gray-300 hover:bg-[#1E3A8A]'
                }`}
              >
                <Settings size={20} className="mr-3" />
                Settings
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab === 'dashboard' ? 'Admin Dashboard' : `${activeTab} Management`}
              </h1>
              <button
                onClick={fetchAllData}
                className="ml-4 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.first_name} {user.last_name}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut size={20} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
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
                          <div className="flex space-x-2 mt-1">
                            <span className="text-xs text-blue-600">Agents: {stats.totalAgents}</span>
                            <span className="text-xs text-green-600">Sellers: {stats.totalSellers}</span>
                            <span className="text-xs text-purple-600">Buyers: {stats.totalBuyers}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Home className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Properties</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                          <p className="text-xs text-green-600">Active Listings</p>
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
                          <p className="text-xs text-yellow-600">Tour Requests</p>
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
                          <p className="text-xs text-purple-600">Property Interest</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                          <p className="text-2xl font-bold text-green-600">{formatIndianCurrency(stats.monthlyEarnings)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                          <p className="text-2xl font-bold text-blue-600">{formatIndianCurrency(stats.totalCommissions)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Avg Commission</p>
                          <p className="text-2xl font-bold text-purple-600">{formatIndianCurrency(stats.avgCommission)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {users.slice(0, 5).map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {user.first_name[0]}{user.last_name[0]}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getUserTypeBadge(user.user_type)}
                                {getStatusBadge(user.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Properties</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {properties.slice(0, 5).map((property) => (
                            <div key={property.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                  {property.images && property.images.length > 0 ? (
                                    <img
                                      src={property.images[0]}
                                      alt={property.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Home size={16} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {property.title.length > 30 ? `${property.title.substring(0, 30)}...` : property.title}
                                  </p>
                                  <p className="text-xs text-gray-500">{property.city}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-[#90C641]">
                                  {property.listing_type === 'SALE' 
                                    ? formatIndianCurrency(property.price)
                                    : `${formatIndianCurrency(property.monthly_rent)}/mo`
                                  }
                                </p>
                                {getStatusBadge(property.status, 'property')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {/* Filters and Add Button */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userFilter.search}
                            onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                          />
                        </div>
                        <select
                          value={userFilter.type}
                          onChange={(e) => setUserFilter({ ...userFilter, type: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          <option value="admin">Admin</option>
                          <option value="agent">Agent</option>
                          <option value="seller">Seller</option>
                          <option value="buyer">Buyer</option>
                        </select>
                        <select
                          value={userFilter.status}
                          onChange={(e) => setUserFilter({ ...userFilter, status: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          resetUserForm();
                          setEditingUser(null);
                          setShowUserModal(true);
                        }}
                        className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] flex items-center"
                      >
                        <Plus size={20} className="mr-2" />
                        Add User
                      </button>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
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
                          {paginate(filteredUsers).map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-[#90C641] flex items-center justify-center">
                                      <span className="text-white font-semibold">
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
                                <div className="text-sm text-gray-900">{user.phone_number || 'N/A'}</div>
                                <div className="text-sm text-gray-500">
                                  {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getUserTypeBadge(user.user_type)}
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
                                  <button
                                    onClick={() => openEditUser(user)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
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
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages(filteredUsers), currentPage + 1))}
                          disabled={currentPage === totalPages(filteredUsers)}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                            </span>{' '}
                            of <span className="font-medium">{filteredUsers.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            {Array.from({ length: totalPages(filteredUsers) }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-[#90C641] border-[#90C641] text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages(filteredUsers), currentPage + 1))}
                              disabled={currentPage === totalPages(filteredUsers)}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Agents Tab */}
              {activeTab === 'agents' && (
                <div className="space-y-6">
                  {/* Agent Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Agents</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Verified Agents</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.user_type === 'agent' && u.verification_status === 'verified').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.user_type === 'agent' && u.verification_status === 'pending').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Properties Managed</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {properties.filter(p => p.users?.user_type === 'agent').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agents Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Agent Management</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Agent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Properties
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Inquiries
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.filter(u => u.user_type === 'agent').map((agent) => {
                            const agentProperties = properties.filter(p => p.owner_id === agent.id);
                            const agentInquiries = inquiries.filter(i => 
                              agentProperties.some(p => p.id === i.properties?.id)
                            );
                            
                            return (
                              <tr key={agent.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                          {agent.first_name[0]}{agent.last_name[0]}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {agent.first_name} {agent.last_name}
                                      </div>
                                      <div className="text-sm text-gray-500">{agent.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 flex items-center">
                                    <Phone size={14} className="mr-1" />
                                    {agent.phone_number || 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Mail size={14} className="mr-1" />
                                    {agent.email}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {agentProperties.length} Properties
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Active: {agentProperties.filter(p => p.status === 'active').length}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {agentInquiries.length} Inquiries
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    New: {agentInquiries.filter(i => i.status === 'new').length}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="space-y-1">
                                    {getStatusBadge(agent.status)}
                                    {getStatusBadge(agent.verification_status)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openEditUser(agent)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        // View agent details
                                        alert(`Agent Details:\nName: ${agent.first_name} ${agent.last_name}\nEmail: ${agent.email}\nPhone: ${agent.phone_number}\nProperties: ${agentProperties.length}\nInquiries: ${agentInquiries.length}`);
                                      }}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      <Eye size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Properties Tab */}
              {activeTab === 'properties' && (
                <div className="space-y-6">
                  {/* Filters and Add Button */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            placeholder="Search properties..."
                            value={propertyFilter.search}
                            onChange={(e) => setPropertyFilter({ ...propertyFilter, search: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                          />
                        </div>
                        <select
                          value={propertyFilter.type}
                          onChange={(e) => setPropertyFilter({ ...propertyFilter, type: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="villa">Villa</option>
                          <option value="studio">Studio</option>
                        </select>
                        <select
                          value={propertyFilter.listing}
                          onChange={(e) => setPropertyFilter({ ...propertyFilter, listing: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        >
                          <option value="">All Listings</option>
                          <option value="SALE">For Sale</option>
                          <option value="RENT">For Rent</option>
                        </select>
                        <select
                          value={propertyFilter.status}
                          onChange={(e) => setPropertyFilter({ ...propertyFilter, status: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          resetPropertyForm();
                          setEditingProperty(null);
                          setShowPropertyModal(true);
                        }}
                        className="bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] flex items-center"
                      >
                        <Plus size={20} className="mr-2" />
                        Add Property
                      </button>
                    </div>
                  </div>

                  {/* Properties Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginate(filteredProperties).map((property) => (
                      <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="relative h-48">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Home size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(property.status, 'property')}
                          </div>
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.listing_type === 'SALE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {property.listing_type}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {property.title.length > 50 ? `${property.title.substring(0, 50)}...` : property.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span className="text-sm">{property.city}</span>
                          </div>
                          <div className="text-[#90C641] font-bold text-lg mb-2">
                            {property.listing_type === 'SALE' 
                              ? formatIndianCurrency(property.price)
                              : `${formatIndianCurrency(property.monthly_rent)}/month`
                            }
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                            <span>{property.bedrooms} bed</span>
                            <span>{property.bathrooms} bath</span>
                            <span>{property.area_sqft} sqft</span>
                          </div>
                          {property.users && (
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Owner:</span> {property.users.first_name} {property.users.last_name}
                              <span className="ml-2">{getUserTypeBadge(property.users.user_type)}</span>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditProperty(property)}
                              className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 flex items-center justify-center"
                            >
                              <Edit size={16} className="mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 flex items-center justify-center"
                            >
                              <Trash2 size={16} className="mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Properties Pagination */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, filteredProperties.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredProperties.length}</span> results
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages(filteredProperties), currentPage + 1))}
                          disabled={currentPage === totalPages(filteredProperties)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  {/* Booking Filters */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search bookings..."
                          value={bookingFilter.search}
                          onChange={(e) => setBookingFilter({ ...bookingFilter, search: e.target.value })}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        />
                      </div>
                      <select
                        value={bookingFilter.status}
                        onChange={(e) => setBookingFilter({ ...bookingFilter, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Bookings Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Property
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Agent/Owner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assigned Agent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginate(filteredBookings).map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {booking.properties?.images && booking.properties.images.length > 0 ? (
                                      <img
                                        src={booking.properties.images[0]}
                                        alt={booking.properties.title}
                                        className="h-10 w-10 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <Home size={16} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {booking.properties?.title}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {booking.properties?.city}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.users?.first_name} {booking.users?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.users?.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.users?.phone_number}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.properties?.users?.first_name} {booking.properties?.users?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.properties?.users?.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getUserTypeBadge(booking.properties?.users?.user_type || 'seller')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {booking.agent ? (
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {booking.agent.first_name} {booking.agent.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {booking.agent.email}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {getUserTypeBadge(booking.agent.user_type)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">No agent assigned</span>
                                )}
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
                                {getStatusBadge(booking.status, 'booking')}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {booking.notes || 'No notes'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Inquiries Tab */}
              {activeTab === 'inquiries' && (
                <div className="space-y-6">
                  {/* Inquiry Filters */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search inquiries..."
                          value={inquiryFilter.search}
                          onChange={(e) => setInquiryFilter({ ...inquiryFilter, search: e.target.value })}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        />
                      </div>
                      <select
                        value={inquiryFilter.status}
                        onChange={(e) => setInquiryFilter({ ...inquiryFilter, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="responded">Responded</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Inquiries Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Property
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Inquirer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Agent/Owner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Message
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginate(filteredInquiries).map((inquiry) => (
                            <tr key={inquiry.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {inquiry.properties?.images && inquiry.properties.images.length > 0 ? (
                                      <img
                                        src={inquiry.properties.images[0]}
                                        alt={inquiry.properties.title}
                                        className="h-10 w-10 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <Home size={16} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {inquiry.properties?.title}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {inquiry.properties?.city}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {inquiry.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {inquiry.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {inquiry.phone}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {inquiry.properties?.users?.first_name} {inquiry.properties?.users?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {inquiry.properties?.users?.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getUserTypeBadge(inquiry.properties?.users?.user_type || 'seller')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs">
                                  {inquiry.message.length > 100 
                                    ? `${inquiry.message.substring(0, 100)}...`
                                    : inquiry.message
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(inquiry.status, 'inquiry')}
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
                </div>
              )}

              {/* Earnings Tab */}
              {activeTab === 'earnings' && (
                <div className="space-y-6">
                  {/* Earnings Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-600">{formatIndianCurrency(stats.monthlyEarnings * 12)}</p>
                          <p className="text-xs text-gray-500">This year</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                          <p className="text-2xl font-bold text-blue-600">+12.5%</p>
                          <p className="text-xs text-gray-500">vs last month</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Transactions</p>
                          <p className="text-2xl font-bold text-purple-600">{stats.totalBookings + stats.totalInquiries}</p>
                          <p className="text-xs text-gray-500">This month</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commission Breakdown */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Commission Breakdown</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">Agent Commissions</p>
                            <p className="text-sm text-gray-500">From property sales and rentals</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatIndianCurrency(stats.totalCommissions * 0.6)}</p>
                            <p className="text-xs text-gray-500">60% of total</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">Platform Fees</p>
                            <p className="text-sm text-gray-500">Service charges and listing fees</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{formatIndianCurrency(stats.totalCommissions * 0.3)}</p>
                            <p className="text-xs text-gray-500">30% of total</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <div>
                            <p className="font-medium text-gray-900">Other Revenue</p>
                            <p className="text-sm text-gray-500">Premium listings and ads</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">{formatIndianCurrency(stats.totalCommissions * 0.1)}</p>
                            <p className="text-xs text-gray-500">10% of total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Performing Agents */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Top Performing Agents</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {users.filter(u => u.user_type === 'agent').slice(0, 5).map((agent, index) => {
                          const agentProperties = properties.filter(p => p.owner_id === agent.id);
                          const mockEarnings = (index + 1) * 15000; // Mock earnings
                          
                          return (
                            <div key={agent.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-white font-semibold">
                                    {agent.first_name[0]}{agent.last_name[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {agent.first_name} {agent.last_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {agentProperties.length} properties
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {formatIndianCurrency(mockEarnings)}
                                </p>
                                <p className="text-xs text-gray-500">This month</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">Auto-approve new agents</p>
                          <p className="text-sm text-gray-500">Automatically verify new agent registrations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">Email notifications</p>
                          <p className="text-sm text-gray-500">Send email alerts for new inquiries</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-gray-900">Maintenance mode</p>
                          <p className="text-sm text-gray-500">Temporarily disable public access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
                    <div className="space-y-4">
                      <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
                        Export All Data
                      </button>
                      <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600">
                        Backup Database
                      </button>
                      <button className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600">
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(Text)</span>
                  </label>
                  <input
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(Text)</span>
                  </label>
                  <input
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(Email)</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                  <span className="text-xs text-gray-500 ml-1">(Phone)</span>
                </label>
                <input
                  type="tel"
                  value={userForm.phone_number}
                  onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(Select)</span>
                  </label>
                  <select
                    value={userForm.user_type}
                    onChange={(e) => setUserForm({ ...userForm, user_type: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    required
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(Select)</span>
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Status <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(Select)</span>
                  </label>
                  <select
                    value={userForm.verification_status}
                    onChange={(e) => setUserForm({ ...userForm, verification_status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                    <span className="text-xs text-gray-500 ml-1">(Date)</span>
                  </label>
                  <input
                    type="date"
                    value={userForm.date_of_birth}
                    onChange={(e) => setUserForm({ ...userForm, date_of_birth: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(Password)</span>
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    required={!editingUser}
                    placeholder="Enter password for new user"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35] flex items-center"
                >
                  <Save size={16} className="mr-2" />
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </h2>
                <button
                  onClick={() => setShowPropertyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handlePropertySubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Title <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-1">(Text)</span>
                    </label>
                    <input
                      type="text"
                      value={propertyForm.title}
                      onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-1">(Textarea)</span>
                    </label>
                    <textarea
                      value={propertyForm.description}
                      onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Type <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Select)</span>
                      </label>
                      <select
                        value={propertyForm.property_type}
                        onChange={(e) => setPropertyForm({ ...propertyForm, property_type: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="villa">Villa</option>
                        <option value="studio">Studio</option>
                        <option value="penthouse">Penthouse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Listing Type <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Select)</span>
                      </label>
                      <select
                        value={propertyForm.listing_type}
                        onChange={(e) => setPropertyForm({ ...propertyForm, listing_type: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required
                      >
                        <option value="SALE">For Sale</option>
                        <option value="RENT">For Rent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Select)</span>
                      </label>
                      <select
                        value={propertyForm.status}
                        onChange={(e) => setPropertyForm({ ...propertyForm, status: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {propertyForm.listing_type === 'SALE' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sale Price <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Number)</span>
                      </label>
                      <input
                        type="number"
                        value={propertyForm.price}
                        onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required={propertyForm.listing_type === 'SALE'}
                        placeholder="₹ 5000000"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Rent <span className="text-red-500">*</span>
                          <span className="text-xs text-gray-500 ml-1">(Number)</span>
                        </label>
                        <input
                          type="number"
                          value={propertyForm.monthly_rent}
                          onChange={(e) => setPropertyForm({ ...propertyForm, monthly_rent: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                          required={propertyForm.listing_type === 'RENT'}
                          placeholder="₹ 25000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Security Deposit
                          <span className="text-xs text-gray-500 ml-1">(Number)</span>
                        </label>
                        <input
                          type="number"
                          value={propertyForm.security_deposit}
                          onChange={(e) => setPropertyForm({ ...propertyForm, security_deposit: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                          placeholder="₹ 50000"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                      <span className="text-xs text-gray-500 ml-1">(Number)</span>
                    </label>
                    <input
                      type="number"
                      value={propertyForm.bedrooms}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                      <span className="text-xs text-gray-500 ml-1">(Number)</span>
                    </label>
                    <input
                      type="number"
                      value={propertyForm.bathrooms}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (sqft) <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-1">(Number)</span>
                    </label>
                    <input
                      type="number"
                      value={propertyForm.area_sqft}
                      onChange={(e) => setPropertyForm({ ...propertyForm, area_sqft: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-1">(Text)</span>
                    </label>
                    <input
                      type="text"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Text)</span>
                      </label>
                      <input
                        type="text"
                        value={propertyForm.city}
                        onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Text)</span>
                      </label>
                      <input
                        type="text"
                        value={propertyForm.state}
                        onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Text)</span>
                      </label>
                      <input
                        type="text"
                        value={propertyForm.zip_code}
                        onChange={(e) => setPropertyForm({ ...propertyForm, zip_code: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Owner <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(Select)</span>
                </label>
                <select
                  value={propertyForm.owner_id}
                  onChange={(e) => setPropertyForm({ ...propertyForm, owner_id: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
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

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      placeholder="Add amenity"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addAmenity}
                      className="bg-[#90C641] text-white px-4 py-3 rounded-lg hover:bg-[#7DAF35]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {propertyForm.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="Add image URL"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="bg-[#90C641] text-white px-4 py-3 rounded-lg hover:bg-[#7DAF35]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {propertyForm.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35] flex items-center"
                >
                  <Save size={16} className="mr-2" />
                  {editingProperty ? 'Update Property' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;