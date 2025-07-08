import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string | null;
          date_of_birth: string | null;
          user_type: string;
          status: string;
          verification_status: string;
          created_at: string | null;
        };
      };
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number | null;
          property_type: string;
          bedrooms: number | null;
          bathrooms: number | null;
          area_sqft: number;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          latitude: number | null;
          longitude: number | null;
          images: string[] | null;
          amenities: string[] | null;
          owner_id: string | null;
          status: string | null;
          featured: boolean | null;
          verified: boolean | null;
          created_at: string | null;
          listing_type: 'SALE' | 'RENT';
          monthly_rent: number | null;
          security_deposit: number | null;
          available_from: string | null;
          furnishing_status: string | null;
        };
      };
    };
  };
};