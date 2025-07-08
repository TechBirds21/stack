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
import PropertyMap from '@/components/PropertyMap';
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [featured, setFeatured] = useState<Property[]>([]);
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
    refresh();
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

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchFeatured(), fetchAll()]);
    setLoading(false);
  };

  const fetchAll = async () => {
    try {
      // Build query
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active');
      
      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      
      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      
      // Fallback to mock data
      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'Beautiful 3BHK Apartment',
          price: 5000000,
          property_type: 'apartment',
          bedrooms: 3,
          bathrooms: 2,
          area_sqft: 1200,
          address: 'MG Road',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          latitude: 17.6868,
          longitude: 83.2185,
          images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg']
        },
        {
          id: '2',
          title: 'Luxury Villa with Garden',
          price: 8500000,
          property_type: 'villa',
          bedrooms: 4,
          bathrooms: 3,
          area_sqft: 2500,
          address: 'Beach Road',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          latitude: 17.7231,
          longitude: 83.3012,
          images: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg']
        },
        {
          id: '3',
          title: 'Modern 2BHK Flat',
          price: 3500000,
          property_type: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          area_sqft: 950,
          address: 'Dwaraka Nagar',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          latitude: 17.7326,
          longitude: 83.3332,
          images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg']
        }
      ];
      setProperties(mockProperties);
    }
  };

  const fetchFeatured = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .eq('featured', true)
        .limit(3);
      
      if (error) {
        throw error;
      }
      
      setFeatured(data || []);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      
      // Fallback to mock data
      const mockFeatured = [
        {
          id: '1',
          title: 'Beautiful 3BHK Apartment',
          price: 5000000,
          property_type: 'apartment',
          bedrooms: 3,
          bathrooms: 2,
          area_sqft: 1200,
          address: 'MG Road',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          latitude: 17.6868,
          longitude: 83.2185,
          images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg']
        },
        {
          id: '2',
          title: 'Luxury Villa with Garden',
          price: 8500000,
          property_type: 'villa',
          bedrooms: 4,
          bathrooms: 3,
          area_sqft: 2500,
          address: 'Beach Road',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          latitude: 17.7231,
          longitude: 83.3012,
          images: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg']
        },
        {
          id: '3',
          title: 'Modern 2BHK Flat',
          price: 3500000,
          property_type: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          area_sqft: 950,
          address: 'Dwaraka Nagar',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          latitude: 17.7326,
          longitude: 83.3332,
          images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg']
        }
      ];
      setFeatured(mockFeatured);
    }
  };

  const handleSearch = () => {
    fetchAll();
  };

  const nextSlide = () => setCurrentSlide(s => (s + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(s => (s - 1 + slides.length) % slides.length);

  const handlePropertyClick = (propertyId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
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
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#90C641] mb-2">{dashboardStats.totalProperties}</h3>
                  <p className="text-gray-600">My Properties</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#3B5998] mb-2">{dashboardStats.totalBookings}</h3>
                  <p className="text-gray-600">Tour Requests</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#FF6B6B] mb-2">{dashboardStats.totalInquiries}</h3>
                  <p className="text-gray-600">Inquiries</p>
                </div>
              </>
            )}
            
            {user.user_type === 'buyer' && (
              <>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#3B5998] mb-2">{dashboardStats.totalBookings}</h3>
                  <p className="text-gray-600">My Bookings</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#FF6B6B] mb-2">{dashboardStats.totalInquiries}</h3>
                  <p className="text-gray-600">My Inquiries</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#90C641] mb-2">0</h3>
                  <p className="text-gray-600">Saved Properties</p>
                </div>
              </>
            )}
            
            {user.user_type === 'agent' && (
              <>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#90C641] mb-2">12</h3>
                  <p className="text-gray-600">Active Listings</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#3B5998] mb-2">8</h3>
                  <p className="text-gray-600">Clients</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <h3 className="text-3xl font-bold text-[#FF6B6B] mb-2">₹2.5L</h3>
                  <p className="text-gray-600">This Month Commission</p>
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
                  to="/agent-listings"
                  className="bg-[#90C641] text-white p-4 rounded-lg text-center hover:bg-[#7DAF35] transition-colors"
                >
                  <div className="text-lg font-semibold">My Listings</div>
                  <div className="text-sm opacity-90">Manage properties</div>
                </Link>
                <Link
                  to="/clients"
                  className="bg-[#3B5998] text-white p-4 rounded-lg text-center hover:bg-[#2d4373] transition-colors"
                >
                  <div className="text-lg font-semibold">Clients</div>
                  <div className="text-sm opacity-90">Manage relationships</div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      <ScrollingBanner />
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen mt-[60px]">
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

      {/* FEATURED */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#061D58] mb-2">
            Featured Properties
          </h2>
          <p className="text-center text-gray-600 mb-8 md:mb-12">
            Discover your dream home today!
          </p>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : featured.length === 0 ? (
            <p className="text-center text-gray-500">No featured listings right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(p => (
                <article
                  key={p.id}
                  className="professional-card cursor-pointer overflow-hidden"
                  onClick={() => handlePropertyClick(p.id)}
                >
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-semibold mb-2">{p.title}</h3>
                    <p className="text-[#90C641] font-bold text-xl md:text-2xl mb-2">
                      {formatIndianCurrency(p.price)}
                    </p>
                    <div className="flex items-center gap-4 text-gray-600 mb-2 text-sm md:text-base">
                      <span className="flex items-center gap-1">
                        <Bed size={16} /> {p.bedrooms ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={16} /> {p.bathrooms ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Square size={16} /> {p.area_sqft ?? '—'} sqft
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 flex items-center gap-1 text-sm md:text-base">
                      <MapPin size={16} />
                      {p.address}, {p.city}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyClick(p.id);
                      }}
                      className="inline-block bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors text-sm md:text-base"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MAP EXPLORE */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#061D58] mb-2">
            Explore Properties on Map
          </h2>
          <p className="text-center text-gray-600 mb-8 md:mb-12">
            Find properties in your preferred location
          </p>

          <div className="h-64 md:h-96 rounded-lg overflow-hidden">
            <PropertyMap
              filters={{
                city: filters.city,
                propertyType: filters.propertyType,
              }}
              onPropertySelect={p => handlePropertyClick(p.id)}
            />
          </div>
        </div>
      </section>

      {/* ALL PROPERTIES */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#061D58] mb-2">
            All Properties
          </h2>
          <p className="text-center text-gray-600 mb-8 md:mb-12">
            Browse our complete property collection
          </p>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : properties.length === 0 ? (
            <p className="text-center text-gray-500">No properties match your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(p => (
                <article
                  key={p.id}
                  className="professional-card cursor-pointer overflow-hidden"
                  onClick={() => handlePropertyClick(p.id)}
                >
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-semibold mb-2">{p.title}</h3>
                    <p className="text-[#90C641] font-bold text-xl md:text-2xl mb-2">
                      {formatIndianCurrency(p.price)}
                    </p>
                    <div className="flex items-center gap-4 text-gray-600 mb-2 text-sm md:text-base">
                      <span className="flex items-center gap-1">
                        <Bed size={16} /> {p.bedrooms ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={16} /> {p.bathrooms ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Square size={16} /> {p.area_sqft ?? '—'} sqft
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 flex items-center gap-1 text-sm md:text-base">
                      <MapPin size={16} />
                      {p.address}, {p.city}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyClick(p.id);
                      }}
                      className="inline-block bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors text-sm md:text-base"
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/buy"
              className="professional-button bg-[#90C641] text-white px-6 md:px-8 py-3 rounded-lg hover:bg-[#7DAF35] inline-flex items-center gap-2 text-sm md:text-base"
            >
              View All Properties <ArrowRight size={18} className="md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Home;