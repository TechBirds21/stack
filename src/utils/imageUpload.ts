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
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<string> => {
  try {
    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw createError;
      }
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
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
 * Uploads a property image with room type categorization
 */
export const uploadPropertyImage = async (
  file: File,
  propertyId: string,
  roomType: RoomType
): Promise<{ url: string; roomType: RoomType; metadata: any }> => {
  try {
    // Generate a unique filename with room type prefix
    const fileExt = file.name.split('.').pop();
    const fileName = `${roomType}_${uuidv4()}.${fileExt}`;
    const filePath = `properties/${propertyId}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);
      
    // Store metadata about the image
    const metadata = {
      originalName: file.name,
      size: file.size,
      type: file.type,
      roomType: roomType,
      uploadedAt: new Date().toISOString()
    };
    
    return {
      url: data.publicUrl,
      roomType,
      metadata
    };
  } catch (error) {
    console.error('Error uploading property image:', error);
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
    const uploadPromises = images.map(image => 
      uploadPropertyImage(image.file, propertyId, image.roomType)
    );
    return await Promise.all(uploadPromises);
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
  bucket: string = 'property-images'
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