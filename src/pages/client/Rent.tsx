/* -------------------------------------------------------------------------- */
/*  pages/client/Rent.tsx                                                     */
/* -------------------------------------------------------------------------- */
import React, { useState, useEffect } from 'react'
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyMap from '@/components/PropertyMap'
import { propertiesAPI } from '@/lib/api'

/* -------------------------------- Types ----------------------------------- */
interface Property {
  id: string
  title: string
  monthly_rent: number | null
  security_deposit: number | null
  property_type: string
  bedrooms: number | null
  bathrooms: number | null
  balcony?: number | null
  area_sqft: number | null
  address: string
  city: string
  state: string
  available_from?: string | null
  furnishing_status?: string | null
  latitude?: number | null
  longitude?: number | null
  images: string[] | null | string
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const getPropertyImage = (p: Property) => {
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images[0]
  }
  if (typeof p.images === 'string') {
    try {
      const arr = JSON.parse(p.images)
      if (Array.isArray(arr) && arr.length) return arr[0]
    } catch {}
  }
  return 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'
}

const money =
  (suffix: string) =>
  (v: number | null = 0) =>
    v == null
      ? '—'
      : v >= 100_000
      ? `₹${(v / 100_000).toFixed(1)}L${suffix}`
      : v >= 1_000
      ? `₹${(v / 1_000).toFixed(0)}K${suffix}`
      : `₹${v.toLocaleString()}${suffix}`

const formatRent = money('/mo')
const formatDeposit = money('')

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const Rent: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(true) // map visible by default

  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
    bathrooms: '',
  })

  /* ─── Fetch data ────────────────────────────────────────────────────────── */
  const fetchProperties = async () => {
    setLoading(true)
    try {
      const data = await propertiesAPI.list({
        listing_type: 'RENT',
        city: filters.city || undefined,
        property_type: filters.propertyType || undefined,
        min_price: filters.minRent || undefined,
        max_price: filters.maxRent || undefined,
        bedrooms: filters.bedrooms || undefined,
        bathrooms: filters.bathrooms || undefined,
      })
      setProperties(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (k: string, v: string) =>
    setFilters((f) => ({ ...f, [k]: v }))

  const clearFilters = () => {
    setFilters({
      city: '',
      propertyType: '',
      minRent: '',
      maxRent: '',
      bedrooms: '',
      bathrooms: '',
    })
    fetchProperties()
  }

  const list = Array.isArray(properties) ? properties : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar always on top */}
      <div className="relative z-20">
        <Navbar />
      </div>

      <section className="container mx-auto px-4 pt-[8rem] pb-8 flex-1 relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#061D58] mb-2">
            Find Your Perfect Home to Rent
          </h1>
          <p className="text-gray-600 text-lg">
            Discover premium rental properties across India
          </p>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-4">
            <input
              placeholder="City"
              value={filters.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
            <select
              value={filters.propertyType}
              onChange={(e) =>
                handleChange('propertyType', e.target.value)
              }
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            >
              <option value="">Property Type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
            </select>
            <input
              type="number"
              placeholder="Min Rent"
              value={filters.minRent}
              onChange={(e) => handleChange('minRent', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
            <input
              type="number"
              placeholder="Max Rent"
              value={filters.maxRent}
              onChange={(e) => handleChange('maxRent', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            />
            <select
              value={filters.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-[#90C641]"
            >
              <option value="">Bedrooms</option>
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
              <option value="">Bathrooms</option>
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
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] flex items-center gap-2"
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
                <p className="text-gray-600">No rental properties match.</p>
              </div>
            ) : (
              list.map((p) => (
                <article
                  key={p.id}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden flex"
                >
                  <img
                    src={getPropertyImage(p)}
                    alt={p.title}
                    className="w-1/3 object-cover"
                  />
                  <div className="p-4 flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {p.title}
                    </h3>
                    <p className="text-[#90C641] font-bold text-xl mb-2">
                      {formatRent(p.monthly_rent)}
                    </p>
                    <p className="text-gray-600 mb-4 text-sm">
                      Deposit: {formatDeposit(p.security_deposit)}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 gap-4 mb-2">
                      <span className="flex items-center gap-1">
                        <Bed size={14} /> {p.bedrooms ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={14} /> {p.bathrooms ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />{' '}
                        {p.available_from
                          ? new Date(p.available_from).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Immediately'}
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
                </article>
              ))
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
  )
}

export default Rent
