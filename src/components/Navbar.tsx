import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Shield, Home, Building, Users, Calendar, MessageSquare, Plus, Search, FileText, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import NotificationSystem from './NotificationSystem';
import PasswordChangeModal from './PasswordChangeModal';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Define navigation items based on user type
  const getNavigationItems = () => {
    if (!user) {
      return [
        { label: 'Buy', to: '/buy', icon: <Home size={16} /> },
        { label: 'Rent', to: '/rent', icon: <Building size={16} /> },
        { label: 'Sell', to: '/sell', icon: <Plus size={16} /> },
        { label: 'Agents', to: '/agents', icon: <Users size={16} /> },
      ];
    }

    switch (user.user_type) {
      case 'buyer':
        return [
          { label: 'Buy Properties', to: '/buy', icon: <Search size={16} /> },
          { label: 'Rent Properties', to: '/rent', icon: <Building size={16} /> },
          { label: 'My Bookings', to: '/my-bookings', icon: <Calendar size={16} /> },
          { label: 'My Inquiries', to: '/my-inquiries', icon: <MessageSquare size={16} /> },
        ];
      case 'seller':
        return [
          { label: 'Dashboard', to: '/seller-dashboard', icon: <Home size={16} /> },
          { label: 'My Properties', to: '/my-properties', icon: <Building size={16} /> },
          { label: 'Add Property', to: '/add-property', icon: <Plus size={16} /> },
          { label: 'Inquiries', to: '/property-inquiries', icon: <MessageSquare size={16} /> },
          { label: 'Tour Requests', to: '/property-bookings', icon: <Calendar size={16} /> },
        ];
      case 'agent':
        return [
          { label: 'Dashboard', to: '/agent-dashboard', icon: <Home size={16} /> },
          { label: 'My Listings', to: '/agent-listings', icon: <Building size={16} /> },
          { label: 'Clients', to: '/clients', icon: <Users size={16} /> },
          { label: 'Leads', to: '/leads', icon: <MessageSquare size={16} /> },
          { label: 'Reports', to: '/agent-reports', icon: <FileText size={16} /> },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', to: '/admin', icon: <Home size={16} /> },
          { label: 'Users', to: '/admin/users', icon: <Users size={16} /> },
          { label: 'Properties', to: '/admin/properties', icon: <Building size={16} /> },
          { label: 'Seller Approvals', to: '/admin/seller-approvals', icon: <Shield size={16} /> },
          { label: 'Reports', to: '/admin/reports', icon: <FileText size={16} /> },
        ];
      default:
        return [
          { label: 'Buy', to: '/buy', icon: <Home size={16} /> },
          { label: 'Rent', to: '/rent', icon: <Building size={16} /> },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    // Scroll to top after logout
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  const getUserTypeColor = () => {
    switch (user?.user_type) {
      case 'buyer': return 'bg-blue-500';
      case 'seller': return 'bg-green-500';
      case 'agent': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-[#90C641]';
    }
  };

  const getUserTypeBadge = () => {
    if (!user) return null;
    
    const badges = {
      buyer: { label: 'Buyer', color: 'bg-blue-100 text-blue-800' },
      seller: { label: 'Seller', color: 'bg-green-100 text-green-800' },
      agent: { label: 'Agent', color: 'bg-purple-100 text-purple-800' },
      admin: { label: 'Admin', color: 'bg-red-100 text-red-800' },
    };
    
    const badge = badges[user.user_type as keyof typeof badges];
    return badge ? (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    ) : null;
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
              alt="Home & Own"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActiveLink(item.to)
                    ? 'bg-[#90C641] text-white shadow-md'
                    : 'text-gray-700 hover:text-[#90C641] hover:bg-gray-50'
                }`}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Button */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Notification System for Sellers/Agents */}
            <NotificationSystem />
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
                >
                  <div className={`w-8 h-8 ${getUserTypeColor()} rounded-full flex items-center justify-center`}>
                    <User size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        {getUserTypeBadge()}
                      </div>
                    </div>
                    
                    {user.user_type === 'admin' && (
                      <Link
                        to="/admin"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => {
                          setShowUserMenu(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Shield size={16} className="mr-3" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Lock size={16} className="mr-3" />
                      Change Password
                    </button>
                    
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={16} className="mr-3" />
                      Settings
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100 mt-2"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-[#90C641] text-white px-6 py-2.5 rounded-full hover:bg-[#7DAF35] transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-gray-700 hover:text-[#90C641] transition-colors p-2 rounded-md hover:bg-gray-50"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="lg:hidden bg-white border-t shadow-lg absolute top-full left-0 right-0 z-50">
            <div className="px-6 py-4 space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    setOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center space-x-3 py-3 px-3 rounded-lg font-semibold transition-colors ${
                    isActiveLink(item.to)
                      ? 'bg-[#90C641] text-white'
                      : 'text-gray-800 hover:text-[#90C641] hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 ${getUserTypeColor()} rounded-full flex items-center justify-center`}>
                        <User size={18} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="mt-1">{getUserTypeBadge()}</div>
                      </div>
                    </div>
                    
                    {user.user_type === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors py-2"
                        onClick={() => {
                          setOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Shield size={16} className="mr-3" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setOpen(false);
                      }}
                      className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors py-2 w-full text-left"
                    >
                      <Lock size={16} className="mr-3" />
                      Change Password
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center text-red-600 hover:text-red-700 transition-colors py-2 w-full text-left"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setOpen(false);
                    }}
                    className="w-full bg-[#90C641] text-white py-3 rounded-full hover:bg-[#7DAF35] transition-colors font-semibold shadow-md"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};

export default Navbar;