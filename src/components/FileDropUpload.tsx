import React, { useState, useCallback, useRef } from 'react';
import {
  FiUpload,
  FiX,
  FiFile,
  FiCheck,
  FiExternalLink,
  FiFileText,
  FiEdit3,
  FiClipboard,
} from 'react-icons/fi';
import { uploadFile, UploadResult } from '@utils/uploadFile';

interface FileDropUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return <FiFileText size={20} />;
  if (extension === 'docx' || extension === 'doc') return <FiEdit3 size={20} />;
  if (extension === 'txt') return <FiClipboard size={20} />;
  return <FiFile size={20} />;
};

export const FileDropUpload: React.FC<FileDropUploadProps> = ({
  onUploadComplete,
  onUploadError,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadResult(null);
      setLocalError(null);

      try {
        const result = await uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        setUploadResult(result);
        onUploadComplete(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upload file';
        setLocalError(message);
        console.error('Upload error:', error);
        onUploadError(message);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, onUploadError]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
      ];

      const reject = (message: string) => {
        setLocalError(message);
        onUploadError(message);
      };

      // Some browsers report an empty MIME type; fall back to the extension.
      const looksAllowed =
        allowedTypes.includes(file.type) ||
        (!file.type && /\.(pdf|docx?|txt)$/i.test(file.name));

      if (!looksAllowed) {
        reject('Invalid file type. Please upload PDF (.pdf), Word (.docx, .doc), or text (.txt) files.');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        reject('File size too large. Please upload a file smaller than 50MB.');
        return;
      }

      if (file.size === 0) {
        reject('File is empty. Please select a valid file.');
        return;
      }

      void handleFileUpload(file);
    },
    [onUploadError, handleFileUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    // Clear the value so choosing the same file twice still fires onChange.
    e.target.value = '';
    if (file) handleFileSelect(file);
  };

  const openPicker = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    setLocalError(null);
  };

  if (uploadResult) {
    return (
      <div className="mb-4">
        <label className="form-label fw-semibold fs-6 mb-3">Document Uploaded Successfully</label>

        <div
          className="border rounded p-3"
          style={{
            borderRadius: '12px',
            borderColor: 'rgba(16, 185, 129, 0.5) !important',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
          }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <span style={{ color: '#10b981' }}>
                <FiCheck size={24} />
              </span>
              <div>
                <div className="text-bright fw-semibold d-flex align-items-center gap-2">
                  {getFileIcon(uploadResult.fileName)}
                  {uploadResult.fileName}
                </div>
                <div className="text-bright-muted small">
                  {(uploadResult.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded to storage
                </div>
                <a
                  href={uploadResult.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-indigo small d-flex align-items-center gap-1 mt-1"
                  style={{ textDecoration: 'none' }}
                >
                  <FiExternalLink size={12} />
                  View file
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={resetUpload}
              className="btn btn-sm btn-outline-primary"
              aria-label="Reset upload"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="form-label fw-semibold fs-6 mb-3">Upload Your Document</label>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload your document: drop a file here or press Enter to browse"
        aria-disabled={disabled}
        className={`border text-center ${dragActive ? 'border-accent' : ''} ${disabled ? 'opacity-50' : ''}`}
        style={{
          borderRadius: '12px',
          borderWidth: '2px',
          borderStyle: 'dashed',
          borderColor: dragActive ? '#6366F1' : '#2a2f42',
          backgroundColor: 'rgba(23, 26, 38, 0.6)',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem 1rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={openPicker}
        onKeyDown={handleZoneKeyDown}
        onDragEnter={disabled ? undefined : handleDrag}
        onDragLeave={disabled ? undefined : handleDrag}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
      >
        {isUploading ? (
          <>
            <span className="text-accent-indigo mb-3">
              <FiUpload size={40} />
            </span>
            <h5 className="text-bright mb-2">Uploading...</h5>
            <div className="progress w-75 mb-3" style={{ height: '8px' }}>
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-bright-muted">{uploadProgress}% complete</p>
          </>
        ) : (
          <>
            <span className="text-accent-indigo mb-3">
              <FiUpload size={40} />
            </span>
            <h5 className="text-bright mb-2">Drop your document here</h5>
            <p className="text-bright-muted mb-3">or click to browse files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileInput}
              className="d-none"
              id="supabaseFileInput"
              disabled={disabled || isUploading}
            />
            <span
              className="btn btn-outline-primary px-4 py-2"
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <FiFile className="me-2" />
              Choose File
            </span>
            <div className="text-bright-muted small mt-3">
              Supports: PDF, Word (.docx, .doc), Text files (max 50MB)
            </div>
          </>
        )}
      </div>

      {localError && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {localError}
        </div>
      )}
    </div>
  );
};
