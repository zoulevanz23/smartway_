import { supabase, STORAGE_BUCKET } from '@lib/supabase';

export interface UploadResult {
  downloadURL: string;
  fileName: string;
  fileSize: number;
}

export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `uploads/${fileName}`;

    if (onProgress) {
      onProgress(0);
    }

    // Upload the file to Supabase Storage
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      const status =
        typeof (error as { status?: number }).status === 'number'
          ? (error as { status?: number }).status
          : undefined;
      const message = (error as { message?: string }).message || String(error);
      const code = (error as { code?: string }).code || '';

      // Provide a clearer, actionable message than the raw message
      if (status === 404 || /bucket|not found/i.test(message)) {
        throw new Error(
          `Storage bucket "${STORAGE_BUCKET}" not found or not public. Create a PUBLIC bucket named "${STORAGE_BUCKET}" in your Supabase dashboard.`
        );
      }
      if (status === 401 || status === 403 || /permission|unauthorized|denied/i.test(message)) {
        throw new Error(
          'Upload permission denied. Make sure the bucket is PUBLIC and your Supabase anon key is correct.'
        );
      }
      if (code === 'timeout' || /network|fetch|failed to fetch|load failed/i.test(message)) {
        throw new Error(
          'Network error reaching Supabase storage. Check your internet connection, that the project is active (not paused), and that CORS allows this origin.'
        );
      }
      if (status === 400 || /cors|origin/i.test(message)) {
        throw new Error(
          "Request blocked (likely CORS). Add this site's origin to Supabase > Project Settings > API > CORS."
        );
      }
      throw new Error(`Upload failed: ${message}`);
    }

    if (onProgress) {
      onProgress(50);
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get download URL');
    }

    if (onProgress) {
      onProgress(100);
    }

    return {
      downloadURL: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    } else {
      throw new Error('Failed to upload file. Please try again.');
    }
  }
};
