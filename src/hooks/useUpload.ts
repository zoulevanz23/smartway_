import { useState, useCallback } from 'react';
import { uploadFile, UploadResult } from '@utils/uploadFile';
import { MAX_FILE_BYTES } from '@utils/constants';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const doUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError(`File too large. Max size is ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)}MB.`);
      return null;
    }
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);
    try {
      const uploadResult = await uploadFile(file, (p) => setProgress(p));
      setResult(uploadResult);
      return uploadResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
    setResult(null);
  }, []);

  return { progress, uploading, error, result, doUpload, reset };
}
