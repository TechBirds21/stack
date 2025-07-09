import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import PropertyMap from '@/components/PropertyMap';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';

interface Property {
  id: string;
  title: string;
  price: number;
  listing_type: 'SALE' | 'RENT';
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  address: string;
  city: string;
  state: string;
  created_at: string;
  images: string[];
}


const Buy: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .eq('listing_type', 'SALE')
        .not('price', 'is', null); // Ensure price is not null for sale properties
      
      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      
      if (filters.minPrice) {
        query = query.gte('price', parseInt(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        query = query.lte('price', parseInt(filters.maxPrice));
      }
      
      if (filters.bedrooms) {
        query = query.gte('bedrooms', parseInt(filters.bedrooms));
      }
      
      if (filters.bathrooms) {
        query = query.gte('bathrooms', parseInt(filters.bathrooms));
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
          title: 'Beautiful 3BHK Apartment in Prime Location',
          price: 5000000,
          listing_type: 'SALE',
          property_type: 'apartment',
          bedrooms: 3,
          bathrooms: 2,
          area_sqft: 1200,
          address: 'MG Road',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          created_at: '2024-01-15',
          images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg']
        },
        {
          id: '2',
          title: 'Luxury Villa with Garden',
          price: 8500000,
          listing_type: 'SALE',
          property_type: 'villa',
          bedrooms: 4,
          bathrooms: 3,
          area_sqft: 2500,
          address: 'Beach Road',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          created_at: '2024-01-10',
          images: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg']
        },
        {
          id: '3',
          title: 'Modern 2BHK Flat',
          price: 3500000,
          listing_type: 'SALE',
          property_type: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          area_sqft: 950,
          address: 'Dwaraka Nagar',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          created_at: '2024-01-08',
          images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg']
        }
      ];
      setProperties(mockProperties);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (k: string, v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const clearFilters = () => {
    setFilters({
      city: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
    });
    fetchProperties();
  };

  const handlePropertyClick = (propertyId: string) => {
    // Allow viewing property details without authentication
    navigate(`/property/${propertyId}`);
    // Smooth scroll to top with slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <section className="container mx-auto pt-[90px] px-4 pb-8 flex-1 relative z-10">
        <div style={{ paddingTop: '50px' }}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6 rounded-lg mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#061D58] mb-2">
              Find Your Dream Home to Buy
            </h1>
            <p className="text-gray-600 text-lg">
              Browse our extensive collection of premium properties
            </p>
          </div>
        </div>

        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span className="bg-white px-4 py-2 rounded-full shadow">🏠 {properties.length} Properties Available</span>
            <span className="bg-white px-4 py-2 rounded-full shadow">📍 Multiple Locations</span>
            <span className="bg-white px-4 py-2 rounded-full shadow">✅ Verified Listings</span>
          </div>
        </header>

        {/* Filters */}
        <div className="professional-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <input
              placeholder="City"
              value={filters.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="professional-input p-3"
            />
            <select
              value={filters.propertyType}
              onChange={(e) => handleChange('propertyType', e.target.value)}
              className="professional-input p-3"
            >
              <option value="">All Types</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="studio">Studio</option>
            </select>
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              className="professional-input p-3"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="professional-input p-3"
            />
            <select
              value={filters.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="professional-input p-3"
            >
              <option value="">Beds</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
            <select
              value={filters.bathrooms}
              onChange={(e) => handleChange('bathrooms', e.target.value)}
              className="professional-input p-3"
            >
              <option value="">Baths</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={fetchProperties}
                className="professional-button bg-[#90C641] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#7DAF35]"
              >
                <Search size={20} />
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="professional-button bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Clear All
              </button>
            </div>
            <button
              onClick={() => setShowMap((s) => !s)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                showMap
                  ? 'bg-[#90C641] text-white'
                  : 'bg-white text-gray-700 border'
              }`}
            >
              <MapPin size={20} />
              {showMap ? 'Hide Map' : 'Show Map'}
              <ChevronDown
                size={18}
                className={`transition-transform ${
                  showMap ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* List */}
          <div className={`${showMap ? 'lg:w-1/2' : 'w-full'} space-y-6`}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No properties match.</p>
              </div>
            ) : ( 
              <div className={`${showMap ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'}`}>
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className={`professional-card overflow-hidden cursor-pointer card-hover ${
                      showMap ? 'flex' : 'flex flex-col'
                    }`}
                    onClick={() => handlePropertyClick(p.id)}
                  >
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className={`object-cover ${
                        showMap ? 'w-1/3' : 'w-full h-48'
                      }`}
                    />
                    <div className="p-4 flex-1">
                      <h3 className={`font-semibold mb-1 ${showMap ? 'text-lg' : 'text-xl'}`}>
                        {p.title}
                      </h3> 
                      <p className="text-[#90C641] font-bold text-xl mb-2">
                        {formatIndianCurrency(p.price)}
                      </p>
                      <div className={`flex items-center text-sm text-gray-600 gap-4 mb-2 ${showMap ? '' : 'justify-center'}`}>
                        <span className="flex items-center gap-1">
                          <Bed size={14} /> {p.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath size={14} /> {p.bathrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />{' '}
                          {new Date(p.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className={`text-gray-600 text-sm mb-3 flex items-center gap-1 ${showMap ? '' : 'justify-center'}`}>
                        <MapPin size={16} />
                        {p.address}, {p.city}
                      </p>
                      <div className={showMap ? '' : 'text-center'}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handlePropertyClick(p.id);
                          }}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          {showMap && (
            <div className="lg:w-1/2 relative z-0 h-[600px] rounded-lg overflow-hidden">
              <PropertyMap
                filters={{
                  city: filters.city,
                  propertyType: filters.propertyType,
                }}
                onPropertySelect={(p) => handlePropertyClick(p.id)}
                height="100%"
              />
            </div>
          )}
        </div>

        {/* When map is hidden, show additional property stats */}
        {!showMap && properties.length > 0 && (
          <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-[#061D58] mb-6 text-center">Property Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">{properties.length}</div>
                <div className="text-sm text-gray-600">Total Properties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">
                  {formatIndianCurrency(Math.min(...properties.map(p => p.price).filter(Boolean)))}
                </div>
                <div className="text-sm text-gray-600">Starting From</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">
                  {Math.max(...properties.map(p => p.bedrooms).filter(Boolean))}
                </div>
                <div className="text-sm text-gray-600">Max Bedrooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">
                  {[...new Set(properties.map(p => p.city))].length}
                </div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
            </div>
          </div>
        )}
      </section>
        </div>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Buy;