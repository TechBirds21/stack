import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, MapPin, Phone, Mail, CheckCircle, AlertCircle, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'responded' | 'closed';
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

const MyInquiries: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'responded' | 'closed'>('all');

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (user.user_type !== 'buyer') {
      navigate('/');
      return;
    }

    fetchInquiries();
  }, [user, navigate, filter]);

  const fetchInquiries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('inquiries')
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
      const transformedInquiries = (data || []).map(inquiry => ({
        ...inquiry,
        properties: {
          ...inquiry.properties,
          users: inquiry.properties.owner
        }
      }));
      
      setInquiries(transformedInquiries);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      // Mock data for demo
      const mockInquiries: Inquiry[] = [
        {
          id: '1',
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: '+91 9876543210',
          message: 'Very interested in this property. Can we negotiate on the price?',
          status: 'responded',
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
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: '+91 9876543210',
          message: 'Is this property available for immediate possession? We are looking to move in next month.',
          status: 'new',
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
      setInquiries(mockInquiries);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      responded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
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

  const handleSendFollowUp = async (inquiryId: string, propertyId: string) => {
    const followUpMessage = prompt('Enter your follow-up message:');
    if (!followUpMessage) return;

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert({
          property_id: propertyId,
          user_id: user?.id,
          name: `${user?.first_name} ${user?.last_name}`,
          email: user?.email,
          phone: '+91 9876543210',
          message: `Follow-up: ${followUpMessage}`,
          status: 'new'
        });

      if (error) throw error;

      fetchInquiries();
      alert('Follow-up message sent successfully!');
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Failed to send follow-up message');
    }
  };

  if (!user) {
    return (
      <div className="page-content min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
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
    <div className="page-content min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pb-16">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-[#061D58] mb-2">My Inquiries</h1>
            <p className="text-gray-600">Track your property inquiries and responses</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'new', 'responded', 'closed'].map((status) => (
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
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No inquiries found</h3>
              <p className="text-gray-600 mb-6">You haven't sent any property inquiries yet.</p>
              <button
                onClick={() => navigate('/buy')}
                className="btn-primary px-6 py-3"
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="professional-card p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Property Image */}
                    <div className="lg:w-1/4">
                      <img
                        src={inquiry.properties.images[0]}
                        alt={inquiry.properties.title}
                        className="w-full h-48 lg:h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(`/property/${inquiry.properties.id}`)}
                      />
                    </div>

                    {/* Inquiry Details */}
                    <div className="lg:w-3/4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div>
                          <h3 
                            className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-[#90C641]"
                            onClick={() => navigate(`/property/${inquiry.properties.id}`)}
                          >
                            {inquiry.properties.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span className="text-sm">{inquiry.properties.address}, {inquiry.properties.city}</span>
                          </div>
                          <p className="text-[#90C641] font-bold text-lg">
                            {inquiry.properties.listing_type === 'SALE' 
                              ? formatIndianCurrency(inquiry.properties.price)
                              : `${formatIndianCurrency(inquiry.properties.monthly_rent)}/month`
                            }
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                          {getStatusBadge(inquiry.status)}
                        </div>
                      </div>

                      {/* Inquiry Message */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Your Message</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{inquiry.message}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Sent on {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Property Owner Info */}
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Property Owner Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center">
                            <User size={16} className="mr-2 text-[#90C641]" />
                            <span>{inquiry.properties.users.first_name} {inquiry.properties.users.last_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail size={16} className="mr-2 text-[#90C641]" />
                            <span>{inquiry.properties.users.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone size={16} className="mr-2 text-[#90C641]" />
                            <span>{inquiry.properties.users.phone_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate(`/property/${inquiry.properties.id}`)}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          View Property
                        </button>
                        
                        <button
                          onClick={() => handleSendFollowUp(inquiry.id, inquiry.properties.id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg flex items-center"
                        >
                          <Send size={14} className="mr-2" />
                          Send Follow-up
                        </button>

                        {inquiry.status === 'responded' && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle size={16} className="mr-1" />
                            Owner has responded - Check your email/phone
                          </div>
                        )}
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

export default MyInquiries;