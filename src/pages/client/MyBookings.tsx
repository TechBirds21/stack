import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  created_at: string;
  properties: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    price: number;
    monthly_rent: number;
    listing_type: string;
    images: string[];
    users: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
  };
}

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (user.user_type !== 'buyer') {
      navigate('/');
      return;
    }

    fetchBookings();
  }, [user, navigate, filter]);

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          properties (
            id,
            title,
            address,
            city,
            state,
            price,
            monthly_rent,
            listing_type,
            images,
            owner:users!properties_owner_id_fkey (
              first_name,
              last_name,
              email,
              phone_number
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match expected structure
      const transformedBookings = (data || []).map(booking => ({
        ...booking,
        properties: {
          ...booking.properties,
          users: booking.properties.owner
        }
      }));
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Mock data for demo
      const mockBookings: Booking[] = [
        {
          id: '1',
          booking_date: '2024-01-25',
          booking_time: '10:00:00',
          status: 'confirmed',
          notes: 'Looking forward to the tour',
          created_at: '2024-01-20T10:00:00Z',
          properties: {
            id: '1',
            title: 'Beautiful 3BHK Apartment',
            address: 'MG Road',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            price: 5000000,
            monthly_rent: 0,
            listing_type: 'SALE',
            images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'],
            users: {
              first_name: 'Priya',
              last_name: 'Sharma',
              email: 'priya@example.com',
              phone_number: '+91 9876543213'
            }
          }
        },
        {
          id: '2',
          booking_date: '2024-01-28',
          booking_time: '14:30:00',
          status: 'pending',
          notes: 'Interested in rental terms',
          created_at: '2024-01-22T14:30:00Z',
          properties: {
            id: '2',
            title: 'Luxury Villa with Garden',
            address: 'Beach Road',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            price: 0,
            monthly_rent: 45000,
            listing_type: 'RENT',
            images: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'],
            users: {
              first_name: 'Rajesh',
              last_name: 'Kumar',
              email: 'rajesh@example.com',
              phone_number: '+91 9876543214'
            }
          }
        }
      ];
      setBookings(mockBookings);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    };
    
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      fetchBookings();
      alert('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-[90px]">
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              navigate('/');
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-[90px] pb-16">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Bookings</h1>
            <p className="text-gray-600">Track your property tour requests and appointments</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#90C641] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">You haven't made any property tour requests yet.</p>
              <button
                onClick={() => navigate('/buy')}
                className="btn-primary px-6 py-3"
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="professional-card p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Property Image */}
                    <div className="lg:w-1/4">
                      <img
                        src={booking.properties.images[0]}
                        alt={booking.properties.title}
                        className="w-full h-48 lg:h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(`/property/${booking.properties.id}`)}
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="lg:w-3/4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div>
                          <h3 
                            className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-[#90C641]"
                            onClick={() => navigate(`/property/${booking.properties.id}`)}
                          >
                            {booking.properties.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span className="text-sm">{booking.properties.address}, {booking.properties.city}</span>
                          </div>
                          <p className="text-[#90C641] font-bold text-lg">
                            {booking.properties.listing_type === 'SALE' 
                              ? formatIndianCurrency(booking.properties.price)
                              : `${formatIndianCurrency(booking.properties.monthly_rent)}/month`
                            }
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      {/* Booking Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Tour Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-2 text-[#90C641]" />
                              <span>{new Date(booking.booking_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock size={16} className="mr-2 text-[#90C641]" />
                              <span>{new Date(`2000-01-01T${booking.booking_time}`).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          </div>
                          {booking.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <strong>Notes:</strong> {booking.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Property Owner</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <User size={16} className="mr-2 text-[#90C641]" />
                              <span>{booking.properties.users.first_name} {booking.properties.users.last_name}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail size={16} className="mr-2 text-[#90C641]" />
                              <span>{booking.properties.users.email}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone size={16} className="mr-2 text-[#90C641]" />
                              <span>{booking.properties.users.phone_number}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate(`/property/${booking.properties.id}`)}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          View Property
                        </button>
                        
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
                          >
                            Cancel Booking
                          </button>
                        )}
                        
                        <div className="text-xs text-gray-500 flex items-center">
                          <span>Requested on {new Date(booking.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookings;