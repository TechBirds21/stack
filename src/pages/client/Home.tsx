/* -------------------------------------------------------------------------- */
/*  Home.tsx – API-driven, no hard-coded listings                             */
/* -------------------------------------------------------------------------- */
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
import { propertiesAPI } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                           */
/* -------------------------------------------------------------------------- */
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

const formatPrice = (n: number | null) => {
  if (!n) return '—';
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const getPrimaryImage = (p: Property) =>
  Array.isArray(p.images) && p.images.length > 0
    ? p.images[0]
    : 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg';

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    keyword: '',
    propertyType: '',
    city: '',
  });

  const navigate = useNavigate();

  /* --------------------------- Hero slides ------------------------------ */
  const slides = [
    {
      title: ['No Brokers,', 'Connect buyers', 'and Sellers'],
      subtitle: 'No negotiation needed',
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    },
    {
      title: "Discover a place you'll love to live",
      subtitle: 'Find your perfect home today',
      image: '/images/home.jpg',
    },
  ];

  /* --------------------------- Data fetch ------------------------------ */
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unwrap = <T,>(resp: any): T[] => {
    if (Array.isArray(resp)) return resp;
    if (resp && Array.isArray(resp.data)) return resp.data;
    return [];
  };

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchFeatured(), fetchAll()]);
    setLoading(false);
  };

  const fetchAll = async () => {
    const q: Record<string, string> = { status: 'active' };
    if (filters.city) q.city = filters.city;
    if (filters.propertyType) q.property_type = filters.propertyType;
    if (filters.keyword) q.search = filters.keyword;

    try {
      const data = await propertiesAPI.list(q);
      setProperties(unwrap<Property>(data));
    } catch (err) {
      console.error('fetchAll:', err);
      setProperties([]);
    }
  };

  const fetchFeatured = async () => {
    try {
      const data = await propertiesAPI.list({
        status: 'active',
        featured: 'true',
        limit: '3',
      });
      setFeatured(unwrap<Property>(data));
    } catch (err) {
      console.error('fetchFeatured:', err);
      setFeatured([]);
    }
  };

  const handleSearch = () => void fetchAll();
  const nextSlide  = () => setCurrentSlide(s => (s + 1) % slides.length);
  const prevSlide  = () => setCurrentSlide(s => (s - 1 + slides.length) % slides.length);

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            {currentSlide === 0 ? (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2 text-white">
                <span>{slides[0].title[0]} </span>
                <span className="text-[#90C641]">{slides[0].title[1]} </span>
                <span>{slides[0].title[2]}</span>
              </h1>
            ) : (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-2">
                {slides[currentSlide].title}
              </h1>
            )}
            <p className="text-2xl md:text-3xl text-[#90C641] font-semibold">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-4 mt-8">
            <Link
              to="/buy"
              className="bg-[#90C641] text-white px-10 py-4 rounded-xl hover:bg-[#7DAF35] transform font-semibold"
            >
              Buy
            </Link>
            <Link
              to="/sell"
              className="bg-white/20 backdrop-blur-md text-white px-10 py-4 rounded-xl hover:bg-white/30 transform font-semibold"
            >
              Sell
            </Link>
          </div>

          {/* Search bar */}
          <div className="mt-10 w-full max-w-4xl">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex gap-3 shadow-xl">
              <input
                type="text"
                placeholder="Enter keyword"
                value={filters.keyword}
                onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                className="flex-1 p-4 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-[#90C641]"
              />
              <select
                value={filters.propertyType}
                onChange={e => setFilters({ ...filters, propertyType: e.target.value })}
                className="w-48 p-4 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-[#90C641]"
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
                className="bg-[#90C641] text-white px-8 py-4 rounded-xl hover:bg-[#7DAF35] transform flex items-center gap-2 font-semibold disabled:opacity-60"
              >
                <Search size={20} /> Search
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 p-4 rounded-full text-white hover:bg-[#90C641] transform"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 p-4 rounded-full text-white hover:bg-[#90C641] transform"
        >
          <ChevronRight size={24} />
        </button>
      </section>

      {/* FEATURED */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#061D58] mb-2">
            Featured Properties
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Discover your dream home today!
          </p>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : featured.length === 0 ? (
            <p className="text-center text-gray-500">No featured listings right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {featured.map(p => (
                <article
                  key={p.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <img
                    src={getPrimaryImage(p)}
                    alt={p.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                    <p className="text-[#90C641] font-bold text-2xl mb-2">
                      {formatPrice(p.price)}
                    </p>
                    <div className="flex items-center gap-4 text-gray-600 mb-2">
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
                    <p className="text-gray-600 mb-4 flex items-center gap-1">
                      <MapPin size={16} />
                      {p.address}, {p.city}
                    </p>
                    <Link
                      to={`/property/${p.id}`}
                      className="inline-block bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MAP EXPLORE */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#061D58] mb-2">
            Explore Properties on Map
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Find properties in your preferred location
          </p>

          <PropertyMap
            filters={{
              city: filters.city,
              propertyType: filters.propertyType,
            }}
            onPropertySelect={p => navigate(`/property/${p.id}`)}
          />
        </div>
      </section>

      {/* ALL PROPERTIES */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#061D58] mb-2">
            All Properties
          </h2>
          <p className="text-center text-gray-600 mb-12">
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
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <img
                    src={getPrimaryImage(p)}
                    alt={p.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                    <p className="text-[#90C641] font-bold text-2xl mb-2">
                      {formatPrice(p.price)}
                    </p>
                    <div className="flex items-center gap-4 text-gray-600 mb-2">
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
                    <p className="text-gray-600 mb-4 flex items-center gap-1">
                      <MapPin size={16} />
                      {p.address}, {p.city}
                    </p>
                    <Link
                      to={`/property/${p.id}`}
                      className="inline-block bg-[#90C641] text-white px-4 py-2 rounded-lg hover:bg-[#7DAF35] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/buy"
              className="bg-[#90C641] text-white px-8 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors inline-flex items-center gap-2"
            >
              View All Properties <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* STATIC MARKETING */}
      {/* …unchanged… */}

      <Footer />
    </div>
  );
};

export default Home;
