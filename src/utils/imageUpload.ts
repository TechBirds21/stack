import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export type RoomType = 
  | 'bedroom_1' 
  | 'bedroom_2' 
  | 'kitchen' 
  | 'balcony' 
  | 'hall' 
  | 'washroom_1' 
  | 'washroom_2' 
  | 'exterior' 
  | 'other';

export interface PropertyImage {
  file: File;
  roomType: RoomType;
  preview?: string;
}

/**
 * Uploads an image to Supabase storage and returns the public URL
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'images',
  folder: string = 'properties'
): Promise<string> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${uuidv4().substring(0, 8)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Uploads multiple property images with room type categorization
 */
export const uploadPropertyImages = async (
  images: PropertyImage[],
  propertyId: string
): Promise<{ url: string; roomType: RoomType; metadata: any }[]> => {
  try {
    const results = [];
    
    for (const image of images) {
      // Generate a unique filename with room type prefix
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${Date.now()}_${image.roomType}_${uuidv4().substring(0, 8)}.${fileExt}`;
      const filePath = `properties/${propertyId}/${fileName}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, image.file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Upload error for', image.roomType, ':', uploadError);
        continue; // Skip this image but continue with others
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
        
      // Store metadata about the image
      const metadata = {
        originalName: image.file.name,
        size: image.file.size,
        type: image.file.type,
        roomType: image.roomType,
        uploadedAt: new Date().toISOString()
      };
      
      results.push({
        url: data.publicUrl,
        roomType: image.roomType,
        metadata
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading property images:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase storage
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'images'
): Promise<boolean> => {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};