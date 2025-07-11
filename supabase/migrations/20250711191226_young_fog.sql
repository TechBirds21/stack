/*
  # Add room-specific image categorization

  1. Schema Updates
    - Add `room_images` JSONB column to properties table
    - Create property_images table for detailed image tracking
    
  2. Functions
    - Add function to organize property images by room type
    
  3. Indexes
    - Add index on room_images for better query performance
*/

-- Add room_images column to properties table
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS room_images JSONB DEFAULT '{}'::jsonb;

-- Create property_images table for detailed tracking
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  room_type text NOT NULL,
  original_filename text,
  file_size bigint,
  file_type text,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES public.users(id),
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON public.property_images(room_type);
CREATE INDEX IF NOT EXISTS idx_properties_room_images ON public.properties USING gin(room_images);

-- Enable RLS on property_images
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_images
CREATE POLICY "Users can view property images"
  ON public.property_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Property owners can manage their property images"
  ON public.property_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agents can manage assigned property images"
  ON public.property_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_images.property_id
      AND properties.agent_id = auth.uid()
    )
  );

-- Function to organize property images by room type
CREATE OR REPLACE FUNCTION organize_property_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the room_images JSON field based on property_images table
  UPDATE properties
  SET room_images = (
    SELECT jsonb_object_agg(room_type, array_agg(url))
    FROM (
      SELECT room_type, url
      FROM property_images
      WHERE property_id = NEW.property_id
      GROUP BY room_type, url
      ORDER BY room_type
    ) AS room_images_data
  )
  WHERE id = NEW.property_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update room_images when property_images changes
CREATE TRIGGER update_property_room_images
AFTER INSERT OR UPDATE OR DELETE ON public.property_images
FOR EACH ROW
EXECUTE FUNCTION organize_property_images();

-- Add agent_id column to properties if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN agent_id uuid REFERENCES public.users(id);
    CREATE INDEX idx_properties_agent_id ON public.properties(agent_id);
  END IF;
END $$;