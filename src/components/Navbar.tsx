import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import NotificationSystem from './NotificationSystem';
import PasswordChangeModal from './PasswordChangeModal';
import EmailVerificationBanner from './EmailVerificationBanner';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'buyer' | 'seller' | 'agent'>('buyer');
  const [authRedirectTo, setAuthRedirectTo] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Build nav items
  const getNavigationItems = () => {
    if (!user) {
      return {
        main: [
          { label: 'Buy', to: '/buy', userType: 'buyer' as const },
          { label: 'Rent', to: '/rent', userType: 'buyer' as const },
          { label: 'Sell', to: '/sell', userType: 'seller' as const },
          { label: 'Agent', to: '/agents', userType: 'agent' as const },
        ],
        footer: [
          { label: 'About', to: '/about' },
        ],
      };
    }
    switch (user.user_type) {
      case 'buyer':
        return {
          main: [
            { label: 'Buy', to: '/buy' },
            { label: 'Rent', to: '/rent' },
            { label: 'My Bookings', to: '/my-bookings' },
            { label: 'My Inquiries', to: '/my-inquiries' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
      case 'seller':
        return {
          main: [
            { label: 'My Properties', to: '/my-properties' },
            { label: 'Add Property', to: '/add-property' },
            { label: 'Inquiries', to: '/property-inquiries' },
            { label: 'Bookings', to: '/property-bookings' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
      case 'agent':
        return {
          main: [{ label: 'Dashboard', to: '/agent/dashboard' }],
          footer: [{ label: 'About', to: '/about' }],
        };
      case 'admin':
        return {
          main: [
            { label: 'Dashboard', to: '/admin' },
            { label: 'Users', to: '/admin/users' },
            { label: 'Properties', to: '/admin/properties' },
            { label: 'Reports', to: '/admin/reports' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
      default:
        return {
          main: [
            { label: 'Buy', to: '/buy' },
            { label: 'Rent', to: '/rent' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
    }
  };
  const { main: mainNavItems, footer: footerNavItems } = getNavigationItems();

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (!user && item.userType) {
      e.preventDefault();
      setAuthModalType(item.userType);
      setAuthRedirectTo(item.to);
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      setOpen(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/');
      }, 100);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Close user menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (showUserMenu && !(e.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showUserMenu]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <EmailVerificationBanner />
      </div>

<header className="fixed inset-x-0 top-[50px] z-40">
  <div className="container mx-auto px-4">
    <div
      className="
        bg-white
        border-2 border-[#90C641]
        rounded-full
        shadow-lg
        flex items-center
        px-4 py-2
        max-w-3xl mx-auto
      "
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex-shrink-0 mr-4"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <img
          src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
          alt="Home & Own"
          className="h-8 md:h-10"
        />
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
          {mainNavItems.map(item =>
            user ? (
              <Link
                key={item.to}
                to={item.to}
                className="text-gray-800 font-medium hover:text-[#90C641] transition-colors text-sm md:text-base px-2 py-1 rounded-md hover:bg-gray-50"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.to}
                onClick={e => {
                  handleNavClick(item, e);
                  setAuthRedirectTo(item.to);
                }}
                className="text-gray-800 font-medium hover:text-[#90C641] transition-colors text-sm md:text-base px-2 py-1 rounded-md hover:bg-gray-50"
              >
                {item.label}
              </button>
            )
          )}
          {footerNavItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="text-gray-800 font-medium hover:text-[#90C641] transition-colors text-sm md:text-base px-2 py-1 rounded-md hover:bg-gray-50"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Menu */}
      <div className="relative ml-2 md:ml-4" style={{ zIndex: 1000 }}>
        {user ? (
          <>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="
                flex items-center space-x-2
                bg-[#90C641] text-white
                px-3 py-2 rounded-full
                hover:bg-[#7DAF35] transition-colors
              "
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">
                {user.first_name} {user.last_name}
              </span>
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200"
                style={{ 
                  zIndex: 9999,
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px'
                }}
              >
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Change Password
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Log Out
                  </button>
                </div>
            )}
          </>
        ) : (
          <button
            onClick={() => {
              setAuthModalType('buyer');
              setShowAuthModal(true);
            }}
            className="
              bg-[#90C641] text-white
              px-3 py-2 rounded-full
              hover:bg-[#7DAF35] transition-colors
            "
          >
            <User className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  </div>
</header>



      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        userType={authModalType}
        redirectTo={authRedirectTo}
      />
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};

export default Navbar;