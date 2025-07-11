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
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param folder The folder path within the bucket
 * @returns The public URL of the uploaded image
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<string> => {
  try {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
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
 * @param file The file to upload
 * @param propertyId The ID of the property
 * @param roomType The type of room (bedroom_1, kitchen, etc.)
 * @returns The public URL of the uploaded image and metadata
 */
export const uploadPropertyImage = async (
  file: File,
  propertyId: string,
  roomType: RoomType
): Promise<{ url: string; roomType: RoomType; metadata: any }> => {
  try {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
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
 * Uploads multiple images to Supabase storage and returns an array of public URLs
 * @param files Array of files to upload
 * @param bucket The storage bucket name
 * @param folder The folder path within the bucket
 * @returns Array of public URLs for the uploaded images
 */
export const uploadMultipleImages = async (
  files: File[],
  bucket: string = 'property-images',
  folder: string = 'properties'
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, bucket, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Uploads multiple property images with room type categorization
 * @param images Array of property images with room types
 * @param propertyId The ID of the property
 * @returns Array of image objects with URLs and metadata
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
 * @param url The public URL of the image to delete
 * @param bucket The storage bucket name
 * @returns True if deletion was successful
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