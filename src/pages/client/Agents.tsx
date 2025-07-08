import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, MessageCircle, Calendar, Building2, TrendingUp, Users, Home, Eye, BarChart3, DollarSign, Award, Target, Menu, User, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollingBanner from '@/components/ScrollingBanner';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city?: string;
  state?: string;
  experience_years?: number;
  specialization?: string;
  agency_name?: string;
  license_number?: string;
  verification_status: string;
  profile_image?: string;
  rating?: number;
  total_sales?: number;
  languages?: string[];
}

interface AgentDashboardStats {
  totalProperties: number;
  totalInquiries: number;
  totalBookings: number;
  totalEarnings: number;
  monthlyCommission: number;
  portfolioValue: {
    totalSaleValue: number;
    totalRentValue: number;
  };
  performance: {
    conversionRate: number;
    avgDealSize: number;
    responseTime: string;
    customerRating: number;
  };
  recentContacts: any[];
  todayContacts: any[];
}

const Agents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<AgentDashboardStats | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [filters, setFilters] = useState({
    city: '',
    specialization: '',
    experience: '',
  });

  useEffect(() => {
    // Auto-redirect agents to dashboard
    if (user?.user_type === 'agent') {
      fetchAgentDashboard();
    } else {
      fetchAgents();
    }
  }, [user]);

  const fetchAgentDashboard = async () => {
    if (!user || user.user_type !== 'agent') return;

    setLoading(true);
    try {
      // Fetch agent's properties
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      // Fetch inquiries for agent's properties
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select(`
          *,
          properties!inner(owner_id)
        `)
        .eq('properties.owner_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch bookings for agent's properties
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(owner_id),
          users!bookings_user_id_fkey(first_name, last_name, email, phone_number)
        `)
        .eq('properties.owner_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch agent assignments
      const { data: assignments } = await supabase
        .from('agent_inquiry_assignments')
        .select(`
          *,
          inquiries (
            *,
            properties (*)
          )
        `)
        .eq('agent_id', user.id)
        .order('assigned_at', { ascending: false });

      // Calculate earnings based on properties
      const totalSaleValue = properties?.filter(p => p.listing_type === 'SALE').reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const totalRentValue = properties?.filter(p => p.listing_type === 'RENT').reduce((sum, p) => sum + (p.monthly_rent || 0), 0) || 0;
      
      // Commission calculation: 2% on sales, 1 month rent on rentals
      const saleCommission = totalSaleValue * 0.02;
      const rentalCommission = totalRentValue * 1; // 1 month rent
      const totalEarnings = saleCommission + rentalCommission;

      // Get today's contacts
      const today = new Date().toISOString().split('T')[0];
      const todayInquiries = inquiries?.filter(inq => 
        inq.created_at.startsWith(today)
      ) || [];
      
      const todayBookings = bookings?.filter(booking => 
        booking.created_at.startsWith(today)
      ) || [];

      // Calculate performance metrics
      const totalAssignments = assignments?.length || 0;
      const acceptedAssignments = assignments?.filter(a => a.status === 'accepted').length || 0;
      const conversionRate = totalAssignments > 0 ? Math.round((acceptedAssignments / totalAssignments) * 100) : 0;

      const stats: AgentDashboardStats = {
        totalProperties: properties?.length || 0,
        totalInquiries: inquiries?.length || 0,
        totalBookings: bookings?.length || 0,
        totalEarnings: totalEarnings,
        monthlyCommission: totalEarnings / 12, // Average monthly
        portfolioValue: {
          totalSaleValue,
          totalRentValue: totalRentValue * 12 // Annual rent value
        },
        performance: {
          conversionRate: conversionRate,
          avgDealSize: properties?.length ? totalSaleValue / properties.length : 0,
          responseTime: '< 2 hours',
          customerRating: 4.8
        },
        recentContacts: [...(inquiries?.slice(0, 5) || []), ...(bookings?.slice(0, 5) || [])],
        todayContacts: [...todayInquiries, ...todayBookings]
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
      // Mock data for demo
      setDashboardStats({
        totalProperties: 12,
        totalInquiries: 34,
        totalBookings: 18,
        totalEarnings: 450000,
        monthlyCommission: 37500,
        portfolioValue: {
          totalSaleValue: 15000000,
          totalRentValue: 360000
        },
        performance: {
          conversionRate: 15,
          avgDealSize: 1250000,
          responseTime: '< 2 hours',
          customerRating: 4.8
        },
        recentContacts: [],
        todayContacts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('user_type', 'agent')
        .eq('status', 'active')
        .eq('verification_status', 'verified');

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Add mock data for demonstration
      const agentsWithMockData = (data || []).map(agent => ({
        ...agent,
        rating: 4.5 + Math.random() * 0.5,
        total_sales: Math.floor(Math.random() * 50) + 10,
        experience_years: Math.floor(Math.random() * 15) + 2,
        specialization: ['Residential', 'Commercial', 'Luxury', 'Investment'][Math.floor(Math.random() * 4)],
        agency_name: `${agent.first_name} ${agent.last_name} Realty`,
        languages: ['English', 'Hindi', 'Telugu'],
        city: ['Visakhapatnam', 'Hyderabad', 'Bangalore', 'Chennai'][Math.floor(Math.random() * 4)],
        state: 'Andhra Pradesh',
      }));

      // Add some mock agents if no real data
      if (agentsWithMockData.length === 0) {
        const mockAgents = [
          {
            id: '1',
            first_name: 'Vikram',
            last_name: 'Singh',
            email: 'vikram@example.com',
            phone_number: '+91 9876543216',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            experience_years: 8,
            specialization: 'Luxury Properties',
            agency_name: 'Singh Realty',
            license_number: 'REA12345',
            verification_status: 'verified',
            rating: 4.8,
            total_sales: 45,
            languages: ['English', 'Hindi', 'Telugu'],
          },
          {
            id: '2',
            first_name: 'Meera',
            last_name: 'Reddy',
            email: 'meera@example.com',
            phone_number: '+91 9876543217',
            city: 'Hyderabad',
            state: 'Telangana',
            experience_years: 6,
            specialization: 'Residential',
            agency_name: 'Reddy Properties',
            license_number: 'REA67890',
            verification_status: 'verified',
            rating: 4.6,
            total_sales: 32,
            languages: ['English', 'Telugu', 'Tamil'],
          },
          {
            id: '3',
            first_name: 'Arjun',
            last_name: 'Nair',
            email: 'arjun@example.com',
            phone_number: '+91 9876543218',
            city: 'Bangalore',
            state: 'Karnataka',
            experience_years: 10,
            specialization: 'Commercial',
            agency_name: 'Nair Estates',
            license_number: 'REA11111',
            verification_status: 'verified',
            rating: 4.9,
            total_sales: 67,
            languages: ['English', 'Hindi', 'Kannada'],
          },
        ];
        setAgents(mockAgents);
      } else {
        setAgents(agentsWithMockData);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to mock data
      const mockAgents = [
        {
          id: '1',
          first_name: 'Vikram',
          last_name: 'Singh',
          email: 'vikram@example.com',
          phone_number: '+91 9876543216',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          experience_years: 8,
          specialization: 'Luxury Properties',
          agency_name: 'Singh Realty',
          license_number: 'REA12345',
          verification_status: 'verified',
          rating: 4.8,
          total_sales: 45,
          languages: ['English', 'Hindi', 'Telugu'],
        },
        {
          id: '2',
          first_name: 'Meera',
          last_name: 'Reddy',
          email: 'meera@example.com',
          phone_number: '+91 9876543217',
          city: 'Hyderabad',
          state: 'Telangana',
          experience_years: 6,
          specialization: 'Residential',
          agency_name: 'Reddy Properties',
          license_number: 'REA67890',
          verification_status: 'verified',
          rating: 4.6,
          total_sales: 32,
          languages: ['English', 'Telugu', 'Tamil'],
        },
        {
          id: '3',
          first_name: 'Arjun',
          last_name: 'Nair',
          email: 'arjun@example.com',
          phone_number: '+91 9876543218',
          city: 'Bangalore',
          state: 'Karnataka',
          experience_years: 10,
          specialization: 'Commercial',
          agency_name: 'Nair Estates',
          license_number: 'REA11111',
          verification_status: 'verified',
          rating: 4.9,
          total_sales: 67,
          languages: ['English', 'Hindi', 'Kannada'],
        },
      ];
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const handleContactAgent = (agent: Agent) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAgent(agent);
    setShowContactModal(true);
  };

  const handleSignOut = async () => {
    const { signOut } = useAuth();
    await signOut();
    navigate('/');
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  // Agent Dashboard View
  if (user?.user_type === 'agent') {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className={`bg-[#3B5998] text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 no-print`}>
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
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-300 hover:bg-blue-700'
              }`}
            >
              <BarChart3 size={20} />
              {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
            </button>

            {/* Properties Menu */}
            <div>
              <button
                onClick={() => toggleMenu('properties')}
                className={`w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-blue-700 transition-colors ${
                  expandedMenus.includes('properties') ? 'bg-blue-700' : ''
                }`}
              >
                <div className="flex items-center">
                  <Building2 size={20} />
                  {!sidebarCollapsed && <span className="ml-3 text-sm">Properties</span>}
                </div>
                {!sidebarCollapsed && (
                  expandedMenus.includes('properties') ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )
                )}
              </button>
              {expandedMenus.includes('properties') && !sidebarCollapsed && (
                <div className="ml-4 border-l border-blue-600">
                  <button
                    onClick={() => navigate('/my-properties')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-700"
                  >
                    My Properties
                  </button>
                  <button
                    onClick={() => navigate('/add-property')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-700"
                  >
                    Add Property
                  </button>
                </div>
              )}
            </div>

            {/* Assignments */}
            <button
              onClick={() => navigate('/agent/assignments')}
              className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-700 transition-colors"
            >
              <MessageCircle size={20} />
              {!sidebarCollapsed && <span className="ml-3 text-sm">Assignments</span>}
            </button>
            
            {/* Bookings */}
            <button
              onClick={() => navigate('/property-bookings')}
              className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-700 transition-colors"
            >
              <Calendar size={20} />
              {!sidebarCollapsed && <span className="ml-3 text-sm">Bookings</span>}
            </button>
            
            {/* Earnings */}
            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                activeTab === 'earnings'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-300 hover:bg-blue-700'
              }`}
            >
              <DollarSign size={20} />
              {!sidebarCollapsed && <span className="ml-3">Earnings</span>}
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-[#3B5998] text-white p-4 flex items-center justify-between no-print">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-blue-700 rounded"
              >
                <Menu size={20} />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-[#3B5998]" />
                </div>
                <span className="text-sm">{user?.first_name} {user?.last_name}</span>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-blue-700 rounded"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Scrolling Banner */}
          <ScrollingBanner />

          {/* Dashboard Content */}
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#061D58] mb-2">Agent Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.first_name}! Here's your business overview</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Properties</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalProperties || 0}</p>
                        <p className="text-xs text-green-600">Active listings</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalInquiries || 0}</p>
                        <p className="text-xs text-blue-600">Customer interest</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Tour Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalBookings || 0}</p>
                        <p className="text-xs text-purple-600">Scheduled visits</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(dashboardStats?.totalEarnings || 0)}</p>
                        <p className="text-xs text-yellow-600">Commission earned</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings & Portfolio Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4">Earnings Overview</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monthly Commission</span>
                        <span className="font-semibold text-[#90C641]">{formatIndianCurrency(dashboardStats?.monthlyCommission || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission Rate (Sales)</span>
                        <span className="font-semibold">2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission Rate (Rentals)</span>
                        <span className="font-semibold">1 Month Rent</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4">Portfolio Value</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Sale Value</span>
                        <span className="font-semibold text-[#90C641]">{formatIndianCurrency(dashboardStats?.portfolioValue.totalSaleValue || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Rent Value</span>
                        <span className="font-semibold text-[#90C641]">{formatIndianCurrency(dashboardStats?.portfolioValue.totalRentValue || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Deal Size</span>
                        <span className="font-semibold">{formatIndianCurrency(dashboardStats?.performance.avgDealSize || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-semibold text-green-600">{dashboardStats?.performance.conversionRate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Response Time</span>
                        <span className="font-semibold text-blue-600">{dashboardStats?.performance.responseTime || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Customer Rating</span>
                        <div className="flex items-center">
                          {renderStars(dashboardStats?.performance.customerRating || 0)}
                          <span className="ml-2 font-semibold">{dashboardStats?.performance.customerRating || 0}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Assignments</span>
                        <span className="font-semibold text-orange-600">
                          {dashboardStats?.recentContacts?.filter(c => c.status === 'pending').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4">Today's Activity</h3>
                    {dashboardStats?.todayContacts && dashboardStats.todayContacts.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardStats.todayContacts.slice(0, 3).map((contact, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.name || `${contact.users?.first_name} ${contact.users?.last_name}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {contact.email || contact.users?.email}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              contact.booking_date ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {contact.booking_date ? 'Tour' : 'Inquiry'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No activity today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h3 className="text-lg font-semibold text-[#061D58] mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => navigate('/add-property')}
                      className="bg-[#90C641] text-white p-4 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center justify-center"
                    >
                      <Building2 className="mr-2" size={20} />
                      Add Property
                    </button>
                    
                    <button
                      onClick={() => navigate('/my-properties')}
                      className="bg-[#3B5998] text-white p-4 rounded-lg hover:bg-[#2d4373] transition-colors flex items-center justify-center"
                    >
                      <Eye className="mr-2" size={20} />
                      View Properties
                    </button>
                    
                    <button
                      onClick={() => navigate('/agent/assignments')}
                      className="bg-[#FF6B6B] text-white p-4 rounded-lg hover:bg-[#ff5252] transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="mr-2" size={20} />
                      Assignments
                    </button>
                    
                    <button
                      onClick={() => navigate('/property-bookings')}
                      className="bg-[#10B981] text-white p-4 rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center"
                    >
                      <Calendar className="mr-2" size={20} />
                      Bookings
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-[#061D58] mb-4">Recent Activity</h3>
                  {dashboardStats?.recentContacts && dashboardStats.recentContacts.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardStats.recentContacts.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                              activity.booking_date ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {activity.booking_date ? 
                                <Calendar className="h-5 w-5 text-blue-600" /> : 
                                <MessageCircle className="h-5 w-5 text-green-600" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {activity.name || `${activity.users?.first_name} ${activity.users?.last_name}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {activity.booking_date ? 'Requested a tour' : 'Sent an inquiry'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-[#3B5998] text-white text-center py-4 no-print">
            <p className="text-sm">© Home & Own 2025. All Rights Reserved</p>
          </footer>
        </div>
      </div>
    );
  }

  // Regular Agents Listing View
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ScrollingBanner />
      
      <main className="pt-[90px] pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#061D58] mb-4">
              Find Your Perfect Real Estate Agent
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with verified and experienced real estate professionals
            </p>
          </div>

          {/* Filters */}
          <div className="professional-card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="professional-input p-3"
              >
                <option value="">All Cities</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Chennai">Chennai</option>
              </select>
              
              <select
                value={filters.specialization}
                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                className="professional-input p-3"
              >
                <option value="">All Specializations</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Luxury">Luxury Properties</option>
                <option value="Investment">Investment</option>
              </select>
              
              <select
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                className="professional-input p-3"
              >
                <option value="">Experience Level</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </select>
              
              <button
                onClick={fetchAgents}
                className="professional-button bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35]"
              >
                Search Agents
              </button>
            </div>
          </div>

          {/* Agents Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="professional-card p-6 card-hover">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-[#90C641] rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {agent.first_name[0]}{agent.last_name[0]}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {agent.first_name} {agent.last_name}
                      </h3>
                      <p className="text-gray-600">{agent.agency_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center mr-4">
                      {renderStars(agent.rating || 4.5)}
                      <span className="ml-2 text-sm text-gray-600">
                        {(agent.rating || 4.5).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {agent.total_sales || 0} sales
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      {agent.city}, {agent.state}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Specialization:</strong> {agent.specialization}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Experience:</strong> {agent.experience_years} years
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Languages:</strong> {agent.languages?.join(', ')}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleContactAgent(agent)}
                      className="flex-1 btn-primary py-2 px-4 flex items-center justify-center text-sm"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Contact
                    </button>
                    <button
                      onClick={() => handleContactAgent(agent)}
                      className="flex-1 bg-[#3B5998] text-white py-2 px-4 rounded-full hover:bg-[#2d4373] transition-all duration-200 font-semibold flex items-center justify-center text-sm shadow-md hover:shadow-lg"
                    >
                      <Calendar size={16} className="mr-2" />
                      Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Contact Agent Modal */}
      {showContactModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Contact {selectedAgent.first_name} {selectedAgent.last_name}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone size={20} className="text-[#90C641] mr-3" />
                  <span>{selectedAgent.phone_number}</span>
                </div>
                <div className="flex items-center">
                  <Mail size={20} className="text-[#90C641] mr-3" />
                  <span>{selectedAgent.email}</span>
                </div>
              </div>

              <form className="mt-6 space-y-4">
                <textarea
                  placeholder="Your message to the agent..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                />
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#90C641] text-white py-2 rounded-lg hover:bg-[#7DAF35]"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Agents;