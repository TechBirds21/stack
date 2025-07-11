import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  CheckCircle, 
  MessageCircle, 
  Calendar, 
  DollarSign,
  Home,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import toast from 'react-hot-toast';

// Fix Leaflet icon issue
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DashboardProps {
  user: any;
  agentProfile: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user, agentProfile }) => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.6868, 83.2185]); // Default: Vizag
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchAgentDashboard();
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
  }, [user]);
  
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

  const fetchAgentDashboard = async () => {
    if (!user) return;

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

      const stats = {
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
        totalInquiries: 0,
        totalBookings: 0,
        acceptedAssignments: 0,
        totalEarnings: 0,
        monthlyCommission: 0,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
      </div>
    );
  }

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
};

export default Dashboard;