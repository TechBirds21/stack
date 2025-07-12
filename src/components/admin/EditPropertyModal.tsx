import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadMultipleImages, ensureBucketExists } from '@/utils/imageUpload';
import { Property } from '@/types/admin';
import { toast } from 'react-hot-toast';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyUpdated: () => void;
  property: Property | null;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  custom_id: string;
  user_type: string;
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({ isOpen, onClose, onPropertyUpdated, property }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [amenities, setAmenities] = useState<string[]>(['']);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    monthly_rent: '',
    security_deposit: '',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    owner_id: '',
    status: 'active',
    featured: false,
    verified: false,
    listing_type: 'SALE',
    available_from: '',
    furnishing_status: 'Unfurnished',
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (property) {
        setFormData({
          title: property.title || '',
          description: property.description || '',
          price: property.price?.toString() || '',
          monthly_rent: property.monthly_rent?.toString() || '',
          security_deposit: property.security_deposit?.toString() || '',
          property_type: property.property_type || 'apartment',
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          area_sqft: property.area_sqft?.toString() || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zip_code: property.zip_code || '',
          latitude: property.latitude?.toString() || '',
          longitude: property.longitude?.toString() || '',
          owner_id: property.owner_id || '',
          status: property.status || 'active',
          featured: property.featured || false,
          verified: property.verified || false,
          listing_type: property.listing_type || 'SALE',
          available_from: property.available_from || '',
          furnishing_status: property.furnishing_status || 'Unfurnished',
        });
        
        setAmenities(property.amenities?.length ? property.amenities : ['']);
        setExistingImages(property.images || []);
      }
    }
  }, [isOpen, property]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for property owner dropdown...');
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, custom_id, user_type')
        .in('user_type', ['seller', 'agent'])
        .eq('status', 'active');

      if (error) throw error;
      console.log('Fetched users:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Add fallback data if no users are found
      setUsers([
        {
          id: '11111111-1111-1111-1111-111111111111',
          first_name: 'Demo',
          last_name: 'Seller',
          custom_id: 'SELLER001',
          user_type: 'seller'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          first_name: 'Demo',
          last_name: 'Agent',
          custom_id: 'AGENT001',
          user_type: 'agent'
        }
      ]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter out disallowed file types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const allowedFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (allowedFiles.length < files.length) {
      toast.error('Some files were skipped. Only PNG, JPG, and JPEG files are allowed for property images.');
    }
    
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmenityChange = (index: number, value: string) => {
    setAmenities(prev => prev.map((amenity, i) => i === index ? value : amenity));
  };

  const addAmenity = () => {
    setAmenities(prev => [...prev, '']);
  };

  const removeAmenity = (index: number) => {
    setAmenities(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (propertyId: string) => {
    const imageUrls: string[] = [...existingImages];
    
    if (images.length > 0) { 
      try {
        console.log(`Uploading ${images.length} new images for property ${propertyId}...`);
        
        // Ensure bucket exists
        await ensureBucketExists('property-images');
        
        // Upload all images at once
        const newImageUrls = await uploadMultipleImages(
          images, 
          'property-images', 
          `properties/${propertyId}`
        );
        
        console.log('Uploaded new image URLs:', newImageUrls);
        
        // Add new URLs to existing ones
        imageUrls.push(...newImageUrls);
      } catch (error) {
        console.error('Error uploading images:', error);
        throw error;
      }
    }

    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    
    setLoading(true);
    const timestamp = new Date().toISOString();

    try {
      // Prepare property data
      const propertyData = {
        title: formData.title,
        description: formData.description,
        price: formData.listing_type === 'SALE' ? parseFloat(formData.price) || null : null,
        monthly_rent: formData.listing_type === 'RENT' ? parseFloat(formData.monthly_rent) || null : null,
        security_deposit: formData.listing_type === 'RENT' ? parseFloat(formData.security_deposit) || null : null,
        property_type: formData.property_type,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseInt(formData.bathrooms) || null,
        area_sqft: parseFloat(formData.area_sqft) || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        owner_id: formData.owner_id,
        status: formData.status,
        featured: formData.featured,
        verified: formData.verified,
        listing_type: formData.listing_type,
        available_from: formData.available_from || null,
        furnishing_status: formData.furnishing_status,
        amenities: amenities.filter(a => a.trim() !== ''),
        updated_at: timestamp
      };

      // Update property
      const { error: propertyError } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', property.id);

      if (propertyError) throw propertyError;

      // Upload new images if any
      if (images.length > 0) {
        const imageUrls = await uploadImages(property.id);
        console.log('All image URLs:', imageUrls);
        
        // Update property with image URLs
        const { error: updateError } = await supabase
          .from('properties')
          .update({ images: imageUrls })
          .eq('id', property.id);
          
        if (updateError) {
          console.error('Error updating property with image URLs:', updateError);
          throw updateError;
        }
        
        console.log('Property updated with image URLs');
      } else if (existingImages.length !== property.images?.length) {
        // Update property with modified existing images
        const { error: updateError } = await supabase
          .from('properties')
          .update({ images: existingImages })
          .eq('id', property.id);
          
        if (updateError) {
          console.error('Error updating property with modified existing images:', updateError);
          throw updateError;
        }
        
        console.log('Property updated with modified existing images');
      }

      onPropertyUpdated();
      onClose();
      toast.success('Property updated successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        monthly_rent: '',
        security_deposit: '',
        property_type: 'apartment',
        bedrooms: '',
        bathrooms: '',
        area_sqft: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        latitude: '',
        longitude: '',
        owner_id: '',
        status: 'active',
        featured: false,
        verified: false,
        listing_type: 'SALE',
        available_from: '',
        furnishing_status: 'Unfurnished',
      });
      setImages([]);
      setAmenities(['']);
      setExistingImages([]);

    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Property</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <select
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="villa">Villa</option>
                        <option value="studio">Studio</option>
                        <option value="penthouse">Penthouse</option>
                        <option value="townhouse">Townhouse</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Listing Type *
                      </label>
                      <select
                        name="listing_type"
                        value={formData.listing_type}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="SALE">For Sale</option>
                        <option value="RENT">For Rent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area (sqft) *
                      </label>
                      <input
                        type="number"
                        name="area_sqft"
                        value={formData.area_sqft}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                
                {formData.listing_type === 'SALE' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent (₹) *
                      </label>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Security Deposit (₹)
                      </label>
                      <input
                        type="number"
                        name="security_deposit"
                        value={formData.security_deposit}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                
                <div className="space-y-2">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={amenity}
                        onChange={(e) => handleAmenityChange(index, e.target.value)}
                        placeholder="Enter amenity"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {amenities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Amenity
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner and Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner & Status</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Owner *
                    </label>
                    <div className="relative">
                      <select
                        name="owner_id"
                        value={formData.owner_id}
                        onChange={handleInputChange} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Owner</option>
                        {users && users.length > 0 && (
                          users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.first_name} {user.last_name} ({user.custom_id || 'ID pending'}) - {user.user_type}
                            </option>
                          ))
                        )}
                      </select>
                      {(!users || users.length === 0) && (
                        <p className="text-sm text-red-500 mt-1">No property owners available. Please add a seller or agent first.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Furnishing Status
                      </label>
                      <select
                        name="furnishing_status"
                        value={formData.furnishing_status}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi Furnished">Semi Furnished</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                      </select>
                    </div>
                  </div>

                  {formData.listing_type === 'RENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available From
                      </label>
                      <input
                        type="date"
                        name="available_from"
                        value={formData.available_from}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Featured Property
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="verified"
                        checked={formData.verified}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Verified Property
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Current Images
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="relative group">
                            <img 
                              src={image} 
                              alt={`Property ${index}`} 
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-1">Image {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Images */}
                <div>
                  <label className="block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <span className="text-lg text-gray-600">
                        Click to upload new property images (JPG, PNG)
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        You can select multiple images at once
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {images.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        New Images to Upload ({images.length})
                      </h4> 
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {images.map((image, index) => (
                          <div key={index} className="relative">
                            <div className="relative group">
                              <img 
                                src={URL.createObjectURL(image)} 
                                alt={`Preview ${index}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 truncate mt-1">{image.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel 
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2" />}
              {loading ? 'Updating...' : 'Update Property'} 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;