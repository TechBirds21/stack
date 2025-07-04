import React, { useState, useEffect } from 'react'
import { MapPin, Phone, Mail, Star, Shield, Award } from 'lucide-react'
import { agentsAPI } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

interface Agent {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  agency: string
  experience: string
  profile_image_url: string
  license_number: string
  verification_status: string
}

const Agents = () => {
  const { user, profile } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: '',
    experience: '',
    agency: ''
  })

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const data = await agentsAPI.getAll({
        ...filters,
        verification_status: 'verified' // Only show verified agents
      })
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchAgents()
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      experience: '',
      agency: ''
    })
    setTimeout(() => fetchAgents(), 100)
  }

  // Check if user is an agent
  const isAgent = profile?.user_type === 'agent'

  // If user is not logged in or not an agent, show access restricted message
  if (!user || !isAgent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="pt-[8rem] pb-8">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
              <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h1>
              <p className="text-gray-600 mb-6">
                This page is only accessible to verified real estate agents. 
                {!user ? ' Please sign in with an agent account to view agent profiles.' : ' Your account type does not have access to this section.'}
              </p>
              {!user && (
                <p className="text-sm text-gray-500">
                  Don't have an agent account? Sign up as an agent to get verified and access exclusive features.
                </p>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-[8rem] pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#061D58] mb-4">Agent Network</h1>
            <p className="text-gray-600 text-lg">Connect with verified real estate professionals in your network</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <Shield size={16} />
              <span className="text-sm font-medium">Verified Agent Access</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by city"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
              />
              <select
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
              >
                <option value="">Experience Level</option>
                <option value="1">1-2 years</option>
                <option value="3">3-5 years</option>
                <option value="5">5-10 years</option>
                <option value="10">10+ years</option>
              </select>
              <input
                type="text"
                placeholder="Search by agency"
                value={filters.agency}
                onChange={(e) => handleFilterChange('agency', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={applyFilters}
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {loading ? 'Loading...' : `${agents.length} Verified Agents`}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90C641]"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No verified agents found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <img 
                        src={agent.profile_image_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'} 
                        alt={`${agent.first_name} ${agent.last_name}`} 
                        className="w-16 h-16 rounded-full object-cover mr-4"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {agent.first_name} {agent.last_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill="currentColor" />
                            ))}
                          </div>
                          <span className="text-gray-600 text-sm">(4.8)</span>
                          {agent.verification_status === 'verified' && (
                            <Shield size={14} className="text-green-500" title="Verified Agent" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {agent.agency && (
                      <div className="mb-3 flex items-center gap-2">
                        <Award size={16} className="text-[#90C641]" />
                        <span className="text-gray-700 font-medium">{agent.agency}</span>
                      </div>
                    )}
                    
                    {agent.experience && (
                      <div className="mb-3">
                        <span className="text-gray-600">
                          <strong>Experience:</strong> {agent.experience}
                        </span>
                      </div>
                    )}
                    
                    {agent.license_number && (
                      <div className="mb-4">
                        <span className="text-gray-600 text-sm">
                          <strong>License:</strong> {agent.license_number}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Mail size={16} className="mr-2 text-[#90C641]" />
                        <span className="text-sm">{agent.email}</span>
                      </div>
                      {agent.phone_number && (
                        <div className="flex items-center text-gray-600">
                          <Phone size={16} className="mr-2 text-[#90C641]" />
                          <span className="text-sm">{agent.phone_number}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <a
                        href={`mailto:${agent.email}`}
                        className="flex-1 bg-[#90C641] text-white py-2 px-4 rounded-lg hover:bg-[#7DAF35] transition-colors text-center text-sm"
                      >
                        Contact
                      </a>
                      {agent.phone_number && (
                        <a
                          href={`tel:${agent.phone_number}`}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                        >
                          Call
                        </a>
                      )}
                    </div>

                    {/* Agent Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-[#90C641]">15</p>
                          <p className="text-xs text-gray-600">Properties Sold</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#90C641]">98%</p>
                          <p className="text-xs text-gray-600">Success Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agent Benefits Section */}
          <div className="mt-12 bg-[#061D58] rounded-lg p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Agent Network Benefits</h2>
              <p className="text-blue-200">Exclusive features for verified real estate agents</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-[#90C641]" />
                <h3 className="text-xl font-semibold mb-2">Verified Network</h3>
                <p className="text-blue-200">Connect with verified agents in your area and expand your professional network.</p>
              </div>
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-[#90C641]" />
                <h3 className="text-xl font-semibold mb-2">Lead Sharing</h3>
                <p className="text-blue-200">Share and receive quality leads from other agents in the network.</p>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 mx-auto mb-4 text-[#90C641]" />
                <h3 className="text-xl font-semibold mb-2">Professional Growth</h3>
                <p className="text-blue-200">Access training resources and grow your real estate business.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Agents