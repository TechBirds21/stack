-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create agent inquiry assignments table
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  assigned_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  notes text,
  UNIQUE(inquiry_id, agent_id)
);

-- Create notification queue for email sending
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'email_verification', 'agent_assignment', 'inquiry_notification'
  subject text NOT NULL,
  body text NOT NULL,
  email_to text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add email_verified column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified_at timestamptz;
  END IF;
END $$;

-- Add inquiry type and location to inquiries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inquiries' AND column_name = 'inquiry_type'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN inquiry_type text DEFAULT 'general' CHECK (inquiry_type IN ('purchase', 'rental', 'general'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inquiries' AND column_name = 'location'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inquiries' AND column_name = 'assigned_agent_id'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN assigned_agent_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Function to generate email verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to send email verification
CREATE OR REPLACE FUNCTION send_email_verification(user_id_param uuid)
RETURNS void AS $$
DECLARE
  user_record users%ROWTYPE;
  verification_token text;
  verification_url text;
  email_subject text;
  email_body text;
BEGIN
  -- Get user details
  SELECT * INTO user_record FROM users WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Generate verification token
  verification_token := generate_verification_token();
  
  -- Insert verification token
  INSERT INTO email_verification_tokens (user_id, token, expires_at)
  VALUES (user_id_param, verification_token, now() + interval '24 hours');
  
  -- Create verification URL
  verification_url := 'https://your-domain.com/verify-email?token=' || verification_token;
  
  -- Prepare email content
  email_subject := 'Verify Your Email - Home & Own';
  email_body := format('
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3B5998; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to Home & Own!</h1>
      </div>
      <div style="padding: 20px;">
        <h2>Hi %s,</h2>
        <p>Thank you for registering with Home & Own. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="%s" style="background: #90C641; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">%s</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          If you did not create an account, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  ', user_record.first_name, verification_url, verification_url);
  
  -- Queue email for sending
  INSERT INTO notification_queue (user_id, type, subject, body, email_to, metadata)
  VALUES (
    user_id_param,
    'email_verification',
    email_subject,
    email_body,
    user_record.email,
    jsonb_build_object('token', verification_token, 'expires_at', now() + interval '24 hours')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to verify email token
CREATE OR REPLACE FUNCTION verify_email_token(token_param text)
RETURNS jsonb AS $$
DECLARE
  token_record email_verification_tokens%ROWTYPE;
  result jsonb;
BEGIN
  -- Find and validate token
  SELECT * INTO token_record 
  FROM email_verification_tokens 
  WHERE token = token_param 
    AND expires_at > now() 
    AND verified_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired token');
  END IF;
  
  -- Mark token as verified
  UPDATE email_verification_tokens 
  SET verified_at = now() 
  WHERE id = token_record.id;
  
  -- Update user verification status
  UPDATE users 
  SET email_verified = true, 
      email_verified_at = now(),
      verification_status = 'verified'
  WHERE id = token_record.user_id;
  
  -- Create notification for admin
  INSERT INTO notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'Email Verified',
    'User email has been successfully verified',
    'verification',
    'user',
    token_record.user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Email verified successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to assign inquiry to agents
CREATE OR REPLACE FUNCTION assign_inquiry_to_agents(inquiry_id_param uuid)
RETURNS void AS $$
DECLARE
  inquiry_record inquiries%ROWTYPE;
  property_record properties%ROWTYPE;
  agent_record users%ROWTYPE;
  assignment_id uuid;
BEGIN
  -- Get inquiry details
  SELECT * INTO inquiry_record FROM inquiries WHERE id = inquiry_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inquiry not found';
  END IF;
  
  -- Get property details
  SELECT * INTO property_record FROM properties WHERE id = inquiry_record.property_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  -- Find available agents in the same city
  FOR agent_record IN 
    SELECT * FROM users 
    WHERE user_type = 'agent' 
      AND status = 'active' 
      AND verification_status = 'verified'
    ORDER BY created_at ASC
  LOOP
    -- Create assignment
    INSERT INTO agent_inquiry_assignments (inquiry_id, agent_id)
    VALUES (inquiry_id_param, agent_record.id)
    RETURNING id INTO assignment_id;
    
    -- Send notification to agent
    INSERT INTO notification_queue (
      user_id, 
      type, 
      subject, 
      body, 
      email_to,
      metadata
    )
    VALUES (
      agent_record.id,
      'agent_assignment',
      format('New %s Inquiry - %s', 
        CASE WHEN property_record.listing_type = 'SALE' THEN 'Purchase' ELSE 'Rental' END,
        property_record.city
      ),
      format('
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7C3AED; color: white; padding: 20px; text-align: center;">
            <h1>New Property Inquiry</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hi %s,</h2>
            <p>You have received a new <strong>%s inquiry</strong> for a property in <strong>%s</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Property Details:</h3>
              <p><strong>Title:</strong> %s</p>
              <p><strong>Type:</strong> %s</p>
              <p><strong>Location:</strong> %s, %s</p>
              <p><strong>Listing Type:</strong> %s</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Customer Details:</h3>
              <p><strong>Name:</strong> %s</p>
              <p><strong>Email:</strong> %s</p>
              <p><strong>Phone:</strong> %s</p>
              <p><strong>Message:</strong> %s</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-domain.com/agent/assignments?assignment=%s&action=accept" 
                 style="background: #90C641; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
                Accept Inquiry
              </a>
              <a href="https://your-domain.com/agent/assignments?assignment=%s&action=decline" 
                 style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
                Decline
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Note:</strong> This assignment will expire in 24 hours if not responded to.
            </p>
          </div>
        </body>
        </html>
      ',
        agent_record.first_name,
        CASE WHEN property_record.listing_type = 'SALE' THEN 'Purchase' ELSE 'Rental' END,
        property_record.city,
        property_record.title,
        property_record.property_type,
        property_record.address,
        property_record.city,
        property_record.listing_type,
        inquiry_record.name,
        inquiry_record.email,
        inquiry_record.phone,
        inquiry_record.message,
        assignment_id,
        assignment_id
      ),
      agent_record.email,
      jsonb_build_object(
        'assignment_id', assignment_id,
        'inquiry_id', inquiry_id_param,
        'property_id', property_record.id,
        'inquiry_type', CASE WHEN property_record.listing_type = 'SALE' THEN 'purchase' ELSE 'rental' END,
        'location', property_record.city
      )
    );
    
    -- Create notification in system
    INSERT INTO notifications (title, message, type, entity_type, entity_id)
    VALUES (
      format('New %s Inquiry Assignment', 
        CASE WHEN property_record.listing_type = 'SALE' THEN 'Purchase' ELSE 'Rental' END
      ),
      format('New inquiry assigned to agent %s %s for property in %s',
        agent_record.first_name, agent_record.last_name, property_record.city
      ),
      'agent_assignment',
      'inquiry',
      inquiry_id_param
    );
    
    -- Exit after first assignment (can be modified for multiple assignments)
    EXIT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle agent response to assignment
CREATE OR REPLACE FUNCTION respond_to_assignment(
  assignment_id_param uuid,
  response_param text, -- 'accepted' or 'declined'
  notes_param text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  assignment_record agent_inquiry_assignments%ROWTYPE;
  inquiry_record inquiries%ROWTYPE;
  agent_record users%ROWTYPE;
  property_record properties%ROWTYPE;
  result jsonb;
BEGIN
  -- Get assignment details
  SELECT * INTO assignment_record 
  FROM agent_inquiry_assignments 
  WHERE id = assignment_id_param AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Assignment not found or already responded');
  END IF;
  
  -- Check if assignment has expired
  IF assignment_record.expires_at < now() THEN
    UPDATE agent_inquiry_assignments 
    SET status = 'expired' 
    WHERE id = assignment_id_param;
    
    RETURN jsonb_build_object('success', false, 'message', 'Assignment has expired');
  END IF;
  
  -- Update assignment status
  UPDATE agent_inquiry_assignments 
  SET status = response_param,
      responded_at = now(),
      notes = notes_param
  WHERE id = assignment_id_param;
  
  -- Get related records
  SELECT * INTO inquiry_record FROM inquiries WHERE id = assignment_record.inquiry_id;
  SELECT * INTO agent_record FROM users WHERE id = assignment_record.agent_id;
  SELECT * INTO property_record FROM properties WHERE id = inquiry_record.property_id;
  
  IF response_param = 'accepted' THEN
    -- Assign inquiry to agent
    UPDATE inquiries 
    SET assigned_agent_id = assignment_record.agent_id,
        status = 'assigned'
    WHERE id = assignment_record.inquiry_id;
    
    -- Decline all other pending assignments for this inquiry
    UPDATE agent_inquiry_assignments 
    SET status = 'declined',
        responded_at = now(),
        notes = 'Auto-declined: Another agent accepted'
    WHERE inquiry_id = assignment_record.inquiry_id 
      AND id != assignment_id_param 
      AND status = 'pending';
    
    -- Notify customer about agent assignment
    INSERT INTO notification_queue (
      user_id,
      type,
      subject,
      body,
      email_to,
      metadata
    )
    VALUES (
      inquiry_record.user_id,
      'agent_assigned',
      'Agent Assigned to Your Property Inquiry',
      format('
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #90C641; color: white; padding: 20px; text-align: center;">
            <h1>Agent Assigned!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hi %s,</h2>
            <p>Great news! An agent has been assigned to your property inquiry.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Your Agent Details:</h3>
              <p><strong>Name:</strong> %s %s</p>
              <p><strong>Email:</strong> %s</p>
              <p><strong>Phone:</strong> %s</p>
              <p><strong>License:</strong> %s</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Property:</h3>
              <p><strong>Title:</strong> %s</p>
              <p><strong>Location:</strong> %s, %s</p>
            </div>
            
            <p>Your agent will contact you soon to discuss your requirements and schedule a viewing.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-domain.com/my-inquiries" 
                 style="background: #3B5998; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View My Inquiries
              </a>
            </div>
          </div>
        </body>
        </html>
      ',
        inquiry_record.name,
        agent_record.first_name,
        agent_record.last_name,
        agent_record.email,
        agent_record.phone_number,
        COALESCE(agent_record.agent_license_number, 'Pending'),
        property_record.title,
        property_record.address,
        property_record.city
      ),
      inquiry_record.email,
      jsonb_build_object(
        'assignment_id', assignment_id_param,
        'agent_id', assignment_record.agent_id,
        'inquiry_id', assignment_record.inquiry_id
      )
    );
    
    result := jsonb_build_object('success', true, 'message', 'Assignment accepted successfully');
    
  ELSE
    -- If declined, try to assign to next available agent
    PERFORM assign_inquiry_to_agents(assignment_record.inquiry_id);
    
    result := jsonb_build_object('success', true, 'message', 'Assignment declined');
  END IF;
  
  -- Create admin notification
  INSERT INTO notifications (title, message, type, entity_type, entity_id)
  VALUES (
    format('Agent %s Inquiry Assignment', 
      CASE WHEN response_param = 'accepted' THEN 'Accepted' ELSE 'Declined' END
    ),
    format('Agent %s %s has %s the inquiry assignment for property in %s',
      agent_record.first_name, agent_record.last_name, response_param, property_record.city
    ),
    'agent_response',
    'assignment',
    assignment_id_param
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enhanced trigger function for user registration
CREATE OR REPLACE FUNCTION enhanced_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Send email verification for new users
  IF TG_OP = 'INSERT' THEN
    -- Send verification email
    PERFORM send_email_verification(NEW.id);
    
    -- Create admin notification
    INSERT INTO notifications (title, message, type, entity_type, entity_id)
    VALUES (
      'New User Registration',
      format('New %s registered: %s %s (%s) - Email verification sent',
        NEW.user_type, NEW.first_name, NEW.last_name, COALESCE(NEW.custom_id, 'ID Pending')
      ),
      'user_registration',
      'user',
      NEW.id
    );
  END IF;
  
  -- Handle verification status changes
  IF TG_OP = 'UPDATE' AND OLD.email_verified IS DISTINCT FROM NEW.email_verified AND NEW.email_verified = true THEN
    INSERT INTO notifications (title, message, type, entity_type, entity_id)
    VALUES (
      'Email Verified',
      format('User %s %s (%s) has verified their email address',
        NEW.first_name, NEW.last_name, COALESCE(NEW.custom_id, 'ID Pending')
      ),
      'email_verification',
      'user',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enhanced trigger function for inquiries
CREATE OR REPLACE FUNCTION enhanced_inquiry_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_record properties%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get property details
    SELECT * INTO property_record FROM properties WHERE id = NEW.property_id;
    
    -- Set inquiry type based on property listing type
    UPDATE inquiries 
    SET inquiry_type = CASE 
      WHEN property_record.listing_type = 'SALE' THEN 'purchase'
      ELSE 'rental'
    END,
    location = property_record.city
    WHERE id = NEW.id;
    
    -- Create admin notification
    INSERT INTO notifications (title, message, type, entity_type, entity_id)
    VALUES (
      format('New %s Inquiry', 
        CASE WHEN property_record.listing_type = 'SALE' THEN 'Purchase' ELSE 'Rental' END
      ),
      format('New %s inquiry from %s (%s) for property in %s',
        CASE WHEN property_record.listing_type = 'SALE' THEN 'purchase' ELSE 'rental' END,
        NEW.name, NEW.email, property_record.city
      ),
      'inquiry',
      'inquiry',
      NEW.id
    );
    
    -- Assign to agents
    PERFORM assign_inquiry_to_agents(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
DROP TRIGGER IF EXISTS user_notification_trigger ON users;
CREATE TRIGGER user_notification_trigger
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_user_notification();

DROP TRIGGER IF EXISTS inquiry_notification_trigger ON inquiries;
CREATE TRIGGER inquiry_notification_trigger
  AFTER INSERT ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_inquiry_notification();

-- Enable RLS on new tables (FIXED: "ROLS" -> "ROW")
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own verification tokens" ON email_verification_tokens;
DROP POLICY IF EXISTS "Agents can view their assignments" ON agent_inquiry_assignments;
DROP POLICY IF EXISTS "Agents can update their assignments" ON agent_inquiry_assignments;
DROP POLICY IF EXISTS "Admin can view all assignments" ON agent_inquiry_assignments;
DROP POLICY IF EXISTS "Admin can manage notification queue" ON notification_queue;

-- Policies for email verification tokens
CREATE POLICY "email_verification_tokens_select_policy"
  ON email_verification_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for agent assignments
CREATE POLICY "agent_assignments_select_policy"
  ON agent_inquiry_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "agent_assignments_update_policy"
  ON agent_inquiry_assignments
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "admin_assignments_all_policy"
  ON agent_inquiry_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Policies for notification queue
CREATE POLICY "admin_notification_queue_policy"
  ON notification_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);

-- Insert sample data for testing
INSERT INTO notifications (title, message, type, entity_type, created_at) VALUES
('Email Verification System Active', 'Email verification system is now operational for all new user registrations', 'system', 'system', now() - interval '10 minutes'),
('Agent Assignment System Ready', 'Automated agent assignment system is now active for property inquiries', 'system', 'system', now() - interval '5 minutes');