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
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([17.6868, 83.2185]); // Default: Vizag
  const [loading, setLoading] = useState(true);
  const [interestedClients, setInterestedClients] = useState<any[]>([]);
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);
  const [claimingProperty, setClaimingProperty] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    fetchAgentDashboard();
    fetchAvailableProperties();
    fetchInterestedClients();
    fetchAssignedProperties();
    
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
      
    // Set up real-time subscription for inquiries
    const inquirySubscription = supabase
      .channel('agent-inquiries')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'inquiries',
          filter: `assigned_agent_id=eq.${user.id}`
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success('New inquiry assigned to you!');
          }
          fetchInterestedClients();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for property assignments
    const propertySubscription = supabase
      .channel('agent-properties')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'agent_property_assignments'
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success('New property assigned to you!');
          }
          fetchAssignedProperties();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(assignmentSubscription);
      supabase.removeChannel(inquirySubscription);
      supabase.removeChannel(propertySubscription);
    };
  }, [user]);

  const createPropertyIcon = (price: number, type: string) => {
    return new Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
  };

  const fetchAgentDashboard = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get assignments data
      const { data: assignments, error: assignmentsError } = await supabase
        .from('agent_inquiry_assignments')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get inquiries data
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('*')
        .eq('assigned_agent_id', user.id)
        .order('created_at', { ascending: false });

      if (inquiriesError) throw inquiriesError;

      // Get bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

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
      const todayInquiries = inquiries || [];
      const todayBookings = bookings || [];

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

  // Rest of the component implementation...

  return (
    <div className="space-y-6">
      {/* Component JSX */}
    </div>
  );
};

export default Dashboard;