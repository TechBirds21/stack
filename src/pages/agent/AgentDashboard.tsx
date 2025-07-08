import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';
import AgentSidebar from '@/components/agent/AgentSidebar';
import AgentHeader from '@/components/agent/AgentHeader';
import AgentStats from '@/components/agent/AgentStats';
import AgentEarnings from '@/components/agent/AgentEarnings';
import AgentPerformance from '@/components/agent/AgentPerformance';
import AgentActivity from '@/components/agent/AgentActivity';
import AgentQuickActions from '@/components/agent/AgentQuickActions';

interface AgentDashboardStats {
  totalProperties: number;
  totalInquiries: number;
  totalBookings: number;
  totalAssignments: number;
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

  useEffect(() => {
    if (!user || user.user_type !== 'agent') {
      navigate('/');
      return;
    }
    
    fetchAgentDashboard();
  }, [user, navigate]);

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
      const pendingAssignments = assignments?.filter(a => a.status === 'pending').length || 0;
      const conversionRate = totalAssignments > 0 ? Math.round((acceptedAssignments / totalAssignments) * 100) : 0;

      const stats: AgentDashboardStats = {
        totalProperties: properties?.length || 0,
        totalInquiries: inquiries?.length || 0,
        totalBookings: bookings?.length || 0,
        totalAssignments: totalAssignments,
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
          customerRating: 4.8,
          activeAssignments: pendingAssignments
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
        totalAssignments: 25,
        totalEarnings: 450000,
        monthlyCommission: 37500,
        portfolioValue: {
          totalSaleValue: 15000000,
          totalRentValue: 360000
        },
        performance: {
          conversionRate: 68,
          avgDealSize: 1250000,
          responseTime: '< 2 hours',
          customerRating: 4.8,
          activeAssignments: 3
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
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
      <div className="flex-1 flex flex-col">
        <AgentHeader
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
        />

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#061D58] mb-2">Agent Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.first_name}! Here's your business overview</p>
          </div>

          {/* Stats Cards */}
          <AgentStats stats={dashboardStats} />

          {/* Earnings & Portfolio Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AgentEarnings stats={dashboardStats} />
            <AgentPerformance stats={dashboardStats} />
          </div>

          {/* Activity and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AgentActivity stats={dashboardStats} />
            <AgentQuickActions />
          </div>
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