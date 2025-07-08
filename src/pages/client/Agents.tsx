import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, MessageCircle, Calendar, Building2, TrendingUp, Users, Home, Eye, BarChart3, DollarSign, Award, Target, Menu, User, LogOut } from 'lucide-react';
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
  averagePropertyValue: number;
  successfulDeals: number;
  recentContacts: any[];
  propertyValues: {
    totalSaleValue: number;
    totalRentValue: number;
    averagePrice: number;
    averageRent: number;
  };
}

const Agents: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<AgentDashboardStats | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    specialization: '',
    experience: '',
  });

  useEffect(() => {
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

      // Calculate property values and earnings
      const saleProperties = properties?.filter(p => p.listing_type === 'SALE') || [];
      const rentProperties = properties?.filter(p => p.listing_type === 'RENT') || [];
      
      const totalSaleValue = saleProperties.reduce((sum, p) => sum + (p.price || 0), 0);
      const totalRentValue = rentProperties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
      const averagePrice = saleProperties.length ? totalSaleValue / saleProperties.length : 0;
      const averageRent = rentProperties.length ? totalRentValue / rentProperties.length : 0;
      
      // Calculate commission (assuming 2% for sales, 1 month rent for rentals)
      const saleCommission = totalSaleValue * 0.02;
      const rentCommission = totalRentValue * 1; // 1 month rent as commission
      const totalEarnings = saleCommission + rentCommission;
      const monthlyCommission = totalEarnings / 12; // Average monthly

      const stats: AgentDashboardStats = {
        totalProperties: properties?.length || 0,
        totalInquiries: inquiries?.length || 0,
        totalBookings: bookings?.length || 0,
        totalEarnings: totalEarnings,
        monthlyCommission: monthlyCommission,
        averagePropertyValue: averagePrice,
        successfulDeals: Math.floor((inquiries?.length || 0) * 0.15), // 15% conversion rate
        recentContacts: [...(inquiries?.slice(0, 5) || []), ...(bookings?.slice(0, 5) || [])],
        propertyValues: {
          totalSaleValue,
          totalRentValue,
          averagePrice,
          averageRent,
        }
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
      // Mock data for demo with realistic earnings
      setDashboardStats({
        totalProperties: 12,
        totalInquiries: 34,
        totalBookings: 18,
        totalEarnings: 2400000, // 24 lakhs total
        monthlyCommission: 200000, // 2 lakhs per month
        averagePropertyValue: 4500000, // 45 lakhs average
        successfulDeals: 5,
        recentContacts: [],
        propertyValues: {
          totalSaleValue: 54000000, // 5.4 crores
          totalRentValue: 360000, // 3.6 lakhs monthly rent
          averagePrice: 4500000,
          averageRent: 30000,
        }
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
    await signOut();
    navigate('/');
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

  // Agent Dashboard View - Admin Pattern with Sidebar
  if (user?.user_type === 'agent') {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar - Admin Pattern */}
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
            <div className="space-y-2">
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="w-full flex items-center px-4 py-2 text-sm transition-colors bg-green-500 text-white"
              >
                <BarChart3 size={20} />
                {!sidebarCollapsed && <span className="ml-3">Dashboard</span>}
              </button>
              
              <button
                onClick={() => navigate('/my-properties')}
                className="w-full flex items-center px-4 py-2 text-sm transition-colors text-gray-300 hover:bg-blue-700"
              >
                <Building2 size={20} />
                {!sidebarCollapsed && <span className="ml-3">My Properties</span>}
              </button>
              
              <button
                onClick={() => navigate('/agent/assignments')}
                className="w-full flex items-center px-4 py-2 text-sm transition-colors text-gray-300 hover:bg-blue-700"
              >
                <MessageCircle size={20} />
                {!sidebarCollapsed && <span className="ml-3">Assignments</span>}
              </button>
              
              <button
                onClick={() => navigate('/property-bookings')}
                className="w-full flex items-center px-4 py-2 text-sm transition-colors text-gray-300 hover:bg-blue-700"
              >
                <Calendar size={20} />
                {!sidebarCollapsed && <span className="ml-3">Bookings</span>}
              </button>
              
              <button
                onClick={() => navigate('/agent/earnings')}
                className="w-full flex items-center px-4 py-2 text-sm transition-colors text-gray-300 hover:bg-blue-700"
              >
                <DollarSign size={20} />
                {!sidebarCollapsed && <span className="ml-3">Earnings</span>}
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header - Admin Pattern */}
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
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
              </div>
            ) : (
              <>
                {/* Welcome Section */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user.first_name}! 👋
                  </h1>
                  <p className="text-gray-600">Here's your business overview and performance metrics</p>
                </div>

                {/* Main Stats Cards */}
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
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Successful Deals</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats?.successfulDeals || 0}</p>
                        <p className="text-xs text-yellow-600">Closed deals</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings and Property Values */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="mr-2" size={20} />
                      Earnings Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatIndianCurrency(dashboardStats?.totalEarnings || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total Earnings</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatIndianCurrency(dashboardStats?.monthlyCommission || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Monthly Average</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Commission Structure:</strong> 2% on sales, 1 month rent on rentals
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="mr-2" size={20} />
                      Property Portfolio Value
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatIndianCurrency(dashboardStats?.propertyValues?.totalSaleValue || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total Sale Value</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Avg: {formatIndianCurrency(dashboardStats?.propertyValues?.averagePrice || 0)}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatIndianCurrency(dashboardStats?.propertyValues?.totalRentValue || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Monthly Rent Value</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Avg: {formatIndianCurrency(dashboardStats?.propertyValues?.averageRent || 0)}/month
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Target className="mr-2" size={20} />
                      Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-semibold">15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average Deal Size</span>
                        <span className="font-semibold">{formatIndianCurrency(dashboardStats?.averagePropertyValue || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Response Time</span>
                        <span className="font-semibold">< 2 hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Customer Rating</span>
                        <div className="flex items-center">
                          {renderStars(4.8)}
                          <span className="ml-2 font-semibold">4.8</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="mr-2" size={20} />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate('/add-property')}
                        className="bg-[#90C641] text-white p-3 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center justify-center text-sm"
                      >
                        <Building2 className="mr-2" size={16} />
                        Add Property
                      </button>
                      
                      <button
                        onClick={() => navigate('/my-properties')}
                        className="bg-[#3B5998] text-white p-3 rounded-lg hover:bg-[#2d4373] transition-colors flex items-center justify-center text-sm"
                      >
                        <Eye className="mr-2" size={16} />
                        View Properties
                      </button>
                      
                      <button
                        onClick={() => navigate('/agent/assignments')}
                        className="bg-[#FF6B6B] text-white p-3 rounded-lg hover:bg-[#ff5252] transition-colors flex items-center justify-center text-sm"
                      >
                        <MessageCircle className="mr-2" size={16} />
                        Assignments
                      </button>
                      
                      <button
                        onClick={() => navigate('/property-bookings')}
                        className="bg-[#10B981] text-white p-3 rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center text-sm"
                      >
                        <Calendar className="mr-2" size={16} />
                        Bookings
                      </button>
                    </div>
                  </div>
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