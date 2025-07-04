/* -------------------------------------------------------------------------- */
/*  PropertyDetails.tsx                                                       */
/* -------------------------------------------------------------------------- */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  User,
  Check,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { propertiesAPI, inquiriesAPI, bookingsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* -- Leaflet sprite fix (only once per bundle) ----------------------------- */
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ------------------------------- Helpers ---------------------------------- */
const money = (n: number | null | undefined) =>
  n == null || isNaN(+n)
    ? '—'
    : `₹${(+n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatPrice = money;
const formatRent = (n?: number | null) =>
  money(n) === '—' ? '—' : `${money(n)}/month`;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /* --- UI state ----------------------------------------------------------- */
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: '',
  });

  /* --------------------------- Fetch property ---------------------------- */
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const data = await propertiesAPI.get(id);
        setProperty(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* -------- Autofill inquiry when signed-in ------------------------------ */
  useEffect(() => {
    if (!profile) return;
    setInquiryData((prev) => ({
      ...prev,
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      phone: profile.phone_number ?? '',
    }));
  }, [profile]);

  /* ------------------------- Safe parsing of JSON fields ------------------ */
  const imageGroups = useMemo<Record<string, string[]>>(() => {
    const raw = property?.image_groups;
    let obj: Record<string, any> = {};
    if (typeof raw === 'string') {
      try { obj = JSON.parse(raw); } catch { obj = {}; }
    } else if (typeof raw === 'object' && raw !== null) {
      obj = raw;
    }
    // filter out anything that isn't an array of strings
    return Object.fromEntries(
      Object.entries(obj)
        .filter(
          ([, v]) =>
            Array.isArray(v) &&
            v.every((x) => typeof x === 'string')
        )
    );
  }, [property?.image_groups]);

  const amenities = useMemo<string[]>(() => {
    const raw = property?.amenities;
    if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
      return raw;
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every((x) => typeof x === 'string')
        ) {
          return parsed;
        }
      } catch {}
    }
    return [];
  }, [property?.amenities]);

  // flatten only the arrays we kept
  const flatImages = Object.values(imageGroups).flat();
  const currentImage =
    flatImages[currentImageIndex] ||
    'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg';

  /* ---------------------------- Handlers ---------------------------------- */
  const nextImage = () =>
    setCurrentImageIndex((i) =>
      flatImages.length ? (i + 1) % flatImages.length : 0
    );
  const prevImage = () =>
    setCurrentImageIndex((i) =>
      flatImages.length ? (i - 1 + flatImages.length) % flatImages.length : 0
    );

  const handleInquiryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setInquiryData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const handleBookingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setBookingData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await inquiriesAPI.create({ property_id: id, ...inquiryData });
      setSuccess('Your inquiry has been sent successfully!');
      setInquiryData((p) => ({ ...p, message: '' }));
      setShowInquiryForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await bookingsAPI.create({
        property_id: id,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        notes: bookingData.notes,
      });
      setSuccess('Your tour request has been booked successfully!');
      setBookingData({ date: '', time: '', notes: '' });
      setShowBookingForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to book tour.');
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------- Early returns (loading / 404) ------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-16 w-16 border-b-2 border-[#90C641] rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }
  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
          <Link
            to="/"
            className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35]"
          >
            Back to listings
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  /* ------------------------------ UI ------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* pt-20 = 5rem top-padding */}
      <main className="container mx-auto flex-1 px-4 pt-20 pb-10">
        {/* Success & Error banners */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <Check className="mr-2" size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-700">
              <X size={20} />
            </button>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Header */}
        <section className="flex flex-wrap justify-between items-start mb-6">
          <div className="max-w-xl">
            <div className="flex gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  property.listing_type === 'RENT'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                For {property.listing_type === 'RENT' ? 'Rent' : 'Sale'}
              </span>
              {property.verified && (
                <span className="bg-[#90C641] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Verified
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold">{property.title}</h1>
            <p className="text-gray-600 flex items-center mt-1">
              <MapPin size={18} className="mr-1" />
              {property.address}, {property.city}, {property.state}
            </p>
          </div>

          <div className="mt-4 md:mt-0 text-[#90C641] text-3xl font-bold">
            {property.listing_type === 'RENT'
              ? formatRent(property.monthly_rent)
              : formatPrice(property.price)}
          </div>
        </section>

        {/* Image gallery & side card */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            <div className="relative h-[380px] md:h-[460px] rounded-lg overflow-hidden">
              <img
                src={currentImage}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {flatImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {flatImages.length}
                  </div>
                </>
              )}
            </div>

            {flatImages.length > 1 && (
              <div className="grid grid-cols-6 gap-2 mt-2">
                {flatImages.slice(0, 6).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`h-16 rounded-lg overflow-hidden ${
                      i === currentImageIndex ? 'ring-2 ring-[#90C641]' : ''
                    }`}
                  >
                    <img
                      src={url}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">At a glance</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <span>Type:</span>
              <span className="font-medium capitalize">{property.property_type}</span>
              <span>Area:</span>
              <span className="font-medium">{property.area_sqft} sqft</span>
              <span>Beds:</span>
              <span className="font-medium">{property.bedrooms}</span>
              <span>Baths:</span>
              <span className="font-medium">{property.bathrooms}</span>
              {property.balcony && (
                <>
                  <span>Balconies:</span>
                  <span className="font-medium">{property.balcony}</span>
                </>
              )}
            </div>

            {property.owner && (
              <>
                <hr className="my-5" />
                <h3 className="font-medium mb-3">Contact Owner / Agent</h3>
                <div className="flex items-center mb-3">
                  {property.owner.profile_image_url ? (
                    <img
                      src={property.owner.profile_image_url}
                      alt="owner"
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                      <User size={24} className="text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{property.owner.name}</p>
                    <p className="text-xs text-gray-500">{property.owner.email}</p>
                  </div>
                </div>
                {property.owner.phone && (
                  <p className="flex items-center text-gray-700 text-sm mb-1">
                    <Phone size={16} className="mr-2 text-[#90C641]" />
                    {property.owner.phone}
                  </p>
                )}
              </>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowInquiryForm(true)}
                className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35]"
              >
                Send Inquiry
              </button>
              <button
                onClick={() => setShowBookingForm(true)}
                className="w-full bg-[#1E3A8A] text-white py-3 rounded-lg hover:bg-[#1E40AF]"
              >
                Request Tour
              </button>
            </div>
          </aside>
        </section>

        {/* Description */}
        {property.description && (
          <section className="bg-white rounded-lg shadow p-6 mb-10">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {property.description}
            </p>
          </section>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <section className="bg-white rounded-lg shadow p-6 mb-10">
            <h2 className="text-xl font-semibold mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-3">
              {amenities.map((a, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Map */}
        {typeof property.latitude === 'number' &&
          typeof property.longitude === 'number' && (
            <section className="bg-white rounded-lg shadow p-6 mb-10">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="h-[360px] rounded-lg overflow-hidden">
                <MapContainer
                  center={[property.latitude, property.longitude]}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[property.latitude, property.longitude]}>
                    <Popup>{property.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <p className="mt-4 text-gray-700">
                {property.address}, {property.city}, {property.state} –{' '}
                {property.zip_code}
              </p>
            </section>
          )}

        {/* Room-wise gallery */}
        {Object.entries(imageGroups).length > 0 && (
          <section className="bg-white rounded-lg shadow p-6 mb-10">
            <h2 className="text-xl font-semibold mb-4">Gallery</h2>
            {Object.entries(imageGroups).map(([room, urls]) => (
              <div key={room} className="mb-6">
                <h3 className="mb-3 font-medium capitalize">
                  {room.replace(/_/g, ' ')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {urls.map((u, i) => (
                    <img
                      key={i}
                      src={u}
                      alt={room}
                      className="h-48 w-full object-cover rounded-lg hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      <Footer />

      {/* Inquiry Modal */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setShowInquiryForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center mb-6">Send Inquiry</h2>
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={inquiryData.name}
                    onChange={handleInquiryChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={inquiryData.email}
                    onChange={handleInquiryChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={inquiryData.phone}
                    onChange={handleInquiryChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={inquiryData.message}
                    onChange={handleInquiryChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#90C641] text-white py-3 rounded-lg hover:bg-[#7DAF35] disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Send Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setShowBookingForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center mb-6">Request a Tour</h2>
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-gray-700 mb-4">
                    Please sign in to book a property tour.
                  </p>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="bg-[#90C641] text-white px-6 py-2 rounded-lg hover:bg-[#7DAF35]"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={bookingData.date}
                      onChange={handleBookingChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={bookingData.time}
                      onChange={handleBookingChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={bookingData.notes}
                      onChange={handleBookingChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#90C641] focus:ring-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1E3A8A] text-white py-3 rounded-lg hover:bg-[#1E40AF] disabled:opacity-50"
                  >
                    {submitting ? 'Booking…' : 'Book Tour'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
