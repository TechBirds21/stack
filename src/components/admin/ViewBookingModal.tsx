import React from 'react';
import { X, Calendar, Clock, MapPin, User, Mail, Phone, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Booking } from '@/types/admin';
import { getStatusBadge } from '@/utils/adminHelpers';

interface ViewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const ViewBookingModal: React.FC<ViewBookingModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              {getStatusIcon(booking.status)}
            </div>
            <div>
              <h3 className="text-xl font-semibold">Booking #{booking.id.substring(0, 8)}</h3>
              <div className="flex items-center mt-1">
                {getStatusBadge(booking.status)}
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  Created on {new Date(booking.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Booking Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {booking.booking_time ? 
                        new Date(`2000-01-01T${booking.booking_time}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Not specified'
                      }
                    </p>
                  </div>
                </div>
                
                {booking.notes && (
                  <div className="flex items-start">
                    <MessageSquare className="w-5 h-5 text-blue-500 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium">{booking.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Property Information</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Property</p>
                    <p className="font-medium">{booking.properties?.title || 'Unknown Property'}</p>
                    <p className="text-sm text-gray-600">ID: {booking.properties?.custom_id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">
                      {booking.users?.first_name} {booking.users?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">ID: {booking.users?.custom_id || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{booking.users?.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{booking.users?.phone_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {booking.agent && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Agent Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Agent</p>
                      <p className="font-medium">
                        {booking.agent.first_name} {booking.agent.last_name}
                      </p>
                      <p className="text-sm text-gray-600">License: {booking.agent.agent_license_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

export default ViewBookingModal;