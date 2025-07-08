import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import NotificationSystem from './NotificationSystem';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'buyer' | 'seller' | 'agent'>('buyer');
  const [authRedirectTo, setAuthRedirectTo] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();

  // Define navigation items based on user type
  const getNavigationItems = () => {
    if (!user) {
      return [
        { label: 'Buy', to: '/buy', userType: 'buyer' as const },
        { label: 'Rent', to: '/rent', userType: 'buyer' as const },
        { label: 'Sell', to: '/sell', userType: 'seller' as const },
        { label: 'Agents', to: '/agents', userType: 'agent' as const },
      ];
    }

    switch (user.user_type) {
      case 'buyer':
        return [
          { label: 'Buy', to: '/buy' },
          { label: 'Rent', to: '/rent' },
          { label: 'My Bookings', to: '/my-bookings' },
          { label: 'My Inquiries', to: '/my-inquiries' },
        ];
      case 'seller':
        return [
          { label: 'My Properties', to: '/my-properties' },
          { label: 'Add Property', to: '/add-property' },
          { label: 'Inquiries', to: '/property-inquiries' },
          { label: 'Bookings', to: '/property-bookings' },
        ];
      case 'agent':
        return [
          { label: 'My Listings', to: '/agent-listings' },
          { label: 'Clients', to: '/clients' },
          { label: 'Leads', to: '/leads' },
          { label: 'Reports', to: '/agent-reports' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', to: '/admin' },
          { label: 'Users', to: '/admin/users' },
          { label: 'Properties', to: '/admin/properties' },
          { label: 'Reports', to: '/admin/reports' },
        ];
      default:
        return [
          { label: 'Buy', to: '/buy' },
          { label: 'Rent', to: '/rent' },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (!user && item.userType) {
      e.preventDefault();
      setAuthModalType(item.userType);
      setAuthRedirectTo(item.to);
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
              alt="Home & Own"
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              user ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm font-medium text-gray-700 hover:text-[#90C641] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.to}
                  onClick={(e) => handleNavClick(item, e)}
                  className="text-sm font-medium text-gray-700 hover:text-[#90C641] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>

          {/* User Menu / Auth Button */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification System for Sellers/Agents */}
            <NotificationSystem />
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[#90C641] transition-colors"
                >
                  <User size={18} />
                  <span className="text-sm font-medium text-gray-700">
                    {user.first_name}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      <div>{user.email}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center">
                        <User size={12} className="mr-1" />
                        {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                      </div>
                    </div>
                    
                    {user.user_type === 'admin' && (
                      <Link
                        to="/admin"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield size={16} className="mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings size={16} className="mr-2" />
                      Settings
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalType('buyer');
                  setAuthRedirectTo('');
                  setShowAuthModal(true);
                }}
                className="bg-[#90C641] text-white px-4 py-2 rounded-md hover:bg-[#7DAF35] transition-colors font-medium text-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-700 hover:text-[#90C641] transition-colors p-2"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden bg-white border-t shadow-lg absolute top-full left-0 right-0">
            <div className="px-4 py-2 space-y-2">
              {navigationItems.map((item) => (
                user ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block py-2 font-medium text-gray-700 hover:text-[#90C641] transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.to}
                    onClick={(e) => {
                      handleNavClick(item, e);
                      setOpen(false);
                    }}
                    className="block w-full text-left py-2 font-medium text-gray-700 hover:text-[#90C641] transition-colors"
                  >
                    {item.label}
                  </button>
                )
              ))}
              
              <div className="border-t pt-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      <div>{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <User size={12} className="mr-1" />
                        {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                      </div>
                    </div>
                    
                    {user.user_type === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <Shield size={16} className="mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalType('buyer');
                      setAuthRedirectTo('');
                      setShowAuthModal(true);
                      setOpen(false);
                    }}
                    className="w-full bg-[#90C641] text-white py-2 rounded-md hover:bg-[#7DAF35] transition-colors font-medium"
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
        userType={authModalType}
        redirectTo={authRedirectTo}
      />
    </>
  );
};

export default Navbar;