import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          password_hash: string
          phone_number: string | null
          date_of_birth: string | null
          user_type: string
          status: string
          verification_status: string
          license_number: string | null
          agency: string | null
          experience: string | null
          profile_image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          password_hash: string
          phone_number?: string | null
          date_of_birth?: string | null
          user_type?: string
          status?: string
          verification_status?: string
          license_number?: string | null
          agency?: string | null
          experience?: string | null
          profile_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          password_hash?: string
          phone_number?: string | null
          date_of_birth?: string | null
          user_type?: string
          status?: string
          verification_status?: string
          license_number?: string | null
          agency?: string | null
          experience?: string | null
          profile_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          property_type: string
          property_category_id: string | null
          bedrooms: number
          bathrooms: number
          area_sqft: number
          address: string
          city: string
          state: string
          zip_code: string
          latitude: number | null
          longitude: number | null
          images: string[] | null
          amenities: string[] | null
          owner_id: string | null
          status: string | null
          featured: boolean | null
          verified: boolean | null
          created_at: string | null
          updated_at: string | null
          property_purpose: string | null
          monthly_rent: number | null
          security_deposit: number | null
          available_from: string | null
          furnishing_status: string | null
          balcony: number | null
          possession: string | null
          posted_date: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          property_type: string
          property_category_id?: string | null
          bedrooms?: number
          bathrooms?: number
          area_sqft: number
          address: string
          city: string
          state: string
          zip_code: string
          latitude?: number | null
          longitude?: number | null
          images?: string[] | null
          amenities?: string[] | null
          owner_id?: string | null
          status?: string | null
          featured?: boolean | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          property_purpose?: string | null
          monthly_rent?: number | null
          security_deposit?: number | null
          available_from?: string | null
          furnishing_status?: string | null
          balcony?: number | null
          possession?: string | null
          posted_date?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          property_type?: string
          property_category_id?: string | null
          bedrooms?: number
          bathrooms?: number
          area_sqft?: number
          address?: string
          city?: string
          state?: string
          zip_code?: string
          latitude?: number | null
          longitude?: number | null
          images?: string[] | null
          amenities?: string[] | null
          owner_id?: string | null
          status?: string | null
          featured?: boolean | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          property_purpose?: string | null
          monthly_rent?: number | null
          security_deposit?: number | null
          available_from?: string | null
          furnishing_status?: string | null
          balcony?: number | null
          possession?: string | null
          posted_date?: string | null
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          image_url: string
          room_type: string
          room_name: string | null
          description: string | null
          is_primary: boolean | null
          order_index: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          image_url: string
          room_type: string
          room_name?: string | null
          description?: string | null
          is_primary?: boolean | null
          order_index?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          image_url?: string
          room_type?: string
          room_name?: string | null
          description?: string | null
          is_primary?: boolean | null
          order_index?: number | null
          created_at?: string | null
        }
      }
      property_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      amenities: {
        Row: {
          id: string
          name: string
          icon: string | null
          category: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          category?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          category?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      property_amenities: {
        Row: {
          id: string
          property_id: string
          amenity_id: string
        }
        Insert: {
          id?: string
          property_id: string
          amenity_id: string
        }
        Update: {
          id?: string
          property_id?: string
          amenity_id?: string
        }
      }
      bookings: {
        Row: {
          id: string
          property_id: string
          user_id: string
          booking_date: string
          booking_time: string
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          booking_date: string
          booking_time: string
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          booking_date?: string
          booking_time?: string
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      inquiries: {
        Row: {
          id: string
          property_id: string
          user_id: string | null
          name: string
          email: string
          phone: string | null
          message: string
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          user_id?: string | null
          name: string
          email: string
          phone?: string | null
          message: string
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          message?: string
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}