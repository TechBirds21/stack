import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Home, Bed, Bath, Kitchen, Coffee } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PropertyImage, RoomType, uploadPropertyImages } from '@/utils/imageUpload';
import toast from 'react-hot-toast';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: () => void;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  custom_id: string;
  user_type: string;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, onPropertyAdded }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [amenities, setAmenities] = useState<string[]>(['']);
  const [currentRoomType, setCurrentRoomType] = useState<RoomType>('exterior');
  
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
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, custom_id, user_type')
        .in('user_type', ['seller', 'agent'])
        .eq('status', 'active');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, roomType: RoomType) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      roomType,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    if (images[index].preview) {
      URL.revokeObjectURL(images[index].preview);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
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

  // Get room type icon
  const getRoomTypeIcon = (roomType: RoomType) => {
    switch (roomType) {
      case 'bedroom_1':
      case 'bedroom_2':
        return <Bed size={16} />;
      case 'washroom_1':
      case 'washroom_2':
        return <Bath size={16} />;
      case 'kitchen':
        return <Kitchen size={16} />;
      case 'hall':
        return <Coffee size={16} />;
      default:
        return <Home size={16} />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        images: [], // Will be updated after image upload
        created_at: timestamp,
        updated_at: timestamp
      };

      // Insert property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (propertyError) throw propertyError;
      
      // Get the created property
      const property = property.data[0];

      // Upload images if any
      if (images.length > 0) {
        try {
          // Upload images with room types
          const uploadedImages = await uploadPropertyImages(images, property.id);
          
          // Extract URLs and organize by room type
          const imageUrls = uploadedImages.map(img => img.url);
          const roomTypeImages = uploadedImages.reduce((acc, img) => {
            acc[img.roomType] = acc[img.roomType] || [];
            acc[img.roomType].push(img.url);
            return acc;
          }, {} as Record<RoomType, string[]>);
          
          // Update property with image URLs and room type organization
          await supabase
            .from('properties')
            .update({ 
              images: imageUrls,
              room_images: roomTypeImages
            })
            .eq('id', property.id);
            
          // Store document records
          for (const img of uploadedImages) {
            await supabase.from('documents').insert({
              name: img.metadata.originalName,
              file_path: new URL(img.url).pathname.split('/').slice(-2).join('/'),
              file_type: img.metadata.type,
              file_size: img.metadata.size,
              entity_type: 'property',
              entity_id: property.id,
              document_category: `property_image_${img.roomType}`
            });
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          toast.error('Property created but some images failed to upload');
        }
      }
        
      onPropertyAdded();
      onClose();
      
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

      alert('Property created successfully!');
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Add New Property</h2>
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
                    <select
                      name="owner_id"
                      value={formData.owner_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Owner</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.custom_id}) - {user.user_type}
                        </option>
                      ))}
                    </select>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Room Type
                  </label>
                  <select
                    value={currentRoomType}
                    onChange={(e) => setCurrentRoomType(e.target.value as RoomType)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="exterior">Exterior/Main</option>
                    <option value="bedroom_1">Bedroom 1</option>
                    <option value="bedroom_2">Bedroom 2</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="hall">Hall/Living Room</option>
                    <option value="balcony">Balcony</option>
                    <option value="washroom_1">Washroom 1</option>
                    <option value="washroom_2">Washroom 2</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <span className="text-lg text-gray-600">
                      Click to upload {currentRoomType.replace('_', ' ')} images
                    </span>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload images (JPG, PNG, WebP)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageChange(e, currentRoomType)}
                    className="hidden"
                  />
                </label>

                {images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Selected Images ({images.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center p-2 bg-gray-50 rounded">
                            {image.preview && (
                              <img 
                                src={image.preview} 
                                alt={`Preview ${index}`}
                                className="w-16 h-16 object-cover rounded mr-2"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                {getRoomTypeIcon(image.roomType)}
                                <span className="ml-1 text-xs font-medium text-gray-700">
                                  {image.roomType.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {image.file.name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;