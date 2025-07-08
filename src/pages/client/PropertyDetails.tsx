import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  User,
  Check,
  X,
  Star,
  Bed,
  Bath,
  Square,
  Calendar,
  Home as HomeIcon,
  Car,
  Wifi,
  Dumbbell,
  Shield,
  Zap,
  Waves,
  TreePine,
  Camera,
  Video,
  ArrowLeft,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatIndianCurrency } from '@/utils/currency';

// Leaflet marker fix
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showTourForm, setShowTourForm] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [tourLoading, setTourLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    const fetchPropertyDetails = async () => {
      try {
        // Fetch property details from Supabase
        const { data, error } = await supabase
          .from('properties')
          .select('*, users(*)')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Add additional UI-specific properties
          const enhancedProperty = {
            ...data,
            floor: '2 out of 5', // Example hardcoded value
            facing: 'North',
            rera_id: '1000000000000',
            videos: [],
            amenities: [
              { icon: <Zap size={16} />, name: 'Power Backup' },
              { icon: <Shield size={16} />, name: '24/7 Security & CCTV' },
              { icon: <Car size={16} />, name: 'Parking' },
              { icon: <HomeIcon size={16} />, name: 'Power Backup' },
              { icon: <Wifi size={16} />, name: 'Children Play Area' },
              { icon: <Dumbbell size={16} />, name: '10+ Amenities' },
            ],
            nearbyHighlights: [
              { icon: <HomeIcon size={16} />, name: 'School' },
              { icon: <HomeIcon size={16} />, name: 'Hospital' },
              { icon: <HomeIcon size={16} />, name: 'GVMC Park' },
              { icon: <HomeIcon size={16} />, name: 'Railway Station' },
              { icon: <HomeIcon size={16} />, name: 'Fire Station' },
            ],
            owner: {
              name: data.users ? `${data.users.first_name} ${data.users.last_name}` : 'John Doe',
              email: data.users ? data.users.email : 'john@example.com',
              phone: data.users ? data.users.phone_number : '+91 9876543210',
            }
          };
          
          // Fetch similar properties
          const { data: similarData, error: similarError } = await supabase
            .from('properties')
            .select('*')
            .eq('property_type', data.property_type)
            .neq('id', id)
            .limit(2);
            
          if (!similarError && similarData) {
            enhancedProperty.similarProperties = similarData.map(p => ({
              id: p.id,
              title: p.title,
              rating: 4.8,
              location: `${p.city}`,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              area: p.area_sqft,
              image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg',
              type: `Entire ${p.property_type}`
            }));
          } else {
            enhancedProperty.similarProperties = [
              {
                id: '2',
                title: 'Fully Furnished Smart Studio Apartment',
                rating: 4.8,
                location: 'Pendurthi Viza',
                bedrooms: 2,
                bathrooms: 1,
                area: 2,
                image: 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg',
                type: 'Entire Studio Apartment'
              },
              {
                id: '3',
                title: 'Fully Furnished Smart Studio Apartment',
                rating: 4.8,
                location: 'Pendurthi Viza',
                bedrooms: 2,
                bathrooms: 1,
                area: 2,
                image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
                type: 'Entire Studio Apartment'
              }
            ];
          }
          
          setProperty(enhancedProperty);
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
        
        // Fallback to mock data
        const mockProperty = {
          id: '1',
          title: 'Fully Furnished Smart Studio Apartment',
          address: 'Daimond Park Visakhapatnam Andhrapradesh 530016',
          price: 5000000,
          monthly_rent: 25000,
          listing_type: 'RENT',
          property_type: 'apartment',
          bedrooms: 2,
          bathrooms: 4,
          area_sqft: 1440,
          floor: '2 out of 5',
          facing: 'North',
          furnishing_status: 'Furnished',
          rera_id: '1000000000000',
          latitude: 17.6868,
          longitude: 83.2185,
          description: 'Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto. Lorem Ipsum ha sido el texto de relleno estándar de las industrias desde el año 1500, cuando un impresor (N. del T. persona que se dedica a la imprenta) desconocido usó una galería de textos y los mezcló de tal manera',
          images: [
            'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg',
            'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
            'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
            'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
          ],
          videos: [
            'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
          ],
          amenities: [
            { icon: <Zap size={16} />, name: 'Power Backup' },
            { icon: <Shield size={16} />, name: '24/7 Security & CCTV' },
            { icon: <Car size={16} />, name: 'Parking' },
            { icon: <HomeIcon size={16} />, name: 'Power Backup' },
            { icon: <Wifi size={16} />, name: 'Children Play Area' },
            { icon: <Dumbbell size={16} />, name: '10+ Amenities' },
          ],
          nearbyHighlights: [
            { icon: <HomeIcon size={16} />, name: 'School' },
            { icon: <HomeIcon size={16} />, name: 'Hospital' },
            { icon: <HomeIcon size={16} />, name: 'GVMC Park' },
            { icon: <HomeIcon size={16} />, name: 'Railway Station' },
            { icon: <HomeIcon size={16} />, name: 'Fire Station' },
          ],
          owner: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+91 9876543210',
          },
          similarProperties: [
            {
              id: '2',
              title: 'Fully Furnished Smart Studio Apartment',
              rating: 4.8,
              location: 'Pendurthi Viza',
              bedrooms: 2,
              bathrooms: 1,
              area: 2,
              image: 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg',
              type: 'Entire Studio Apartment'
            },
            {
              id: '3',
              title: 'Fully Furnished Smart Studio Apartment',
              rating: 4.8,
              location: 'Pendurthi Viza',
              bedrooms: 2,
              bathrooms: 1,
              area: 2,
              image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
              type: 'Entire Studio Apartment'
            }
          ]
        };
        setProperty(mockProperty);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyDetails();
  }, [id]);

  const handleAutoInquiry = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!user || !property) return;

    setInquiryLoading(true);
    try {
      const { error } = await supabase
        .from('inquiries')
        .insert({
          property_id: property.id,
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone_number || '+91 9876543210',
          message: `Hi, I'm interested in this property: ${property.title}. Please contact me with more details.`,
          status: 'new'
        });
        
      if (error) throw error;
      
      // Show success message with notification info
      alert('✅ Your inquiry has been sent successfully!\n\nThe property owner has been notified and will contact you soon.');
    } catch (error) {
      console.error('Error sending auto inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleAutoTourRequest = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!user || !property) return;

    setTourLoading(true);
    try {
      // Set tour for tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          property_id: property.id,
          user_id: user.id,
          booking_date: tomorrowDate,
          booking_time: '10:00:00',
          notes: `Automatic tour request for ${property.title}`,
          status: 'pending'
        });
        
      if (error) throw error;
      
      // Show success message with notification info
      alert('✅ Your tour request has been submitted successfully!\n\nScheduled for tomorrow at 10:00 AM. The property owner has been notified and will confirm the schedule.');
    } catch (error) {
      console.error('Error booking tour:', error);
      alert('Failed to book tour. Please try again.');
    } finally {
      setTourLoading(false);
    }
  };
  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-[90px] flex items-center justify-center min-h-screen">
          <div className="animate-spin h-16 w-16 border-b-2 border-[#90C641] rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-[90px] flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h2>
            <button
              onClick={() => navigate('/')}
              className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35]"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-[70px] pb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center text-sm text-gray-600">
              <Link to="/" className="hover:text-[#90C641]">Home</Link>
              <span className="mx-2">›</span>
              <Link to="/buy" className="hover:text-[#90C641]">Properties</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-800">{property.title}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#3B5998] mb-2">
              {property.title}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin size={18} className="mr-2 text-red-500" />
              <span className="text-sm md:text-base">{property.address}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                {/* Tab Navigation */}
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab('photos')}
                    className={`flex-1 py-3 px-4 md:px-6 font-medium text-sm md:text-base ${
                      activeTab === 'photos'
                        ? 'bg-[#3B5998] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Camera className="inline mr-2" size={16} />
                    Photos
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex-1 py-3 px-4 md:px-6 font-medium text-sm md:text-base ${
                      activeTab === 'videos'
                        ? 'bg-[#3B5998] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Video className="inline mr-2" size={16} />
                    Videos
                  </button>
                </div>

                {/* Image/Video Display */}
                <div className="relative h-48 md:h-64 lg:h-80 xl:h-96">
                  {activeTab === 'photos' ? (
                    <>
                      <img
                        src={property.images[currentImageIndex]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      {property.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 p-1 md:p-2 rounded-full hover:bg-white shadow-lg"
                          >
                            <ChevronLeft size={20} className="md:w-6 md:h-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 p-1 md:p-2 rounded-full hover:bg-white shadow-lg"
                          >
                            <ChevronRight size={20} className="md:w-6 md:h-6" />
                          </button>
                          <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                            {currentImageIndex + 1} / {property.images.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <Video size={32} className="md:w-12 md:h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500 text-sm md:text-base">Video content coming soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#3B5998] mb-4">Description</h3>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">{property.description}</p>
              </div>

              {/* Amenities and Nearby */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amenities */}
                <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-[#3B5998] mb-4">Amenities</h3>
                  <div className="space-y-3">
                    {property.amenities.map((amenity: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          {amenity.icon}
                        </div>
                        <span className="text-gray-700 text-sm md:text-base">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nearby Highlights */}
                <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-[#3B5998] mb-4">Nearby highlights</h3>
                  <div className="space-y-3">
                    {property.nearbyHighlights.map((highlight: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          {highlight.icon}
                        </div>
                        <span className="text-gray-700 text-sm md:text-base">{highlight.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#3B5998] mb-4">Location</h3>
                <div className="h-48 md:h-64 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[property.latitude, property.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[property.latitude, property.longitude]}>
                      <Popup>{property.title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Right Column - Property Details */}
            <div className="space-y-6">
              {/* Property Details Card */}
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#3B5998] mb-4">Property Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Property type</span>
                    <span className="font-medium">2 BHK Flat</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Property Size</span>
                    <span className="font-medium">{property.area_sqft} SFT</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Property Facing</span>
                    <span className="font-medium">{property.facing}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Rera ID</span>
                    <span className="font-medium">{property.rera_id}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Floor</span>
                    <span className="font-medium">{property.floor}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Bedrooms</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Baths</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Furnishing</span>
                    <span className="font-medium">{property.furnishing_status}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#90C641]">
                      {property.listing_type === 'SALE' 
                        ? formatIndianCurrency(property.price)
                        : `${formatIndianCurrency(property.monthly_rent)}/month`
                      }
                    </p>
                    {property.listing_type === 'RENT' && property.security_deposit && (
                      <p className="text-sm text-gray-600 mt-1">
                        Security Deposit: {formatIndianCurrency(property.security_deposit)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleAutoInquiry}
                    disabled={inquiryLoading}
                    className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] transition-colors font-medium text-sm md:text-base disabled:opacity-50"
                  >
                    {inquiryLoading ? 'Sending...' : 'Send Enquiry'}
                  </button>
                  <button
                    onClick={handleAutoTourRequest}
                    disabled={tourLoading}
                    className="w-full bg-[#3B5998] text-white py-3 rounded-lg hover:bg-[#2d4373] transition-colors font-medium text-sm md:text-base disabled:opacity-50"
                  >
                    {tourLoading ? 'Booking...' : 'Request Tour'}
                  </button>
                </div>
              </div>

              {/* Map Widget */}
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="h-32 md:h-48">
                  <MapContainer
                    center={[property.latitude, property.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[property.latitude, property.longitude]}>
                      <Popup>{property.title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Properties */}
          <div className="mt-12">
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#3B5998]">Similar Properties</h3>
                <button className="text-[#90C641] hover:underline font-medium text-sm md:text-base">
                  See All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {property.similarProperties.map((similar: any) => (
                  <div key={similar.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={similar.image}
                      alt={similar.title}
                      className="w-full h-32 md:h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-semibold mb-2 text-sm md:text-base">{similar.title}</h4>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-4">
                          <Star size={14} className="md:w-4 md:h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-xs md:text-sm">{similar.rating}</span>
                        </div>
                        <span className="text-xs md:text-sm text-gray-600">{similar.location}</span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 mb-2">
                        {similar.bedrooms} guests • {similar.bathrooms} bedroom • {similar.area} bathroom
                      </div>
                      <div className="text-xs md:text-sm text-[#90C641] font-medium">
                        {similar.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Inquiry Modal */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Send Inquiry</h3>
                <button
                  onClick={() => setShowInquiryForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] transition-colors"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      // Submit inquiry to Supabase
                      const { error } = await supabase
                        .from('inquiries')
                        .insert({
                          property_id: property.id,
                          user_id: user.id,
                          name: e.currentTarget.form?.elements.namedItem('name')?.value,
                          email: e.currentTarget.form?.elements.namedItem('email')?.value,
                          phone: e.currentTarget.form?.elements.namedItem('phone')?.value,
                          message: e.currentTarget.form?.elements.namedItem('message')?.value,
                          status: 'new'
                        });
                        
                      if (error) throw error;
                      
                      alert('Inquiry sent successfully!');
                      setShowInquiryForm(false);
                    } catch (error) {
                      console.error('Error sending inquiry:', error);
                      alert('Failed to send inquiry. Please try again.');
                    }
                  }}
                >
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tour Request Modal */}
      {showTourForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Request Tour</h3>
                <button
                  onClick={() => setShowTourForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form className="space-y-4">
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5998]"
                />
                <input
                  type="time"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5998]"
                />
                <textarea
                  placeholder="Special requests or notes"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5998]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#3B5998] text-white py-3 rounded-lg hover:bg-[#2d4373] transition-colors"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      // Submit tour request to Supabase
                      const { error } = await supabase
                        .from('bookings')
                        .insert({
                          property_id: property.id,
                          user_id: user.id,
                          booking_date: e.currentTarget.form?.elements.namedItem('date')?.value,
                          booking_time: e.currentTarget.form?.elements.namedItem('time')?.value,
                          notes: e.currentTarget.form?.elements.namedItem('notes')?.value,
                          status: 'pending'
                        });
                        
                      if (error) throw error;
                      
                      alert('Tour request submitted successfully!');
                      setShowTourForm(false);
                    } catch (error) {
                      console.error('Error booking tour:', error);
                      alert('Failed to book tour. Please try again.');
                    }
                  }}
                >
                  Request Tour
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;