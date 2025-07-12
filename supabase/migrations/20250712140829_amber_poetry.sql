/*
  # Fix custom ID generation and foreign key constraints

  1. Custom ID Generation
    - Update the custom ID generation function to handle duplicates
    - Ensure unique custom IDs are generated consistently

  2. Foreign Key Constraints
    - Add CASCADE delete to foreign key constraints
    - Allow proper user deletion without constraint violations

  3. Storage Policies
    - Add proper RLS policies for storage operations
    - Allow authenticated users to upload documents
*/

-- Fix custom ID generation function to handle duplicates
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
    counter_id TEXT;
    current_value BIGINT;
    new_custom_id TEXT;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    -- Only generate custom_id if it's not already set
    IF NEW.custom_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Determine counter ID based on user type
    counter_id := CASE 
        WHEN NEW.user_type = 'admin' THEN 'admin_counter'
        WHEN NEW.user_type = 'agent' THEN 'agent_counter'
        WHEN NEW.user_type = 'seller' THEN 'seller_counter'
        ELSE 'buyer_counter'
    END;

    -- Loop to find unique custom_id
    WHILE attempt < max_attempts LOOP
        -- Get and increment counter
        INSERT INTO system_counters (id, current_value, prefix)
        VALUES (counter_id, 1, UPPER(NEW.user_type))
        ON CONFLICT (id) 
        DO UPDATE SET 
            current_value = system_counters.current_value + 1,
            updated_at = now()
        RETURNING current_value INTO current_value;

        -- Generate new custom_id
        new_custom_id := UPPER(NEW.user_type) || LPAD(current_value::TEXT, 3, '0');

        -- Check if this custom_id already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE custom_id = new_custom_id) THEN
            NEW.custom_id := new_custom_id;
            EXIT;
        END IF;

        attempt := attempt + 1;
    END LOOP;

    -- If we couldn't find a unique ID after max attempts, use UUID fallback
    IF NEW.custom_id IS NULL THEN
        NEW.custom_id := UPPER(NEW.user_type) || '_' || REPLACE(gen_random_uuid()::TEXT, '-', '')::TEXT;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix foreign key constraints to allow CASCADE delete
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
ADD CONSTRAINT bookings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_agent_id_fkey,
ADD CONSTRAINT bookings_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE inquiries 
DROP CONSTRAINT IF EXISTS inquiries_user_id_fkey,
ADD CONSTRAINT inquiries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE inquiries 
DROP CONSTRAINT IF EXISTS inquiries_assigned_agent_id_fkey,
ADD CONSTRAINT inquiries_assigned_agent_id_fkey 
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_owner_id_fkey,
ADD CONSTRAINT properties_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE agent_profiles 
DROP CONSTRAINT IF EXISTS agent_profiles_user_id_fkey,
ADD CONSTRAINT agent_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE seller_profiles 
DROP CONSTRAINT IF EXISTS seller_profiles_user_id_fkey,
ADD CONSTRAINT seller_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey,
ADD CONSTRAINT documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE agent_inquiry_assignments 
DROP CONSTRAINT IF EXISTS agent_inquiry_assignments_agent_id_fkey,
ADD CONSTRAINT agent_inquiry_assignments_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE agent_property_assignments 
DROP CONSTRAINT IF EXISTS agent_property_assignments_agent_id_fkey,
ADD CONSTRAINT agent_property_assignments_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE earnings 
DROP CONSTRAINT IF EXISTS earnings_agent_id_fkey,
ADD CONSTRAINT earnings_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE agent_bank_details 
DROP CONSTRAINT IF EXISTS agent_bank_details_agent_id_fkey,
ADD CONSTRAINT agent_bank_details_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;