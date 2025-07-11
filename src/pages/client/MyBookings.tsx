import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  User as UserIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ViewBookingModal from '@/components/client/ViewBookingModal';
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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  async function fetchBookings() {
    if (!user) return;
    setLoading(true);

    try {
      // Simplified join: bookings → properties → users
      let q = supabase
        .from('bookings')
        .select('*, properties(*, users(first_name,last_name,email,phone_number))')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });

      if (filter !== 'all') {
        q = q.eq('status', filter);
      }

      const { data, error } = await q;
      if (error) throw error;

      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      alert('Failed to load bookings.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { color: string; icon: any }> = {
      pending:   { color: 'bg-yellow-100 text-yellow-800', icon: Clock       },
      confirmed: { color: 'bg-green-100 text-green-800',   icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800',       icon: XCircle     },
      completed: { color: 'bg-blue-100 text-blue-800',     icon: CheckCircle },
    };
    const { color, icon: Icon } = map[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    );
  }

  async function handleCancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
      fetchBookings();
      alert('Booking cancelled');
    } catch (err) {
      console.error(err);
      alert('Failed to cancel');
    }
  }

  function handleViewBooking(b: Booking) {
    setSelectedBooking(b);
    setShowViewModal(true);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-[90px] flex justify-center">
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Bookings</h1>
            <p className="text-gray-600">Track your upcoming tours</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all','pending','confirmed','cancelled','completed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === s
                    ? 'bg-[#90C641] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase()+s.slice(1)}
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
              <p className="text-gray-600 mb-6">You haven’t made any tours yet.</p>
              <button
                onClick={() => navigate('/buy')}
                className="bg-[#90C641] text-white px-6 py-3 rounded-lg"
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Image */}
                    <div className="lg:w-1/4">
                      <img
                        src={booking.properties.images[0]}
                        alt={booking.properties.title}
                        className="w-full h-48 lg:h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(`/property/${booking.properties.id}`)}
                      />
                    </div>

                    {/* Details */}
                    <div className="lg:w-3/4 space-y-4">
                      {/* Title & Status */}
                      <div className="flex justify-between items-start">
                        <h3
                          className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-[#90C641]"
                          onClick={() => navigate(`/property/${booking.properties.id}`)}
                        >
                          {booking.properties.title}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Tour & Owner Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tour Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Tour Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <Calendar className="mr-2 text-[#90C641]" size={16} />
                              <span>
                                {new Date(booking.booking_date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-2 text-[#90C641]" size={16} />
                              <span>
                                {booking.booking_time
                                  ? new Date(`2000-01-01T${booking.booking_time}`).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Time not set'}
                              </span>
                            </div>
                            {booking.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Notes:</strong> {booking.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Owner Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Property Owner</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                              <UserIcon className="mr-2 text-[#90C641]" size={16} />
                              <span>
                                {booking.properties.users.first_name}{' '}
                                {booking.properties.users.last_name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="mr-2 text-[#90C641]" size={16} />
                              <span>{booking.properties.users.email}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="mr-2 text-[#90C641]" size={16} />
                              <span>{booking.properties.users.phone_number}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleViewBooking(booking)}
                          className="bg-[#90C641] text-white px-4 py-2 rounded-full hover:bg-[#7DAF35] transition"
                        >
                          View Details
                        </button>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Requested on{' '}
                        {new Date(booking.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
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

      <ViewBookingModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        booking={selectedBooking}
      />
    </div>
  );
};

export default MyBookings;
