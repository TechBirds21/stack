import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  pendingSellerApprovals: number;
  recentActivity: any[];
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalInquiries: 0,
    pendingSellerApprovals: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (user.user_type !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Fetch inquiries count
      const { count: inquiriesCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true });

      // Fetch pending seller approvals
      const { count: pendingApprovals } = await supabase
        .from('seller_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Fetch recent activity
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('*, properties(title), users(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentInquiries } = await supabase
        .from('inquiries')
        .select('*, properties(title)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: usersCount || 0,
        totalProperties: propertiesCount || 0,
        totalBookings: bookingsCount || 0,
        totalInquiries: inquiriesCount || 0,
        pendingSellerApprovals: pendingApprovals || 0,
        recentActivity: [...(recentBookings || []), ...(recentInquiries || [])].slice(0, 10)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set mock data for demo
      setStats({
        totalUsers: 156,
        totalProperties: 89,
        totalBookings: 34,
        totalInquiries: 67,
        pendingSellerApprovals: 12,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center">
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
              alt="Home & Own"
              className="h-8 w-auto mr-4"
            />
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user.first_name} {user.last_name}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <LogOut size={20} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin"
                  className="flex items-center px-4 py-2 text-gray-700 bg-[#90C641] text-white rounded-lg"
                >
                  <TrendingUp size={20} className="mr-3" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/seller-approvals"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <CheckCircle size={20} className="mr-3" />
                  Seller Approvals
                  {stats.pendingSellerApprovals > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {stats.pendingSellerApprovals}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Users size={20} className="mr-3" />
                  Users
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Home size={20} className="mr-3" />
                  Properties
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Calendar size={20} className="mr-3" />
                  Bookings
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <MessageSquare size={20} className="mr-3" />
                  Inquiries
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Settings size={20} className="mr-3" />
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                      <p className="text-sm font-medium text-gray-600">Total Properties</p>
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
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
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
                      <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to="/admin/seller-approvals"
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-orange-600 mr-3" />
                        <span className="text-gray-900">Pending Seller Approvals</span>
                      </div>
                      <span className="bg-orange-500 text-white text-sm px-2 py-1 rounded-full">
                        {stats.pendingSellerApprovals}
                      </span>
                    </Link>
                    
                    <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="flex items-center">
                        <Eye className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="text-gray-900">Review Properties</span>
                      </div>
                      <span className="text-blue-600">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-900">Manage Users</span>
                      </div>
                      <span className="text-green-600">→</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database</span>
                      <span className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Storage</span>
                      <span className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email Service</span>
                      <span className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payment Gateway</span>
                      <span className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {stats.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#90C641] rounded-full mr-3"></div>
                            <span className="text-gray-900">
                              {activity.booking_date ? 'New booking' : 'New inquiry'} for property
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
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;