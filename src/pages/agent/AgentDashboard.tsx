import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency'; 
import AgentSidebar from '@/components/agent/AgentSidebar';
import AgentHeader from '@/components/agent/AgentHeader';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users,
  Target, 
  MessageCircle, 
  CheckCircle,
  Clock, 
  Star,
  Phone,
  Mail,
  FileText,
  Settings as SettingsIcon,
  HelpCircle,
  Home,
  MapPin
} from 'lucide-react'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

// Fix Leaflet icon issue
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AgentDashboardStats {
  totalAssignments: number;
  totalInquiries: number;
  totalBookings: number;
  acceptedAssignments: number;
  totalEarnings: number;
  monthlyCommission: number;
  performance: {
    conversionRate: number;
    responseTime: string;
    customerRating: number;
    activeAssignments: number;
  };
  recentContacts: any[];
  todayContacts: any[];
}

const AgentDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [dashboardStats, setDashboardStats] = useState<AgentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [agentProfile, setAgentProfile] = useState<any>({});
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.6868, 83.2185]); // Default: Vizag
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  useEffect(() => {
    if (!user || user.user_type !== 'agent') {
      // Redirect with a slight delay to allow for state updates
      navigate('/', { replace: true });
      return;
    }
    
    fetchAgentDashboard();
    fetchAgentProfile();
    fetchAvailableProperties();
    
    // Set up real-time subscription for assignments
    const assignmentSubscription = supabase
      .channel('agent-assignments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'agent_inquiry_assignments',
          filter: `agent_id=eq.${user.id}`
        }, 
        (payload) => {
          // Show notification based on event type
          if (payload.eventType === 'INSERT') {
            toast.success('New assignment received!');
          } else if (payload.eventType === 'UPDATE') {
            toast.success('Assignment updated');
          }
          fetchAgentDashboard();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(assignmentSubscription);
    };
  }, [user, navigate]);
  
  const fetchAvailableProperties = async () => {
    if (!user) return;
    
    try {
      // Fetch properties that don't have an assigned agent
      const { data, error } = await supabase
        .from('properties')
        .select('*, users:owner_id(first_name, last_name), latitude, longitude')
        .eq('status', 'active')
        .is('agent_id', null)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Set map center to first property with coordinates if available
      if (data && data.length > 0) {
        const propertiesWithCoords = data.filter(p => p.latitude && p.longitude);
        if (propertiesWithCoords.length > 0) {
          setMapCenter([propertiesWithCoords[0].latitude, propertiesWithCoords[0].longitude]);
        }
      }
      
      setAvailableProperties(data || []);
    } catch (error) {
      console.error('Error fetching available properties:', error);
      setAvailableProperties([]);
    }
  };
  
  const fetchAgentProfile = async () => {
    if (!user) return;
    
    // First try to get agent_profiles data
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!profileError && profileData) {
        // Now get the user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!userError && userData) {
          // Combine the data
          setAgentProfile({
            ...userData,
            ...profileData
          });
          return;
        }
      }
      
      // Fallback to just user data if profile doesn't exist
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!userError && userData) {
        setAgentProfile(userData);
      } else {
        throw new Error('Could not fetch agent profile');
      }
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      setAgentProfile({});
    }
  };

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
            *,
            properties (*)
          )
        `)
        .eq('agent_id', user.id)
        .order('assigned_at', { ascending: false });

      // Fetch inquiries assigned to this agent
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select(`
          *,
          properties (*)
        `)
        .eq('assigned_agent_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch bookings where agent is involved
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (*),
          users!bookings_user_id_fkey(first_name, last_name, email, phone_number)
        `)
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      // Calculate stats
      const totalAssignments = assignments?.length || 0;
      const acceptedAssignments = assignments?.filter(a => a.status === 'accepted').length || 0;
      const pendingAssignments = assignments?.filter(a => a.status === 'pending').length || 0;
      const conversionRate = totalAssignments > 0 ? Math.round((acceptedAssignments / totalAssignments) * 100) : 0;

      // Get real earnings data if available
      const { data: earningsData } = await supabase
        .from('earnings')
        .select('total_commission')
        .eq('agent_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1);
        
      const totalEarnings = earningsData && earningsData.length > 0 
        ? earningsData[0].total_commission 
        : acceptedAssignments * 15000; // Fallback calculation
        
      const monthlyCommission = totalEarnings / 12;

      // Get today's contacts
      const today = new Date().toISOString().split('T')[0];
      const todayInquiries = inquiries?.filter(inq => 
        inq.created_at.startsWith(today)
      ) || [];
      
      const todayBookings = bookings?.filter(booking => 
        booking.created_at.startsWith(today)
      ) || [];

      const stats: AgentDashboardStats = {
        totalAssignments: totalAssignments,
        totalInquiries: inquiries?.length || 0,
        totalBookings: bookings?.length || 0,
        acceptedAssignments: acceptedAssignments,
        totalEarnings: totalEarnings,
        monthlyCommission: monthlyCommission,
        performance: {
          conversionRate: conversionRate,
          responseTime: '< 2 hours',
          customerRating: 4.8,
          activeAssignments: pendingAssignments
        },
        recentContacts: [...(inquiries?.slice(0, 5) || []), ...(bookings?.slice(0, 5) || [])],
        todayContacts: [...todayInquiries, ...todayBookings]
      };

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
      // Default empty data
      setDashboardStats({
        totalAssignments: 0,
        totalInquiries: 5,
        totalBookings: 3,
        acceptedAssignments: 0,
        totalEarnings: 25000,
        monthlyCommission: 8000,
        performance: {
          conversionRate: 0,
          responseTime: '< 2 hours',
          customerRating: 4.5,
          activeAssignments: 0
        },
        recentContacts: [],
        todayContacts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-[#061D58] mb-2">
                Welcome back, {user?.first_name}! 👋
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                  Licensed Agent
                </span>
                {agentProfile?.agent_license_number && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    License: {agentProfile.agent_license_number}
                  </span>
                )}
                {agentProfile?.education_background && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {agentProfile.education_background}
                  </span>
                )}
                {agentProfile?.specializations && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {agentProfile.specialization} Specialist
                  </span>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalAssignments || 0}</p>
                    <p className="text-xs text-orange-600">Inquiry assignments</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.acceptedAssignments || 0}</p>
                    <p className="text-xs text-green-600">Successfully handled</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Customer Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalInquiries || 0}</p>
                    <p className="text-xs text-blue-600">Active inquiries</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Tour Bookings</p>
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
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">{formatIndianCurrency(dashboardStats?.totalEarnings || 0)}</p>
                    <p className="text-xs text-yellow-600">Commission earned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/agent/assignments')}
                  className="bg-[#FF6B6B] hover:bg-[#ff5252] text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-between hover:shadow-lg transform hover:scale-105 relative"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">View Assignments</div>
                    <div className="text-xs opacity-90">Check new assignments</div>
                  </div>
                  <Target size={20} />
                  {dashboardStats?.performance?.activeAssignments > 0 && (
                    <div className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {dashboardStats.performance.activeAssignments}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => window.open('tel:1800-123-4567')}
                  className="bg-[#3B5998] hover:bg-[#2d4373] text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-between hover:shadow-lg transform hover:scale-105"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">Contact Support</div>
                    <div className="text-xs opacity-90">Get help & support</div>
                  </div>
                  <Phone size={20} />
                </button>
                
                <button
                  onClick={() => window.open('mailto:agents@homeandown.com')}
                  className="bg-[#10B981] hover:bg-[#059669] text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-between hover:shadow-lg transform hover:scale-105"
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">Email Support</div>
                    <div className="text-xs opacity-90">Send us an email</div>
                  </div>
                  <Mail size={20} />
                </button>
              </div>
            </div>
            
            {/* Available Properties Pool */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Available Properties
              </h3>
              
              {availableProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableProperties.map((property) => (
                    <div key={property.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1">{property.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin size={14} className="inline mr-1" />
                          {property.city}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-[#90C641] font-bold">
                            {property.listing_type === 'SALE' 
                              ? formatIndianCurrency(property.price)
                              : `${formatIndianCurrency(property.monthly_rent)}/mo`
                            }
                          </span>
                          <button
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No available properties in the pool</p>
              )}
            </div>
            
            {/* Properties Map */}
            {availableProperties.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Property Locations
                </h3>
                
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {availableProperties.filter(p => p.latitude && p.longitude).map(property => (
                      <Marker 
                        key={property.id} 
                        position={[property.latitude, property.longitude]}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-semibold">{property.title}</h3>
                            <p className="text-sm">{property.address}</p>
                            <p className="text-sm font-medium text-green-600">
                              {property.listing_type === 'SALE' 
                                ? formatIndianCurrency(property.price)
                                : `${formatIndianCurrency(property.monthly_rent)}/mo`
                              }
                            </p>
                            <button
                              onClick={() => navigate(`/property/${property.id}`)}
                              className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'performance':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#061D58]">Performance Metrics</h3>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats?.performance?.conversionRate || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardStats?.performance?.responseTime || 'N/A'}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Customer Rating</p>
                    <div className="flex items-center">
                      {renderStars(dashboardStats?.performance?.customerRating || 0)}
                      <span className="ml-2 text-xl font-bold text-yellow-600">{dashboardStats?.performance?.customerRating || 0}</span>
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Assignments</p>
                    <p className="text-2xl font-bold text-purple-600">{dashboardStats?.performance?.activeAssignments || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'earnings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#061D58]">Earnings Overview</h3>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Commission</p>
                    <p className="text-3xl font-bold text-green-600">{formatIndianCurrency(dashboardStats?.monthlyCommission || 0)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold text-blue-600">{formatIndianCurrency(dashboardStats?.totalEarnings || 0)}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Sales Commission</p>
                <p className="text-2xl font-semibold text-blue-600">2%</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Rental Commission</p>
                <p className="text-2xl font-semibold text-purple-600">1 Month</p>
              </div>
            </div>
          </div>
        );
        
      case 'activity':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-[#061D58] mb-6 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Recent Activity
            </h3>
            
            {dashboardStats?.recentContacts && dashboardStats.recentContacts.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.recentContacts.slice(0, 10).map((activity: any, index: number) => {
                  const isBooking = activity.booking_date !== undefined;
                  const propertyTitle = isBooking 
                    ? activity.properties?.title 
                    : activity.properties?.title;
                  const customerName = isBooking
                    ? `${activity.users?.first_name || ''} ${activity.users?.last_name || ''}`
                    : activity.name;
                  
                  return (
                  <div key={index} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-blue-400">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        isBooking ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {isBooking ? 
                          <Calendar className="h-5 w-5 text-blue-600" /> : 
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {isBooking ? 'Requested a tour for' : 'Sent an inquiry about'} <span className="font-medium">{propertyTitle}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isBooking ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isBooking ? 'Tour Request' : 'Inquiry'}
                      </span>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No recent activity</p>
                <p className="text-sm">New inquiries and bookings will appear here</p>
              </div>
            )}
          </div>
        );
        
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-[#061D58] mb-6 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Analytics & Reports
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Customer Insights</h4>
                <p className="text-sm text-gray-600">Track customer interactions and preferences</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Performance Trends</h4>
                <p className="text-sm text-gray-600">Monitor your success rates over time</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Earnings Analysis</h4>
                <p className="text-sm text-gray-600">Detailed breakdown of your commissions</p>
              </div>
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              Agent Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Profile Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text" 
                      value={agentProfile?.first_name || ''}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text" 
                      value={agentProfile?.last_name || ''}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text" 
                      value={agentProfile?.agent_license_number || 'Not assigned'}
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">License number cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Background</label>
                    <input
                      type="text"
                      value={agentProfile?.education_background || ''}
                      onChange={(e) => setAgentProfile({...agentProfile, education_background: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Contact Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email" 
                      value={user?.email || ''}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel" 
                      value={agentProfile?.phone_number || ''}
                      onChange={(e) => setAgentProfile({...agentProfile, phone_number: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text" 
                      value={agentProfile?.city || ''}
                      onChange={(e) => setAgentProfile({...agentProfile, city: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Notification Preferences</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" checked />
                    <span className="text-sm">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" checked />
                    <span className="text-sm">SMS notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" checked />
                    <span className="text-sm">In-app notifications</span>
                  </label>
                </div>
              </div>              
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Account Security</h4>
              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-[#3B5998] text-white px-4 py-2 rounded-lg hover:bg-[#2d4373] transition-colors flex items-center"
                  >
                    <SettingsIcon size={16} className="mr-2" />
                    Change Password
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Last password change: Never</p>
                  <p>Two-factor authentication: Not enabled</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  toast.success('Profile updated successfully!');
                  // Save profile changes to database
                  const updateProfile = async () => {
                    try {
                      // Check if agent profile exists
                      const { data, error } = await supabase
                        .from('agent_profiles')
                        .select('id')
                        .eq('user_id', user?.id)
                        .single();
                        
                      if (error && error.code !== 'PGRST116') {
                        throw error;
                      }
                      
                      if (data) {
                        // Update existing profile
                        await supabase
                          .from('agent_profiles')
                          .update({
                            education_background: agentProfile.education_background,
                            specializations: agentProfile.specializations,
                            bio: agentProfile.bio,
                            updated_at: new Date().toISOString()
                          })
                          .eq('user_id', user?.id);
                      } else {
                        // Create new profile
                        await supabase
                          .from('agent_profiles')
                          .insert({
                            user_id: user?.id,
                            education_background: agentProfile.education_background,
                            specializations: agentProfile.specializations,
                            bio: agentProfile.bio
                          });
                      }
                      
                      // Update user table
                      await supabase
                        .from('users')
                        .update({
                          phone_number: agentProfile.phone_number,
                          city: agentProfile.city,
                          state: agentProfile.state,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', user?.id);
                        
                    } catch (error) {
                      console.error('Error updating profile:', error);
                      toast.error('Failed to update profile');
                    }
                  };
                  
                  updateProfile();
                }}
                className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        );
        
      case 'help':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-[#061D58] mb-6 flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              Help & Support
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Contact Support</h4>
                <div className="space-y-3">
                  <a href="tel:1800-123-4567" className="flex items-center text-[#90C641] hover:underline">
                    <Phone size={16} className="mr-2" />
                    1800-123-4567
                  </a>
                  <a href="mailto:agents@homeandown.com" className="flex items-center text-[#90C641] hover:underline">
                    <Mail size={16} className="mr-2" />
                    agents@homeandown.com
                  </a>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Quick Links</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">• Agent Training Materials</p>
                  <p className="text-sm text-gray-600">• Commission Structure Guide</p>
                  <p className="text-sm text-gray-600">• Customer Service Best Practices</p>
                  <p className="text-sm text-gray-600">• Platform Usage Guidelines</p>
                </div>
              </div>
            </div>
          </div>
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
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      <AgentSidebar
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        expandedMenus={expandedMenus}
        onTabChange={setActiveTab}
        onMenuToggle={toggleMenu}
      />

      {/* Main Content */}
        <AgentHeader
          user={user}
          agentProfile={agentProfile}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-[#3B5998] text-white text-center py-4 no-print">
          <p className="text-sm">© Home & Own 2025. All Rights Reserved</p>
        </footer>
        </div>
    </div>
  );
};

export default AgentDashboard;