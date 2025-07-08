import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRight,
  Bed,
  Bath,
  Square,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollingBanner from '@/components/ScrollingBanner';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';

interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalInquiries: number;
  recentActivity: any[];
}

interface Property {
  id: string;
  title: string;
  price: number | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [filters, setFilters] = useState({
    keyword: '',
    propertyType: '',
    city: '',
  });

  const slides = [
    {
      title: ['No Brokers,', 'Connect buyers', 'and Sellers'],
      subtitle: 'No negotiation needed',
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    },
    {
      title: "Discover a place you'll love to live",
      subtitle: 'Find your perfect home today',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
    },
  ];

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      let stats: DashboardStats = {
        totalProperties: 0,
        totalBookings: 0,
        totalInquiries: 0,
        recentActivity: []
      };

      if (user.user_type === 'seller') {
        // Fetch seller's properties and related stats
        const { data: properties } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);
        
        stats.totalProperties = properties?.length || 0;

        // Get bookings for seller's properties
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, properties(*)')
          .in('property_id', properties?.map(p => p.id) || []);
        
        stats.totalBookings = bookings?.length || 0;

        // Get inquiries for seller's properties
        const { data: inquiries } = await supabase
          .from('inquiries')
          .select('*, properties(*)')
          .in('property_id', properties?.map(p => p.id) || []);
        
        stats.totalInquiries = inquiries?.length || 0;
        stats.recentActivity = [...(bookings || []), ...(inquiries || [])].slice(0, 5);
      } else if (user.user_type === 'buyer') {
        // Fetch buyer's bookings and inquiries
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, properties(*)')
          .eq('user_id', user.id);
        
        stats.totalBookings = bookings?.length || 0;

        const { data: inquiries } = await supabase
          .from('inquiries')
          .select('*, properties(*)')
          .eq('user_id', user.id);
        
        stats.totalInquiries = inquiries?.length || 0;
        stats.recentActivity = [...(bookings || []), ...(inquiries || [])].slice(0, 5);
      }

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleSearch = () => {
    // Redirect to buy page with search parameters
    navigate(`/buy?keyword=${filters.keyword}&propertyType=${filters.propertyType}`);
  };

  const nextSlide = () => setCurrentSlide(s => (s + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(s => (s - 1 + slides.length) % slides.length);

  const handlePropertyClick = (propertyId: string) => {
    // Allow viewing property details without authentication
    navigate(`/property/${propertyId}`);
  };

  // Render user-specific dashboard
  const renderUserDashboard = () => {
    if (!user || !dashboardStats) return null;

    return (
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#061D58] mb-8">
            Welcome back, {user.first_name}! 👋
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {user.user_type === 'seller' && (
              <>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#90C641]">{dashboardStats.totalProperties}</div>
                  <div className="dashboard-stat-label">My Properties</div>
                </div>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#3B5998]">{dashboardStats.totalBookings}</div>
                  <div className="dashboard-stat-label">Tour Requests</div>
                </div>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#FF6B6B]">{dashboardStats.totalInquiries}</div>
                  <div className="dashboard-stat-label">Inquiries</div>
                </div>
              </>
            )}
            
            {user.user_type === 'buyer' && (
              <>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#3B5998]">{dashboardStats.totalBookings}</div>
                  <div className="dashboard-stat-label">My Bookings</div>
                </div>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#FF6B6B]">{dashboardStats.totalInquiries}</div>
                  <div className="dashboard-stat-label">My Inquiries</div>
                </div>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#90C641]">0</div>
                  <div className="dashboard-stat-label">Saved Properties</div>
                </div>
              </>
            )}
            
            {user.user_type === 'agent' && (
              <>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#90C641]">12</div>
                  <div className="dashboard-stat-label">Active Listings</div>
                </div>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#3B5998]">8</div>
                  <div className="dashboard-stat-label">Clients</div>
                </div>
                <div className="dashboard-stat">
                  <div className="dashboard-stat-value text-[#FF6B6B]">₹2.5L</div>
                  <div className="dashboard-stat-label">This Month Commission</div>
                </div>
              </>
            )}
          </div>
          
          {/* Quick Actions for User Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.user_type === 'seller' && (
              <>
                <Link
                  to="/add-property"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Add Property</div>
                  <div className="text-sm opacity-90">List a new property</div>
                </Link>
                <Link
                  to="/my-properties"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">My Properties</div>
                  <div className="text-sm opacity-90">Manage listings</div>
                </Link>
              </>
            )}
            
            {user.user_type === 'buyer' && (
              <>
                <Link
                  to="/buy"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Browse Properties</div>
                  <div className="text-sm opacity-90">Find your dream home</div>
                </Link>
                <Link
                  to="/saved-properties"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">Saved Properties</div>
                  <div className="text-sm opacity-90">View favorites</div>
                </Link>
              </>
            )}
            
            {user.user_type === 'agent' && (
              <>
                <Link
                  to="/agent/dashboard"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">Agent Dashboard</div>
                  <div className="text-sm opacity-90">View assignments & performance</div>
                </Link>
                <Link
                  to="/agent/assignments"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">My Assignments</div>
                  <div className="text-sm opacity-90">Handle customer inquiries</div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="overflow-x-hidden">
      {/* Scrolling Banner - Above Navbar */}
      <div className="scrolling-banner bg-gradient-to-r from-[#90C641] via-[#7DAF35] to-[#90C641] text-white py-2 overflow-hidden relative z-50 shadow-sm">
        <div className="animate-scroll whitespace-nowrap">
          {/* First set of messages */}
          {[
            "🏠 WE ARE HIRING REAL ESTATE AGENTS - QUALIFICATION: MINIMUM GRADUATE DEGREE REQUIRED - APPLY NOW!",
            "💼 JOIN OUR TEAM OF 500+ VERIFIED REAL ESTATE PROFESSIONALS ACROSS INDIA - UNLIMITED EARNING POTENTIAL",
            "📈 GROW YOUR CAREER WITH HOME & OWN - INDIA'S FASTEST GROWING PROPERTY PLATFORM - 10X YOUR INCOME",
            "🎯 EXCELLENT COMMISSION STRUCTURE: 2% ON SALES + 1 MONTH RENT ON RENTALS - HIGHEST IN INDUSTRY",
            "🌟 COMPLETE TRAINING AND SUPPORT PROVIDED FOR NEW AGENTS - NO EXPERIENCE REQUIRED - START TODAY",
            "📞 CONTACT US FOR AGENT OPPORTUNITIES: CAREERS@HOMEANDOWN.COM | 1800-123-4567 - CALL NOW",
            "🚀 BE PART OF INDIA'S MOST TRUSTED PROPERTY PLATFORM WITH 10,000+ SATISFIED CUSTOMERS - JOIN SUCCESS"
          ].map((message, index) => (
            <span key={`first-${index}`} className="inline-block mx-6 text-xs font-medium tracking-wide">
              {message}
            </span>
          ))}
          {/* Duplicate set for seamless loop */}
          {[
            "🏠 WE ARE HIRING REAL ESTATE AGENTS - QUALIFICATION: MINIMUM GRADUATE DEGREE REQUIRED - APPLY NOW!",
            "💼 JOIN OUR TEAM OF 500+ VERIFIED REAL ESTATE PROFESSIONALS ACROSS INDIA - UNLIMITED EARNING POTENTIAL",
            "📈 GROW YOUR CAREER WITH HOME & OWN - INDIA'S FASTEST GROWING PROPERTY PLATFORM - 10X YOUR INCOME",
            "🎯 EXCELLENT COMMISSION STRUCTURE: 2% ON SALES + 1 MONTH RENT ON RENTALS - HIGHEST IN INDUSTRY",
            "🌟 COMPLETE TRAINING AND SUPPORT PROVIDED FOR NEW AGENTS - NO EXPERIENCE REQUIRED - START TODAY",
            "📞 CONTACT US FOR AGENT OPPORTUNITIES: CAREERS@HOMEANDOWN.COM | 1800-123-4567 - CALL NOW",
            "🚀 BE PART OF INDIA'S MOST TRUSTED PROPERTY PLATFORM WITH 10,000+ SATISFIED CUSTOMERS - JOIN SUCCESS"
          ].map((message, index) => (
            <span key={`second-${index}`} className="inline-block mx-6 text-xs font-medium tracking-wide">
              {message}
            </span>
          ))}
        </div>
      </div>
      
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen pt-[90px]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            {currentSlide === 0 ? (
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-2 text-white fade-in">
                <span>{slides[0].title[0]} </span>
                <span className="text-[#90C641]">{slides[0].title[1]} </span>
                <span>{slides[0].title[2]}</span>
              </h1>
            ) : (
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-2 fade-in">
                {slides[currentSlide].title}
              </h1>
            )}
            <p className="text-xl md:text-2xl lg:text-3xl text-[#90C641] font-semibold slide-up">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 fade-in">
            <Link
              to="/buy"
              className="professional-button bg-[#90C641] text-white px-8 md:px-10 py-3 md:py-4 rounded-xl hover:bg-[#7DAF35] font-semibold text-center"
            >
              Buy
            </Link>
            <Link
              to="/sell"
              className="professional-button bg-white/20 backdrop-blur-md text-white px-8 md:px-10 py-3 md:py-4 rounded-xl hover:bg-white/30 font-semibold text-center"
            >
              Sell
            </Link>
          </div>

          {/* Search bar */}
          <div className="mt-10 w-full max-w-4xl slide-up">
            <div className="professional-card bg-white/95 backdrop-blur-md rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-xl">
              <input
                type="text"
                placeholder="Enter keyword"
                value={filters.keyword}
                onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                className="professional-input flex-1 p-3 md:p-4 rounded-xl bg-gray-50 text-gray-800 text-sm md:text-base"
              />
              <select
                value={filters.propertyType}
                onChange={e => setFilters({ ...filters, propertyType: e.target.value })}
                className="professional-input w-full md:w-48 p-3 md:p-4 rounded-xl bg-gray-50 text-gray-800 text-sm md:text-base"
              >
                <option value="">All types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="professional-button bg-[#90C641] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-[#7DAF35] flex items-center justify-center gap-2 font-semibold disabled:opacity-60 text-sm md:text-base"
              >
                <Search size={18} className="md:w-5 md:h-5" /> Search
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 p-2 md:p-4 rounded-full text-white hover:bg-[#90C641] transition-all duration-200"
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 p-2 md:p-4 rounded-full text-white hover:bg-[#90C641] transition-all duration-200"
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>
      </section>

      {/* User Dashboard */}
      {renderUserDashboard()}

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Home;