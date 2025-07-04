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
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from '../../components/AuthModal'

interface Property {
  id: string
  title: string
  monthly_rent: number | null
  security_deposit: number | null
  property_type: string
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  address: string
  city: string
  state: string
  available_from?: string | null
  furnishing_status?: string | null
  images: string[]
}

const money = (suffix: string) => (v: number | null = 0) =>
  v == null
    ? '—'
    : v >= 100_000
    ? `₹${(v / 100_000).toFixed(1)}L${suffix}`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(0)}K${suffix}`
    : `₹${v.toLocaleString()}${suffix}`

const formatRent = money('/mo')
const formatDeposit = money('')

const Rent: React.FC = () => {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(true)

  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
    bathrooms: '',
  })

  // Mock rental properties
  const mockProperties: Property[] = [
    {
      id: '1',
      title: 'Fully Furnished 2BHK Apartment',
      monthly_rent: 25000,
      security_deposit: 50000,
      property_type: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      area_sqft: 1100,
      address: 'MVP Colony',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      available_from: '2024-02-01',
      furnishing_status: 'Fully Furnished',
      images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg']
    },
    {
      id: '2',
      title: 'Spacious 3BHK House',
      monthly_rent: 35000,
      security_deposit: 70000,
      property_type: 'house',
      bedrooms: 3,
      bathrooms: 3,
      area_sqft: 1500,
      address: 'Gajuwaka',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      available_from: '2024-01-25',
      furnishing_status: 'Semi Furnished',
      images: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg']
    },
    {
      id: '3',
      title: 'Modern Studio Apartment',
      monthly_rent: 18000,
      security_deposit: 36000,
      property_type: 'studio',
      bedrooms: 1,
      bathrooms: 1,
      area_sqft: 600,
      address: 'Siripuram',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      available_from: '2024-02-15',
      furnishing_status: 'Unfurnished',
      images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg']
    }
  ]

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    setTimeout(() => {
      setProperties(mockProperties)
      setLoading(false)
    }, 1000)
  }

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

  const handlePropertyClick = (propertyId: string) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    window.location.href = `/property/${propertyId}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative z-20">
        <Navbar />
      </div>

      <section className="container mx-auto px-4 pt-[8rem] pb-8 flex-1 relative z-10">
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
              onChange={(e) => handleChange('propertyType', e.target.value)}
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
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No rental properties match.</p>
              </div>
            ) : (
              properties.map((p) => (
                <article
                  key={p.id}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden flex cursor-pointer"
                  onClick={() => handlePropertyClick(p.id)}
                >
                  <img
                    src={p.images[0]}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePropertyClick(p.id)
                      }}
                      className="inline-block bg-[#90C641] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#7DAF35] transition-colors"
                    >
                      View Details
                    </button>
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
                onPropertySelect={(p) => handlePropertyClick(p.id)}
                height="100%"
              />
            </div>
          )}
        </div>
      </section>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}

export default Rent