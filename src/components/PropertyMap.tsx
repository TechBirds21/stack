/* ----------------------------------------------------------------
   src/components/PropertyMap.tsx
   ---------------------------------------------------------------- */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { propertiesAPI } from '../lib/api';

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
  id: number;
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
        /* propertiesAPI.list() maps filters → query-string for /api/properties */
        const data = await propertiesAPI.list(filters);
        const mapped = (data as Property[]).filter(p => p.latitude && p.longitude);
        setProperties(mapped);

        if (mapped.length) {
          setCenter([mapped[0].latitude, mapped[0].longitude]);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  /* ─────────────── Price helpers ─────────────────────────────── */
  const priceValue = (p: Property) => p.price ?? p.monthly_rent ?? 0;

  const formatPrice = (val: number) =>
    val >= 1_000_000
      ? `₹${(val / 1_000_000).toFixed(1)}M`
      : val >= 1_000
      ? `₹${(val / 1_000).toFixed(0)}K`
      : `₹${val.toLocaleString()}`;

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
                font-size="12" font-weight="bold">${formatPrice(value)}</text>
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
        <div className="animate-spin h-8 w-8 border-b-2 border-[#90C641] rounded-full" />
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
                  {formatPrice(priceValue(p))}
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
