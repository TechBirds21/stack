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
          custom_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string | null;
          date_of_birth: string | null;
          user_type: string;
          status: string;
          verification_status: string;
          email_verified: boolean | null;
          email_verified_at: string | null;
          agent_license_number: string | null;
          city: string | null;
          state: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      agent_profiles: {
        Row: {
          id: string;
          user_id: string;
          education_background: string | null;
          specialization: string | null;
          bio: string | null;
          experience_years: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      properties: {
        Row: {
          id: string;
          custom_id: string | null;
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
          listing_type: 'SALE' | 'RENT';
          monthly_rent: number | null;
          security_deposit: number | null;
          available_from: string | null;
          furnishing_status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      inquiries: {
        Row: {
          id: string;
          property_id: string;
          user_id: string | null;
          assigned_agent_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          status: string | null;
          inquiry_type: string | null;
          location: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      agent_inquiry_assignments: {
        Row: {
          id: string;
          inquiry_id: string;
          agent_id: string;
          status: string | null;
          assigned_at: string | null;
          expires_at: string | null;
          responded_at: string | null;
          notes: string | null;
        };
      };
      agent_property_assignments: {
        Row: {
          id: string;
          property_id: string;
          agent_id: string;
          status: string | null;
          assigned_at: string | null;
          notes: string | null;
        };
      };
    };
  };
};