/* -------------------------------------------------------------------------- */
/*  pages/client/Buy.tsx                                                      */
/* -------------------------------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyMap from '@/components/PropertyMap';
import { propertiesAPI } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
interface RawImage {
  id: string;
  image_url: string;
  is_primary: boolean | null;
}
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
  balcony?: number;
  possession?: string;
  posted_date?: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  property_images: RawImage[] | string | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const getThumb = (p: Property) => {
  const imgs: RawImage[] =
    typeof p.property_images === 'string'
      ? JSON.parse(p.property_images)
      : (p.property_images as RawImage[]);
  const primary = imgs?.find((img) => img.is_primary)?.image_url;
  return (
    primary ??
    imgs?.[0]?.image_url ??
    'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'
  );
};

const formatPrice = (v = 0) =>
  v >= 1_000_000
    ? `₹${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v.toLocaleString()}`;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const Buy: React.FC = () => {
  // show map by default
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

  /* ─── Fetch data ────────────────────────────────────────────────────────── */
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await propertiesAPI.list({
        listing_type: 'SALE',
        city: filters.city || undefined,
        property_type: filters.propertyType || undefined,
        min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
        bathrooms: filters.bathrooms ? Number(filters.bathrooms) : undefined,
      });
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /* ─── Data for render ───────────────────────────────────────────────────── */
  const list = Array.isArray(properties) ? properties : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ensure Navbar is on top */}
      <div className="relative z-20">
        <Navbar />
      </div>

      <section className="container mx-auto pt-[8rem] px-4 pb-8 flex-1 relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#061D58] mb-2">
            Find Your Dream Home to Buy
          </h1>
          <p className="text-gray-600 text-lg">
            Browse our extensive collection of properties
          </p>
        </header>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <input
              placeholder="City"
              value={filters.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
            <select
              value={filters.propertyType}
              onChange={(e) => handleChange('propertyType', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
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
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
            <select
              value={filters.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
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
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
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
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#7DAF35]"
              >
                <Search size={20} />
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
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
          <div className="lg:w-1/2 space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No properties match.</p>
              </div>
            ) : (
              list.map((p) => {
                const thumb = getThumb(p as Property);
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden flex"
                  >
                    <img
                      src={thumb}
                      alt={p.title}
                      className="w-1/3 object-cover"
                    />
                    <div className="p-4 flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {p.title}
                      </h3>
                      <p className="text-[#90C641] font-bold text-xl mb-2">
                        {formatPrice(p.price)}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                        <span className="flex items-center gap-1">
                          <Bed size={14} /> {p.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath size={14} /> {p.bathrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />{' '}
                          {new Date(
                            p.posted_date || p.created_at
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 flex items-center gap-1">
                        <MapPin size={16} />
                        {p.address}, {p.city}
                      </p>
                      <Link
                        to={`/property/${p.id}`}
                        className="inline-block bg-[#90C641] text-white px-4 py-2 rounded-lg text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })
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
                onPropertySelect={(p) =>
                  window.location.assign(`/property/${p.id}`)
                }
                height="100%"
              />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Buy;
