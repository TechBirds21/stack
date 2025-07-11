import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
    
    console.log(`Uploading file to ${bucket}/${filePath}`);
    
    // Upload the file
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('File uploaded successfully:', data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    console.log('Public URL:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Uploads multiple images and returns their public URLs
 */
export const uploadMultipleImages = async (
  files: File[],
  bucket: string = 'images',
  folder: string = 'properties'
): Promise<string[]> => {
  try {
    const urls: string[] = [];
    
    for (const file of files) {
      const url = await uploadImage(file, bucket, folder);
      urls.push(url);
    }
    
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
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
    
    console.log(`Deleting file from ${bucket}/${filePath}`);
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
      
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};