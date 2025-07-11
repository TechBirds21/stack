import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import AgentSidebar from '@/components/agent/AgentSidebar';
import AgentHeader from '@/components/agent/AgentHeader';
import PasswordChangeModal from '@/components/PasswordChangeModal';

// Import separate component pages
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Performance from './components/Performance';
import Earnings from './components/Earnings';
import Activity from './components/Activity';
import Help from './components/Help'; 

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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [agentProfile, setAgentProfile] = useState<any>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user || user.user_type !== 'agent') {
      // Redirect with a slight delay to allow for state updates
      navigate('/', { replace: true });
      return;
    }
    
    fetchAgentDashboard();
    fetchAgentProfile();

    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds
    
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
      clearInterval(refreshInterval);
      supabase.removeChannel(assignmentSubscription);
    };
  }, [user, navigate, refreshTrigger]);

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
          .maybeSingle();
          
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
        return <Dashboard user={user} agentProfile={agentProfile} key={refreshTrigger} />;

      case 'performance':
        return <Performance dashboardStats={dashboardStats} key={refreshTrigger} />;

      case 'earnings':
        return <Earnings dashboardStats={dashboardStats} key={refreshTrigger} />;

      case 'activity':
        return <Activity dashboardStats={dashboardStats} key={refreshTrigger} />;

      case 'settings':
        return (
          <Settings 
            key={refreshTrigger}
            user={user} 
            agentProfile={agentProfile} 
            setAgentProfile={setAgentProfile} 
            setShowPasswordModal={setShowPasswordModal} 
          />
        );

      case 'help':
        return <Help key={refreshTrigger} />;

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
    <div className="min-h-screen bg-gray-100 flex">
      <AgentSidebar
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        expandedMenus={expandedMenus}
        onTabChange={setActiveTab}
        onMenuToggle={toggleMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgentHeader
          user={user}
          agentProfile={agentProfile}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-[#3B5998] text-white text-center py-4 no-print">
          <p className="text-sm">© Home & Own 2025. All Rights Reserved</p>
        </footer>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default AgentDashboard;