/*
  # Fix Foreign Key Relationships

  This migration ensures all foreign key relationships are properly established
  between tables to resolve Supabase query relationship errors.

  ## Tables and Relationships
  1. **users** - Base user table
  2. **properties** - Property listings (owner_id → users.id)
  3. **inquiries** - Property inquiries (property_id → properties.id, user_id → users.id, assigned_agent_id → users.id)
  4. **bookings** - Property bookings (property_id → properties.id, user_id → users.id, agent_id → users.id)
  5. **seller_profiles** - Seller information (user_id → users.id)
  6. **commissions** - Agent commissions (agent_id → users.id, property_id → properties.id, booking_id → bookings.id, inquiry_id → inquiries.id)
  7. **earnings** - Agent earnings (agent_id → users.id)
  8. **documents** - File uploads (uploaded_by → users.id)
  9. **email_verification_tokens** - Email verification (user_id → users.id)
  10. **notification_queue** - Email notifications (user_id → users.id)
  11. **agent_inquiry_assignments** - Agent assignments (inquiry_id → inquiries.id, agent_id → users.id)

  ## Security
  - All tables have RLS enabled where appropriate
  - Proper policies are in place for data access control
*/

-- Ensure all foreign key constraints exist
-- Some may already exist, so we use IF NOT EXISTS where possible

-- Properties table foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'properties_owner_id_fkey'
  ) THEN
    ALTER TABLE properties 
    ADD CONSTRAINT properties_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id);
  END IF;
END $$;

-- Inquiries table foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inquiries_property_id_fkey'
  ) THEN
    ALTER TABLE inquiries 
    ADD CONSTRAINT inquiries_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inquiries_user_id_fkey'
  ) THEN
    ALTER TABLE inquiries 
    ADD CONSTRAINT inquiries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inquiries_assigned_agent_id_fkey'
  ) THEN
    ALTER TABLE inquiries 
    ADD CONSTRAINT inquiries_assigned_agent_id_fkey 
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id);
  END IF;
END $$;

-- Bookings table foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_property_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_user_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_agent_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id);
  END IF;
END $$;

-- Seller profiles foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'seller_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE seller_profiles 
    ADD CONSTRAINT seller_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

-- Commissions table foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'commissions_agent_id_fkey'
  ) THEN
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'commissions_property_id_fkey'
  ) THEN
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'commissions_booking_id_fkey'
  ) THEN
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES bookings(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'commissions_inquiry_id_fkey'
  ) THEN
    ALTER TABLE commissions 
    ADD CONSTRAINT commissions_inquiry_id_fkey 
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id);
  END IF;
END $$;

-- Earnings table foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'earnings_agent_id_fkey'
  ) THEN
    ALTER TABLE earnings 
    ADD CONSTRAINT earnings_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id);
  END IF;
END $$;

-- Documents table foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_uploaded_by_fkey'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES users(id);
  END IF;
END $$;

-- Email verification tokens foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_verification_tokens_user_id_fkey'
  ) THEN
    ALTER TABLE email_verification_tokens 
    ADD CONSTRAINT email_verification_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Notification queue foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notification_queue_user_id_fkey'
  ) THEN
    ALTER TABLE notification_queue 
    ADD CONSTRAINT notification_queue_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Agent inquiry assignments foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'agent_inquiry_assignments_inquiry_id_fkey'
  ) THEN
    ALTER TABLE agent_inquiry_assignments 
    ADD CONSTRAINT agent_inquiry_assignments_inquiry_id_fkey 
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'agent_inquiry_assignments_agent_id_fkey'
  ) THEN
    ALTER TABLE agent_inquiry_assignments 
    ADD CONSTRAINT agent_inquiry_assignments_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on tables that don't have it enabled yet
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Refresh the schema cache to ensure Supabase recognizes the relationships
NOTIFY pgrst, 'reload schema';