import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, MessageCircle, Calendar, Building, Award, TrendingUp, Users, Home, Eye, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
  totalAssignments: number;
  acceptedAssignments: number;
  pendingAssignments: number;
  todayAssignments: number;
  monthlyInquiries: number;
  monthlyBookings: number;
  monthlyCommission: number;
  recentAssignments: any[];
  conversionRate: number;
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
      // Fetch agent assignments
      const { data: assignments } = await supabase
        .from('agent_inquiry_assignments')
        .select(`
          *,
          inquiries (
            id,
            name,
            email,
            phone,
            message,
            inquiry_type,
            properties (
              id,
              title,
              city,
              price,
              monthly_rent,
              listing_type
            )
          )
        `)
        .eq('agent_id', user.id)
        .order('assigned_at', { ascending: false });

      // Fetch all inquiries for statistics
      const { data: allInquiries } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all bookings for statistics
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);
      
      const acceptedAssignments = assignments?.filter(a => a.status === 'accepted') || [];
      const pendingAssignments = assignments?.filter(a => a.status === 'pending') || [];
      const todayAssignments = assignments?.filter(a => 
        a.assigned_at.startsWith(today)
      ) || [];
      
      const monthlyInquiries = allInquiries?.filter(i => 
        i.created_at.startsWith(thisMonth)
      ) || [];
      
      const monthlyBookings = allBookings?.filter(b => 
        b.created_at.startsWith(thisMonth)
      ) || [];

      const stats: AgentDashboardStats = {
        totalAssignments: assignments?.length || 0,
        acceptedAssignments: acceptedAssignments.length,
        pendingAssignments: pendingAssignments.length,
        todayAssignments: todayAssignments.length,
        monthlyInquiries: monthlyInquiries.length,
        monthlyBookings: monthlyBookings.length,
        monthlyCommission: acceptedAssignments.length * 2500, // ₹2500 per accepted assignment
        recentAssignments: assignments?.slice(0, 5) || [],
        conversionRate: assignments?.length > 0 ? Math.round((acceptedAssignments.length / assignments.length) * 100) : 0
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
      // Mock data for demo
      setDashboardStats({
        totalProperties: 12,
        totalInquiries: 34,
        totalBookings: 18,
        monthlyCommission: 45000,
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="pt-[90px] pb-16">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 py-6">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold text-[#061D58] mb-2">Agent Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.first_name}! Here's your business overview</p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="dashboard-stat">
                    <div className="dashboard-stat-value text-[#3B5998]">
                      <MessageCircle className="inline mr-2" size={24} />
                      {dashboardStats?.totalAssignments || 0}
                    </div>
                    <div className="dashboard-stat-label">Total Assignments</div>
                  </div>
                  
                  <div className="dashboard-stat">
                    <div className="dashboard-stat-value text-[#90C641]">
                      <CheckCircle className="inline mr-2" size={24} />
                      {dashboardStats?.acceptedAssignments || 0}
                    </div>
                    <div className="dashboard-stat-label">Accepted</div>
                  </div>
                  
                  <div className="dashboard-stat">
                    <div className="dashboard-stat-value text-[#FFA500]">
                      <Clock className="inline mr-2" size={24} />
                      {dashboardStats?.pendingAssignments || 0}
                    </div>
                    <div className="dashboard-stat-label">Pending</div>
                  </div>
                  
                  <div className="dashboard-stat">
                    <div className="dashboard-stat-value text-[#FF6B6B]">
                      <Calendar className="inline mr-2" size={24} />
                      {dashboardStats?.todayAssignments || 0}
                    </div>
                    <div className="dashboard-stat-label">Today's Assignments</div>
                  </div>
                  
                  <div className="dashboard-stat">
                    <div className="dashboard-stat-value text-[#10B981]">
                      <TrendingUp className="inline mr-2" size={24} />
                      ₹{dashboardStats?.monthlyCommission?.toLocaleString() || '0'}
                    </div>
                    <div className="dashboard-stat-label">Est. Commission</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="professional-card p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                      <BarChart3 className="mr-2" size={20} />
                      Performance Metrics
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Conversion Rate</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-[#90C641] h-2 rounded-full" 
                              style={{ width: `${dashboardStats?.conversionRate || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{dashboardStats?.conversionRate || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monthly Inquiries</span>
                        <span className="font-semibold">{dashboardStats?.monthlyInquiries || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monthly Bookings</span>
                        <span className="font-semibold">{dashboardStats?.monthlyBookings || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-[#90C641] font-medium">Avg. Commission/Assignment</span>
                        <span className="font-semibold text-[#90C641]">₹2,500</span>
                      </div>
                    </div>
                  </div>

                  <div className="professional-card p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                      <AlertCircle className="mr-2" size={20} />
                      Recent Assignments ({dashboardStats?.recentAssignments?.length || 0})
                    </h3>
                    
                    {dashboardStats?.recentAssignments && dashboardStats.recentAssignments.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardStats.recentAssignments.map((assignment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">
                                {assignment.inquiries?.properties?.title || 'Property Inquiry'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {assignment.inquiries?.name} - {assignment.inquiries?.inquiry_type}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No assignments yet</p>
                      </div>
                    )}
                  </div>

                  <div className="professional-card p-6">
                    <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                      <BarChart3 className="mr-2" size={20} />
                      Quick Actions
                    </h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate('/agent/assignments')}
                        className="w-full bg-[#90C641] text-white p-3 rounded-lg hover:bg-[#7DAF35] transition-colors flex items-center justify-center"
                      >
                        <MessageCircle className="mr-2" size={16} />
                        View All Assignments
                      </button>
                      
                      <button
                        onClick={() => navigate('/agent/profile')}
                        className="w-full bg-[#3B5998] text-white p-3 rounded-lg hover:bg-[#2d4373] transition-colors flex items-center justify-center"
                      >
                        <User className="mr-2" size={16} />
                        Update Profile
                      </button>
                      
                      <button
                        onClick={() => navigate('/agent/reports')}
                        className="w-full bg-[#FF6B6B] text-white p-3 rounded-lg hover:bg-[#ff5252] transition-colors flex items-center justify-center"
                      >
                        <BarChart3 className="mr-2" size={16} />
                        View Reports
                      </button>
                      
                      <button
                        onClick={() => navigate('/agent/earnings')}
                        className="w-full bg-[#10B981] text-white p-3 rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center"
                      >
                        <TrendingUp className="mr-2" size={16} />
                        Track Earnings
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="professional-card p-6">
                  <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock className="mr-2" size={20} />
                      Assignment Details
                    </span>
                    <button
                      onClick={() => navigate('/agent/assignments')}
                      className="text-[#90C641] hover:text-[#7DAF35] text-sm font-medium"
                    >
                      View All →
                    </button>
                  </h3>
                  
                  {dashboardStats?.recentAssignments && dashboardStats.recentAssignments.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardStats.recentAssignments.map((assignment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {assignment.inquiries?.properties?.title || 'Property Inquiry'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {assignment.inquiries?.properties?.city} • {assignment.inquiries?.inquiry_type}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Client:</span>
                              <p className="font-medium">{assignment.inquiries?.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <p className="font-medium text-[#90C641]">
                                {assignment.inquiries?.properties?.listing_type === 'SALE' 
                                  ? `₹${(assignment.inquiries?.properties?.price / 100000).toFixed(1)}L`
                                  : `₹${(assignment.inquiries?.properties?.monthly_rent / 1000).toFixed(0)}K/month`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                            </span>
                            {assignment.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button className="bg-[#90C641] text-white px-3 py-1 rounded text-xs hover:bg-[#7DAF35]">
                                  Accept
                                </button>
                                <button className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                                  Decline
                                </button>
                              </div>
                            )}
                            {assignment.status === 'accepted' && (
                              <button 
                                onClick={() => window.open(`mailto:${assignment.inquiries?.email}?subject=Regarding your property inquiry&body=Hi ${assignment.inquiries?.name}, I'm your assigned agent for the property inquiry.`)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                              >
                                Contact Client
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No assignments yet</p>
                      <p className="text-sm mt-1">You'll receive notifications when customers inquire about properties</p>
                    </div>
                  )}
                </div>

                {/* Tips and Guidelines */}
                <div className="professional-card p-6">
                  <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                    <Award className="mr-2" size={20} />
                    Agent Tips & Guidelines
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Best Practices</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Respond to assignments within 2 hours</li>
                        <li>• Maintain 80%+ acceptance rate</li>
                        <li>• Follow up with clients within 24 hours</li>
                        <li>• Keep your profile updated</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Commission Structure</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Purchase inquiries: ₹3,000</li>
                        <li>• Rental inquiries: ₹2,000</li>
                        <li>• Successful closure bonus: ₹5,000</li>
                        <li>• Monthly performance bonus available</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Regular Agents Listing View (for non-agent users)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
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

          {/* Join as Agent CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#061D58] mb-2">
              Want to become an agent?
            </h2>
            <p className="text-gray-600 mb-4">
              Join our platform and start earning commissions from property inquiries
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors font-semibold"
            >
              Join as Agent
            </button>
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
        userType="agent"
      />
    </div>
  );
};

export default Agents;
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
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Regular Agents Listing View
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
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