import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import NotificationSystem from './NotificationSystem';
import PasswordChangeModal from './PasswordChangeModal';
import EmailVerificationBanner from './EmailVerificationBanner';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'buyer' | 'seller' | 'agent'>('buyer');
  const [authRedirectTo, setAuthRedirectTo] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, signOut } = useAuth();

  // Define navigation items based on user type
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
          // { label: 'Host', to: '/host' },
          // { label: 'Community', to: '/community' },
        ]
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
          footer: [
            { label: 'About', to: '/about' },
            // { label: 'Host', to: '/host' },
            // { label: 'Community', to: '/community' },
          ]
        };
      case 'seller':
        return {
          main: [
            { label: 'My Properties', to: '/my-properties' },
            { label: 'Add Property', to: '/add-property' },
            { label: 'Inquiries', to: '/property-inquiries' },
            { label: 'Bookings', to: '/property-bookings' },
          ],
          footer: [
            { label: 'About', to: '/about' },
            // { label: 'Host', to: '/host' },
            // { label: 'Community', to: '/community' },
          ]
        };
      case 'agent':
        return {
          main: [
            { label: 'Dashboard', to: '/agent/dashboard' },
          ],
          footer: [
            { label: 'About', to: '/about' },
            // { label: 'Host', to: '/host' },
            // { label: 'Community', to: '/community' },
          ]
        };
      case 'admin':
        return {
          main: [
            { label: 'Dashboard', to: '/admin' },
            { label: 'Users', to: '/admin/users' },
            { label: 'Properties', to: '/admin/properties' },
            { label: 'Reports', to: '/admin/reports' },
          ],
          footer: [
            { label: 'About', to: '/about' },
            { label: 'Host', to: '/host' },
            { label: 'Community', to: '/community' },
          ]
        };
      default:
        return {
          main: [
            { label: 'Buy', to: '/buy' },
            { label: 'Rent', to: '/rent' },
          ],
          footer: [
            { label: 'About', to: '/about' },
            { label: 'Host', to: '/host' },
            { label: 'Community', to: '/community' },
          ]
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
      
      // Smooth scroll to top and navigate to home
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <EmailVerificationBanner />
      </div>
      
      <header className="fixed inset-x-0 top-[50px] z-40 h-[90px] bg-white shadow-md">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" onClick={() => {
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          }}>
            <img
              src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA"
              alt="Home & Own"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {mainNavItems.map((item) => (
              user ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm font-semibold text-gray-800 hover:text-[#90C641] transition-colors duration-300"
                  // target={item.to.startsWith('/about') || item.to.startsWith('/host') || item.to.startsWith('/community') ? "_blank" : ""}
                  target={item.to.startsWith('/about') ? "_blank" : ""}
                  
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.to}
                  onClick={(e) => handleNavClick(item, e)}
                  className="text-sm font-semibold text-gray-800 hover:text-[#90C641] transition-colors duration-300"
                >
                  {item.label}
                </button>
              )
            ))}
            
            {/* Footer Navigation Items */}
            {footerNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-semibold text-gray-800 hover:text-[#90C641] transition-colors duration-300"
                target="_blank"
                onClick={() => {
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Button */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification System for Sellers/Agents */}
            <NotificationSystem />
            
            {user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[#90C641] transition-colors duration-300 relative z-50 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-[#90C641] rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Dropdown Menu */}
                  <div 
                    className="fixed right-4 top-[140px] w-72 bg-white rounded-xl shadow-2xl py-2 border border-gray-100 z-50"
                    style={{
                      backgroundColor: 'white',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      transform: 'translateY(0)',
                      opacity: 1,
                      transition: 'all 0.2s ease-out'
                    }}
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#90C641] rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-gray-900 font-semibold">{user.first_name} {user.last_name}</div>
                          <div className="text-gray-600 text-xs">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center">
                            <span className={`user-badge ${user.user_type} px-2 py-1 rounded-full text-xs font-medium`}>
                              {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                      {user.user_type === 'admin' && (
                        <Link
                          to="/admin"
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors duration-200"
                          onClick={() => {
                            setShowUserMenu(false);
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          <Shield size={16} className="mr-3 text-blue-600" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Add settings functionality here
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center transition-colors duration-200"
                      >
                        <Settings size={16} className="mr-3 text-gray-500" />
                        Account Settings
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowPasswordModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center transition-colors duration-200"
                      >
                        <Settings size={16} className="mr-3 text-gray-500" />
                        Change Password
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors duration-200 font-medium"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign Out
                    </button>
                  </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalType('buyer');
                  setAuthRedirectTo('');
                  setShowAuthModal(true);
                }}
                className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-700 hover:text-[#90C641] transition-colors duration-300 p-2 rounded-lg hover:bg-gray-50"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden bg-white border-t shadow-lg absolute top-full left-0 right-0 z-50">
            <div className="px-4 py-2 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
              {mainNavItems.map((item) => (
                user ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    target={item.to.startsWith('/about') || item.to.startsWith('/host') || item.to.startsWith('/community') ? "_blank" : ""}
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }}
                    className="block py-3 font-semibold text-gray-700 hover:text-[#90C641] transition-colors duration-300 border-b border-gray-100 last:border-b-0"
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
                    className="block w-full text-left py-3 font-semibold text-gray-700 hover:text-[#90C641] transition-colors duration-300 border-b border-gray-100 last:border-b-0"
                  >
                    {item.label}
                  </button>
                )
              ))}

              {/* Mobile Footer Navigation */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="text-sm text-gray-500 mb-2">More Information</p>
                {footerNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    target="_blank"
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 100);
                    }}
                    className="block py-3 font-semibold text-gray-700 hover:text-[#90C641] transition-colors duration-300 border-b border-gray-100 last:border-b-0"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-[#90C641] rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                        </div>
                      </div>
                      <span className={`user-badge ${user.user_type} px-2 py-1 rounded-full text-xs font-medium`}>
                        {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                      </span>
                    </div>
                    
                    {user.user_type === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors duration-300 py-2"
                        onClick={() => {
                          setOpen(false);
                          setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }, 100);
                        }}
                      >
                        <Shield size={16} className="mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        setOpen(false);
                        // Add settings functionality here
                      }}
                      className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors duration-300 py-2"
                    >
                      <Settings size={16} className="mr-2" />
                      Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setOpen(false);
                      }}
                      className="flex items-center text-gray-700 hover:text-[#90C641] transition-colors duration-300 py-2"
                    >
                      <Settings size={16} className="mr-2" />
                      Change Password
                    </button>
                    
                    <div className="border-t border-gray-200 my-3"></div>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center text-red-600 hover:text-red-700 transition-colors duration-300 font-medium py-2"
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
                    className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] transition-colors duration-300 font-medium shadow-md"
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

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};

export default Navbar;