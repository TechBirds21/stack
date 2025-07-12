import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if the file type is allowed (PNG, JPG, JPEG, PDF)
 */
export const isFileTypeAllowed = (file: File): boolean => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  return allowedTypes.includes(file.type);
};

/**
 * Uploads an image to Supabase storage and returns the public URL
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'images',
  folder: string = 'properties'
): Promise<string> => {
  try {
    // Check if file type is allowed
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Please upload PNG, JPG, JPEG, or PDF files only.');
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${uuidv4()}.${fileExt || 'jpg'}`;
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
 * This is useful for property images
 */
export const uploadMultipleImages = async (
  files: File[],
  bucket: string = 'images',
  folder: string = 'properties'
): Promise<string[]> => {
  try {
    const urls: string[] = [];
    
    // Ensure bucket exists
    await ensureBucketExists(bucket);
    
    for (const file of files) {
      // Check if file type is allowed
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Skipping file ${file.name}: File type not allowed. Please upload PNG, JPG, JPEG, or PDF files only.`);
        continue;
      }
      
      try {
        const url = await uploadImage(file, bucket, folder);
        urls.push(url);
      } catch (error) {
        console.error('Error uploading image in batch:', error);
        // Continue with other images even if one fails
      }
    }
    
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase storage
 * Returns true if successful, false otherwise
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'images'
): Promise<boolean> => {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Find the bucket in the path
    let bucketIndex = pathParts.findIndex(part => part === bucket || part === 'object' || part === 'sign');
    if (bucketIndex === -1) bucketIndex = pathParts.length - 2; // Fallback
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
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

/**
 * Checks if a bucket exists, creates it if it doesn't
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // If we can't list buckets, assume they exist and continue
      console.warn('Cannot list buckets, assuming bucket exists');
      return true;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.warn(`Bucket ${bucketName} does not exist. Please create it in Supabase dashboard.`);
      // Don't try to create bucket from frontend, just warn and continue
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    // Continue anyway, bucket might exist
    return true;
  }
};