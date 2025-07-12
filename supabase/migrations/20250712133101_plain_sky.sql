/*
  # Fix ambiguous prefix column reference

  1. Problem
    - The trigger function has an ambiguous reference to "prefix"
    - This causes errors when creating users

  2. Solution
    - Drop and recreate the trigger function with proper column qualification
    - Ensure all column references are unambiguous
    - Fix the custom ID generation logic
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
DROP FUNCTION IF EXISTS assign_user_custom_id();

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
    counter_record RECORD;
    new_counter_value BIGINT;
    user_prefix TEXT;
BEGIN
    -- Only assign custom_id if it's not already set
    IF NEW.custom_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Determine prefix based on user_type
    CASE NEW.user_type
        WHEN 'buyer' THEN user_prefix := 'BUYER';
        WHEN 'seller' THEN user_prefix := 'SELLER';
        WHEN 'agent' THEN user_prefix := 'AGENT';
        WHEN 'admin' THEN user_prefix := 'ADMIN';
        ELSE user_prefix := 'USER';
    END CASE;
    
    -- Get or create counter for this user type
    SELECT * INTO counter_record 
    FROM system_counters 
    WHERE id = NEW.user_type;
    
    IF NOT FOUND THEN
        -- Create new counter
        INSERT INTO system_counters (id, current_value, prefix)
        VALUES (NEW.user_type, 1, user_prefix)
        RETURNING current_value INTO new_counter_value;
    ELSE
        -- Increment existing counter
        UPDATE system_counters 
        SET current_value = system_counters.current_value + 1,
            updated_at = now()
        WHERE id = NEW.user_type
        RETURNING current_value INTO new_counter_value;
    END IF;
    
    -- Assign the custom_id
    NEW.custom_id := user_prefix || LPAD(new_counter_value::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER user_custom_id_trigger
    BEFORE INSERT OR UPDATE OF user_type ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_user_custom_id();

-- Also fix the property custom ID function if it exists
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;
DROP FUNCTION IF EXISTS assign_property_custom_id();

CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
    counter_record RECORD;
    new_counter_value BIGINT;
    property_prefix TEXT := 'PROP';
BEGIN
    -- Only assign custom_id if it's not already set
    IF NEW.custom_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get or create counter for properties
    SELECT * INTO counter_record 
    FROM system_counters 
    WHERE id = 'property';
    
    IF NOT FOUND THEN
        -- Create new counter
        INSERT INTO system_counters (id, current_value, prefix)
        VALUES ('property', 1, property_prefix)
        RETURNING current_value INTO new_counter_value;
    ELSE
        -- Increment existing counter
        UPDATE system_counters 
        SET current_value = system_counters.current_value + 1,
            updated_at = now()
        WHERE id = 'property'
        RETURNING current_value INTO new_counter_value;
    END IF;
    
    -- Assign the custom_id
    NEW.custom_id := property_prefix || LPAD(new_counter_value::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the property trigger
CREATE TRIGGER property_custom_id_trigger
    BEFORE INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION assign_property_custom_id();