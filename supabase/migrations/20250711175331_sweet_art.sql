/*
  # Add booking management functionality
  
  1. New Functions
    - update_booking_status: Function to update booking status and notify relevant parties
    - create_booking_notification: Function to create notifications for bookings
  
  2. Triggers
    - booking_status_trigger: Trigger to call update_booking_status on booking status change
    
  3. Indexes
    - idx_bookings_status: Index on bookings.status for faster filtering
    - idx_bookings_user_id: Index on bookings.user_id for faster user-specific queries
    - idx_bookings_property_id: Index on bookings.property_id for faster property-specific queries
*/

-- Create function to update booking status and notify
CREATE OR REPLACE FUNCTION update_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for status change
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id,
    read,
    created_at
  ) VALUES (
    'Booking Status Updated',
    CASE 
      WHEN NEW.status = 'confirmed' THEN 'Your booking has been confirmed'
      WHEN NEW.status = 'cancelled' THEN 'Your booking has been cancelled'
      WHEN NEW.status = 'completed' THEN 'Your booking has been completed'
      ELSE 'Your booking status has been updated to ' || NEW.status
    END,
    'booking',
    'booking',
    NEW.id,
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking status changes
CREATE TRIGGER booking_status_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_status();

-- Create function to create notifications for new bookings
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for property owner
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id,
    read,
    created_at
  ) VALUES (
    'New Booking Request',
    'A new booking request has been received for your property',
    'booking',
    'booking',
    NEW.id,
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new bookings
CREATE TRIGGER booking_notification_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_notification();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);

-- Add RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Property owners can view bookings for their properties
CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create bookings
CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );