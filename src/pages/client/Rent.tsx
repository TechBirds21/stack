import React, { useState, useEffect } from 'react'
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyMap from '@/components/PropertyMap'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/lib/supabase'
import { formatRent, formatDeposit } from '@/utils/currency'

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

const Rent: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
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

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      // Build query
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .eq('listing_type', 'RENT')
        .not('monthly_rent', 'is', null) // Ensure monthly_rent is not null for rental properties
      
      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`)
      }
      
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
      }
      
      if (filters.minRent) {
        query = query.gte('monthly_rent', parseInt(filters.minRent))
      }
      
      if (filters.maxRent) {
        query = query.lte('monthly_rent', parseInt(filters.maxRent))
      }
      
      if (filters.bedrooms) {
        query = query.gte('bedrooms', parseInt(filters.bedrooms))
      }
      
      if (filters.bathrooms) {
        query = query.gte('bathrooms', parseInt(filters.bathrooms))
      }
      
      // Execute query
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching rental properties:', error)
      
      // Fallback to mock data
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
      setProperties(mockProperties)
    } finally {
      setLoading(false)
    }
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
    navigate(`/property/${propertyId}`)
  }

  return (
    <div className="page-content min-h-screen bg-gray-50 flex flex-col">
      <div className="relative z-20">
        <Navbar />
      </div>

      <section className="container mx-auto px-4 pb-8 flex-1 relative z-10">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 py-6 rounded-lg mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#061D58] mb-2">
              Find Your Perfect Home to Rent
            </h1>
            <p className="text-gray-600 text-lg">
              Discover premium rental properties across India
            </p>
          </div>
        </div>

        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span className="bg-white px-4 py-2 rounded-full shadow">🏠 {properties.length} Rental Properties</span>
            <span className="bg-white px-4 py-2 rounded-full shadow">📍 Prime Locations</span>
            <span className="bg-white px-4 py-2 rounded-full shadow">✅ Ready to Move</span>
          </div>
        </header>

        {/* Filters */}
        <div className="professional-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-4">
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
              className="professional-input p-3"
            />
            <input
              type="number"
              placeholder="Max Rent"
              value={filters.maxRent}
              onChange={(e) => handleChange('maxRent', e.target.value)}
              className="professional-input p-3"
            />
            <select
              value={filters.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="professional-input p-3"
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
              className="professional-input p-3"
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
                className="professional-button bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] flex items-center gap-2"
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
                <p className="text-gray-600">No rental properties match.</p>
              </div>
            ) : (
              <div className={`${showMap ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'}`}>
                {properties.map((p) => (
                  <article
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
                        {formatRent(p.monthly_rent)}
                      </p>
                      <p className="text-gray-600 mb-4 text-sm">
                        Deposit: {formatDeposit(p.security_deposit)}
                      </p>
                      <div className={`flex items-center text-sm text-gray-600 gap-4 mb-2 ${showMap ? '' : 'justify-center'}`}>
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
                      <p className={`text-gray-600 text-sm mb-3 flex items-center gap-1 ${showMap ? '' : 'justify-center'}`}>
                        <MapPin size={16} />
                        {p.address}, {p.city}
                      </p>
                      <div className={showMap ? '' : 'text-center'}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePropertyClick(p.id)
                          }}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </article>
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

        {/* When map is hidden, show additional rental stats */}
        {!showMap && properties.length > 0 && (
          <div className="mt-12 bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-[#061D58] mb-6 text-center">Rental Market Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">{properties.length}</div>
                <div className="text-sm text-gray-600">Available Rentals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">
                  {formatRent(Math.min(...properties.map(p => p.monthly_rent).filter(Boolean)))}
                </div>
                <div className="text-sm text-gray-600">Starting Rent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">
                  {properties.filter(p => p.furnishing_status === 'Fully Furnished').length}
                </div>
                <div className="text-sm text-gray-600">Fully Furnished</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#90C641]">
                  {properties.filter(p => p.available_from && new Date(p.available_from) <= new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Ready to Move</div>
              </div>
            </div>
          </div>
        )}
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