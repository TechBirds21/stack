/* ----------------------------------------------------------------
   src/components/PropertyMap.tsx
   ---------------------------------------------------------------- */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { formatIndianCurrency } from '../utils/currency';

/* ─────────────────────── Leaflet marker sprite in Vite/CRA ───── */
delete (Icon.Default.prototype as any)._getIconUrl;          // bundler-safe reset
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ─────────────────────────── Types ───────────────────────────── */
export interface Property {
  id: string;
  title: string;
  price: number | null;          // SALE : price, RENT : null
  monthly_rent: number | null;   // RENT : monthly_rent, SALE : null
  property_type: string;
  listing_type: 'SALE' | 'RENT';
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  images?: string[] | null;
}

interface PropertyMapProps {
  filters?: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    listingType?: 'SALE' | 'RENT';
  };
  onPropertySelect?: (p: Property) => void;
  height?: string;        // e.g. "400px" (default)
}

/* ───────────────────────── Component ─────────────────────────── */
const PropertyMap: React.FC<PropertyMapProps> = ({
  filters,
  onPropertySelect,
  height = '400px',
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [center, setCenter]         = useState<LatLngExpression>([17.6868, 83.2185]); // Vizag

  /* ─────────────── Data fetch (Flask API) ────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true); 
      try {
        // Build query
        let query = supabase
          .from('properties')
          .select('*')
          .eq('status', 'active');
        
        // Apply filters
        if (filters?.city) {
          query = query.ilike('city', `%${filters.city}%`);
        }
        
        if (filters?.propertyType) {
          query = query.eq('property_type', filters.propertyType);
        }
        
        if (filters?.listingType) {
          query = query.eq('listing_type', filters.listingType);
          
          // Add additional filters based on listing type
          if (filters.listingType === 'SALE') {
            query = query.not('price', 'is', null);
          } else if (filters.listingType === 'RENT') {
            query = query.not('monthly_rent', 'is', null);
          }
        }
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Filter out properties without coordinates
        const mapped = (data as Property[]).filter(p => p.latitude && p.longitude);
        setProperties(mapped);

        if (mapped.length) {
          setCenter([mapped[0].latitude, mapped[0].longitude]);
        }
      } catch (err) {
        console.error('Error fetching properties from Supabase:', err);
        
        // Fallback to mock data if Supabase fails
        const mockProperties = [
          {
            id: '1',
            title: 'Beautiful 3BHK Apartment',
            price: 5000000,
            monthly_rent: null,
            property_type: 'apartment',
            listing_type: 'SALE',
            bedrooms: 3,
            bathrooms: 2,
            area_sqft: 1200,
            address: 'MG Road',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            latitude: 17.6868,
            longitude: 83.2185,
            images: ['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg']
          },
          {
            id: '2',
            title: 'Luxury Villa with Garden',
            price: 8500000,
            monthly_rent: null,
            property_type: 'villa',
            listing_type: 'SALE',
            bedrooms: 4,
            bathrooms: 3,
            area_sqft: 2500,
            address: 'Beach Road',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            latitude: 17.7231,
            longitude: 83.3012,
            images: ['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg']
          },
          {
            id: '3',
            title: 'Modern 2BHK Flat',
            price: null,
            monthly_rent: 25000,
            property_type: 'apartment',
            listing_type: 'RENT',
            bedrooms: 2,
            bathrooms: 2,
            area_sqft: 950,
            address: 'Dwaraka Nagar',
            city: 'Visakhapatnam',
            state: 'Andhra Pradesh',
            latitude: 17.7326,
            longitude: 83.3332,
            images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg']
          }
        ];
        
        setProperties(mockProperties);
        if (mockProperties.length) {
          setCenter([mockProperties[0].latitude, mockProperties[0].longitude]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  /* ─────────────── Price helpers ─────────────────────────────── */
  const priceValue = (p: Property) => p.price ?? p.monthly_rent ?? 0;


  /* ─────────────── Custom Pin SVG → base64 ───────────────────── */
  const svgToB64 = (svg: string) =>
    'data:image/svg+xml;base64,' +
    btoa(unescape(encodeURIComponent(svg))); // keeps Unicode ₹

  const createPriceIcon = (value: number) =>
    new Icon({
      iconUrl: svgToB64(`
        <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="30" rx="15" fill="#90C641" stroke="#fff" stroke-width="2"/>
          <text x="60" y="20" text-anchor="middle" fill="#fff" font-family="Arial"
                font-size="12" font-weight="bold">${formatIndianCurrency(value)}</text>
          <polygon points="55,30 65,30 60,40" fill="#90C641"/>
        </svg>`),
      iconSize:     [120, 40],
      iconAnchor:   [60, 40],
      popupAnchor:  [0, -40],
    });

  /* ───────────────────────── Render ──────────────────────────── */
  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-[#90C641] rounded-full mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No properties found in this area</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {properties.map(p => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={createPriceIcon(priceValue(p))}
            eventHandlers={{ click: () => onPropertySelect?.(p) }}
          >
            <Popup>
              <div className="w-64">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                )}

                <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                <p className="text-[#90C641] font-bold text-xl mb-2">
                  {formatIndianCurrency(priceValue(p))}
                </p>

                <div className="text-sm text-gray-600 mb-2">
                  <p>{p.bedrooms} bed • {p.bathrooms} bath</p>
                  <p>{p.area_sqft.toLocaleString()} sqft</p>
                  <p>{p.address}</p>
                  <p>{p.city}, {p.state}</p>
                </div>

                <button
                  onClick={() => onPropertySelect?.(p)}
                  className="w-full bg-[#90C641] text-white py-2 px-4 rounded-lg hover:bg-[#7DAF35] transition-colors"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PropertyMap;
