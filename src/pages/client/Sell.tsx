import React, { useState, useEffect } from 'react'
import { Upload, MapPin, DollarSign, Home, CheckCircle } from 'lucide-react'
import { propertiesAPI, propertyCategoriesAPI, amenitiesAPI, propertyImagesAPI } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import PropertyImageUpload, { PropertyImage } from '../../components/PropertyImageUpload'

const Sell = () => {
  const { user, profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    property_purpose: 'sale',
    property_type: '',
    property_category_id: '',
    bedrooms: '',
    bathrooms: '',
    balcony: '',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    monthly_rent: '',
    security_deposit: '',
    available_from: '',
    furnishing_status: '',
    possession: 'Immediately',
    floor_number: '',
    total_floors: '',
    age_of_building: '',
    facing: '',
    parking_details: '',
    maintenance_charges: '',
    ownership_type: '',
   listing_type: 'SALE',
    amenity_ids: [] as string[]
  })
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [amenities, setAmenities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchAmenities()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await propertyCategoriesAPI.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchAmenities = async () => {
    try {
      const data = await amenitiesAPI.getAll()
      setAmenities(data)
    } catch (error) {
      console.error('Error fetching amenities:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAmenityChange = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenity_ids: prev.amenity_ids.includes(amenityId)
        ? prev.amenity_ids.filter(id => id !== amenityId)
        : [...prev.amenity_ids, amenityId]
    }))
  }

  const handleImagesChange = (images: PropertyImage[]) => {
    setPropertyImages(images)
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.property_type && formData.price
      case 2:
        return formData.address && formData.city && formData.state && formData.zip_code
      case 3:
        return propertyImages.length > 0 && propertyImages.some(img => img.is_primary)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const uploadImages = async (propertyId: string) => {
    const imagePromises = propertyImages.map(async (image, index) => {
      // In a real app, you would upload to a storage service like Supabase Storage
      // For now, we'll use the preview URL
      return {
        property_id: propertyId,
        image_url: image.preview, // In production, this would be the uploaded URL
        room_type: image.room_type,
        room_name: image.room_name,
        description: image.description,
        is_primary: image.is_primary || false,
        order_index: index
      }
    })

    const imageData = await Promise.all(imagePromises)
    return await propertyImagesAPI.createMultiple(imageData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      alert('Please sign in to list a property')
      return
    }

    setLoading(true)
    try {
      // Create property
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        monthly_rent: parseFloat(formData.monthly_rent) || 0,
        security_deposit: parseFloat(formData.security_deposit) || 0,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        balcony: parseInt(formData.balcony) || 0,
        area_sqft: parseInt(formData.area_sqft),
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
       listing_type: formData.listing_type,
      }

      const property = await propertiesAPI.create(propertyData)

      // Upload images
      if (propertyImages.length > 0) {
        await uploadImages(property.id)
      }

      // Add amenities (you would need to implement property_amenities API)
      // await propertyAmenitiesAPI.createMultiple(property.id, formData.amenity_ids)

      setSuccess(true)
      setFormData({
        title: '',
        description: '',
        price: '',
        property_type: '',
        property_category_id: '',
        bedrooms: '',
        bathrooms: '',
        balcony: '',
        area_sqft: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        latitude: '',
        longitude: '',
        property_purpose: 'sale',
        monthly_rent: '',
        security_deposit: '',
        available_from: '',
        furnishing_status: '',
        possession: '',
        floor_number: '',
        total_floors: '',
        age_of_building: '',
        facing: '',
        parking_details: '',
        maintenance_charges: '',
        ownership_type: '',
        amenity_ids: []
      })
      setPropertyImages([])
      setCurrentStep(1)
    } catch (error) {
      console.error('Error listing property:', error)
      alert('Error listing property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Property details and pricing' },
    { number: 2, title: 'Location & Features', description: 'Address and amenities' },
    { number: 3, title: 'Photos', description: 'Upload property images' },
    { number: 4, title: 'Review & Submit', description: 'Final review' }
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-[8rem] pb-8">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <div className="text-green-500 mb-4">
                <CheckCircle size={64} className="mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Listed Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your property has been submitted for review. We'll notify you once it's approved and live on our platform.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
              >
                List Another Property
              </button>
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
            <h1 className="text-4xl font-bold text-[#061D58] mb-4">Sell Your Property</h1>
            <p className="text-gray-600 text-lg">List your property and reach thousands of potential buyers</p>
          </div>

          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number 
                      ? 'bg-[#90C641] border-[#90C641] text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle size={20} />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-[#90C641]' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-[#90C641]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Beautiful 3BHK Apartment in Prime Location"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Purpose <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="property_purpose"
                        value={formData.property_purpose}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      >
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                        <option value="both">Both Sale & Rent</option>
                      </select>
                    </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Listing Type <span className="text-red-500">*</span>
                     </label>
                     <select
                       name="listing_type"
                       value={formData.listing_type}
                       onChange={handleInputChange}
                       className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                       required
                     >
                       <option value="SALE">For Sale</option>
                       <option value="RENT">For Rent</option>
                     </select>
                   </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="villa">Villa</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="plot">Plot/Land</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        name="property_category_id"
                        value={formData.property_category_id}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="e.g., 5000000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required={formData.property_purpose !== 'rent'}
                      />
                    </div>

                    {(formData.property_purpose === 'rent' || formData.property_purpose === 'both') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Rent (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="monthly_rent"
                            value={formData.monthly_rent}
                            onChange={handleInputChange}
                            placeholder="e.g., 25000"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                            required={formData.property_purpose === 'rent' || formData.property_purpose === 'both'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Security Deposit (₹)
                          </label>
                          <input
                            type="text"
                            name="security_deposit"
                            value={formData.security_deposit}
                            onChange={handleInputChange}
                            placeholder="e.g., 50000"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available From
                          </label>
                          <input
                            type="date"
                            name="available_from"
                            value={formData.available_from}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Furnishing Status
                          </label>
                          <select
                            name="furnishing_status"
                            value={formData.furnishing_status}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                          >
                            <option value="">Select</option>
                            <option value="Unfurnished">Unfurnished</option>
                            <option value="Semi Furnished">Semi Furnished</option>
                            <option value="Fully Furnished">Fully Furnished</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area (sqft) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="area_sqft"
                        value={formData.area_sqft}
                        onChange={handleInputChange}
                        placeholder="e.g., 1200"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <select
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      >
                        <option value="">Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                      <select
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      >
                        <option value="">Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Balconies
                      </label>
                      <select
                        name="balcony"
                        value={formData.balcony}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      >
                        <option value="">Select</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4+</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe your property, its features, and what makes it special..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Features */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Location & Features</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        placeholder="ZIP Code"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          placeholder="e.g., 17.6868"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((position) => {
                                setFormData(prev => ({
                                  ...prev,
                                  latitude: position.coords.latitude.toString(),
                                  longitude: position.coords.longitude.toString()
                                }));
                              });
                            } else {
                              alert("Geolocation is not supported by this browser.");
                            }
                          }}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Get Current Location
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder="e.g., 83.2185"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Possession
                      </label>
                      <select
                        name="possession"
                        value={formData.possession}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                      >
                        <option value="Immediately">Immediately</option>
                        <option value="Within 1 Month">Within 1 Month</option>
                        <option value="Within 3 Months">Within 3 Months</option>
                        <option value="Within 6 Months">Within 6 Months</option>
                      </select>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Amenities</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {amenities.map((amenity) => (
                        <label key={amenity.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.amenity_ids.includes(amenity.id)}
                            onChange={() => handleAmenityChange(amenity.id)}
                            className="mr-3"
                          />
                          <span className="mr-2">{amenity.icon}</span>
                          <span className="text-sm">{amenity.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Property Photos</h3>
                  <PropertyImageUpload
                    bedrooms={parseInt(formData.bedrooms) || 1}
                    bathrooms={parseInt(formData.bathrooms) || 1}
                    onImagesChange={handleImagesChange}
                    existingImages={propertyImages}
                  />
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Review & Submit</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Property Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-600">Title:</span> <span className="font-medium">{formData.title || 'Not specified'}</span></div>
                        <div><span className="text-gray-600">Purpose:</span> <span className="font-medium">{formData.property_purpose === 'sale' ? 'For Sale' : formData.property_purpose === 'rent' ? 'For Rent' : 'Both Sale & Rent'}</span></div>
                        <div><span className="text-gray-600">Type:</span> <span className="font-medium">{formData.property_type || 'Not specified'}</span></div>
                        
                        {formData.property_purpose !== 'rent' && (
                          <div><span className="text-gray-600">Price:</span> <span className="font-medium">₹{parseInt(formData.price || '0').toLocaleString()}</span></div>
                        )}
                        
                        {(formData.property_purpose === 'rent' || formData.property_purpose === 'both') && (
                          <>
                            <div><span className="text-gray-600">Monthly Rent:</span> <span className="font-medium">₹{parseInt(formData.monthly_rent || '0').toLocaleString()}/month</span></div>
                            <div><span className="text-gray-600">Security Deposit:</span> <span className="font-medium">₹{parseInt(formData.security_deposit || '0').toLocaleString()}</span></div>
                            <div><span className="text-gray-600">Available From:</span> <span className="font-medium">{formData.available_from || 'Immediately'}</span></div>
                            <div><span className="text-gray-600">Furnishing:</span> <span className="font-medium">{formData.furnishing_status || 'Not specified'}</span></div>
                          </>
                        )}
                        
                        <div><span className="text-gray-600">Area:</span> <span className="font-medium">{formData.area_sqft || '0'} sqft</span></div>
                        <div><span className="text-gray-600">Bedrooms:</span> <span className="font-medium">{formData.bedrooms || '0'}</span></div>
                        <div><span className="text-gray-600">Bathrooms:</span> <span className="font-medium">{formData.bathrooms || '0'}</span></div>
                        <div><span className="text-gray-600">Balconies:</span> <span className="font-medium">{formData.balcony || '0'}</span></div>
                        <div><span className="text-gray-600">Possession:</span> <span className="font-medium">{formData.possession || 'Immediately'}</span></div>
                        <div className="md:col-span-2"><span className="text-gray-600">Address:</span> <span className="font-medium">{formData.address ? `${formData.address}, ${formData.city}, ${formData.state}` : 'Not specified'}</span></div>
                        <div className="md:col-span-2"><span className="text-gray-600">Images:</span> <span className={`font-medium ${propertyImages.length < 2 ? 'text-red-500' : 'text-green-600'}`}>{propertyImages.length} uploaded {propertyImages.length < 2 ? '(minimum 2 required)' : ''}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Before You Submit</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Your property will be reviewed by our team before going live</li>
                      <li>• You'll receive an email confirmation once approved (usually within 24 hours)</li>
                      <li>• You can edit your listing anytime from your dashboard</li>
                      <li>• Our team may contact you for additional information</li>
                      <li>• At least 2 property images are required for listing approval</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="ml-auto px-6 py-3 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-8 py-3 bg-[#90C641] text-white rounded-lg hover:bg-[#7DAF35] transition-colors disabled:opacity-50 text-lg font-semibold"
                  >
                    {loading ? 'Submitting...' : 'Submit Property'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Sell