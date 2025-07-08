# Database Migration Instructions

The error occurs because the `properties` table doesn't exist in your Supabase database. You need to manually apply the migration.

## Steps to Fix:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/20250704135846_hidden_grass.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see the following tables:
     - `users`
     - `properties` 
     - `bookings`
     - `inquiries`

5. **Check Sample Data**
   - Click on the `properties` table
   - You should see 6 sample properties inserted

Once you've completed these steps, refresh your application and the error should be resolved.

## Alternative: Quick Fix SQL

If you prefer, you can run just the essential parts. Here's the minimum SQL needed:

```sql
-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric,
  monthly_rent numeric,
  security_deposit numeric,
  property_type text NOT NULL,
  bedrooms integer,
  bathrooms integer,
  area_sqft numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  images text[],
  amenities text[],
  owner_id uuid,
  status text DEFAULT 'active',
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  listing_type text NOT NULL,
  available_from date,
  furnishing_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing active properties
CREATE POLICY "Anyone can view active properties"
  ON properties
  FOR SELECT
  USING (status = 'active');

-- Insert sample data
INSERT INTO properties (
  title, description, price, monthly_rent, property_type, 
  bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
  latitude, longitude, images, amenities, status, featured, verified, listing_type
) VALUES 
(
  'Beautiful 3BHK Apartment in Prime Location',
  'Spacious apartment with modern amenities in a prime location.',
  5000000, NULL, 'apartment', 3, 2, 1200, 'MG Road', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.6868, 83.2185, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Power Backup', 'Security', 'Parking'], 'active', true, true, 'SALE'
),
(
  'Luxury Villa with Garden',
  'Beautiful villa with spacious garden and modern amenities.',
  8500000, NULL, 'villa', 4, 3, 2500, 'Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530002',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
  ARRAY['Garden', 'Swimming Pool', 'Gym'], 'active', true, true, 'SALE'
),
(
  'Modern 2BHK Flat',
  'Contemporary flat with all modern amenities in a great location.',
  3500000, NULL, 'apartment', 2, 2, 950, 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', '530016',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Parking'], 'active', true, true, 'SALE'
);
```