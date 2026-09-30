import { supabase, STORAGE_BUCKET, getSignedUrl } from '@lib/supabase';
import { MAX_FILE_BYTES } from '@utils/constants';

export interface UploadResult {
  downloadURL: string;
  fileName: string;
  fileSize: number;
  signedURL?: string;
}

export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File size must be less than ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)}MB.`);
  }
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `anon/${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `${STORAGE_BUCKET}/${fileName}`;

    if (onProgress) onProgress(0);

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : undefined;
      const message = (error as { message?: string }).message || String(error);
      const code = (error as { code?: string }).code || '';
      if (status === 404 || /bucket|not found/i.test(message)) throw new Error(`Storage bucket "${STORAGE_BUCKET}" not found.`);
      if (status === 401 || status === 403 || /permission|unauthorized/i.test(message)) throw new Error('Upload permission denied.');
      if (code === 'timeout' || /network|fetch/i.test(message)) throw new Error('Network error reaching Supabase.');
      throw new Error(`Upload failed: ${message}`);
    }

    if (onProgress) onProgress(50);

    const signedURL = await getSignedUrl(filePath);

    if (onProgress) onProgress(100);

    return { downloadURL: signedURL, fileName: file.name, fileSize: file.size, signedURL };
  } catch (error) {
    if (error instanceof Error) {
      // A DNS/offline failure surfaces as a bare "Failed to fetch", which tells
      // the user nothing. Name the actual problem.
      if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
        throw new Error(
          'Cannot reach the document storage service. Check your internet connection, and verify the Supabase project URL in .env is correct and running.'
        );
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Failed to upload file.');
  }
};