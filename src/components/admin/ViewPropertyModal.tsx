import React from 'react';
import { X, MapPin, Bed, Bath, Square, Calendar, DollarSign, User, Tag, CheckCircle, XCircle } from 'lucide-react';
import { Property } from '@/types/admin';
import { getStatusBadge } from '@/utils/adminHelpers';
import { formatCurrency } from '@/utils/adminHelpers';

interface ViewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

const ViewPropertyModal: React.FC<ViewPropertyModalProps> = ({ isOpen, onClose, property }) => {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0]} 
                  alt={property.title} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
              
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Property Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span>{getStatusBadge(property.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Featured:</span>
                    <span>{property.featured ? 
                      <CheckCircle className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified:</span>
                    <span>{property.verified ? 
                      <CheckCircle className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-2/3">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.title}</h3>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin size={16} className="mr-1" />
                <span>{property.address || `${property.city}, ${property.state}`}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <Bed size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{property.bedrooms || 0} Bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{property.bathrooms || 0} Bathrooms</span>
                </div>
                <div className="flex items-center">
                  <Square size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{property.area_sqft || 0} sqft</span>
                </div>
                <div className="flex items-center">
                  <Tag size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{property.property_type}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{property.listing_type}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {new Date(property.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Price Information</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  {property.listing_type === 'SALE' ? (
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(property.price)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(property.monthly_rent)}/month
                      </div>
                      {property.security_deposit && (
                        <div className="text-sm text-gray-600">
                          Security Deposit: {formatCurrency(property.security_deposit)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Owner Information</h4>
                <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                  <User size={20} className="text-blue-500 mr-3 mt-1" />
                  <div>
                    {property.users ? (
                      <>
                        <p className="font-medium">{property.users.first_name} {property.users.last_name}</p>
                        <p className="text-sm text-gray-600">ID: {property.users.custom_id}</p>
                      </>
                    ) : (
                      <p className="text-gray-600">No owner assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPropertyModal;