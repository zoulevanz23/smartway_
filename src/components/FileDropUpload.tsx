import React, { useState, useCallback } from 'react';
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
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

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

      try {
        const result = await uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        setUploadResult(result);
        onUploadComplete(result);
      } catch (error) {
        console.error('Upload error:', error);
        onUploadError(error instanceof Error ? error.message : 'Failed to upload file');
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

      if (!allowedTypes.includes(file.type)) {
        onUploadError(
          'Invalid file type. Please upload PDF (.pdf), Word (.docx, .doc), or text (.txt) files.'
        );
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        onUploadError('File size too large. Please upload a file smaller than 50MB.');
        return;
      }

      if (file.size === 0) {
        onUploadError('File is empty. Please select a valid file.');
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
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
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
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileInput}
              className="d-none"
              id="supabaseFileInput"
              disabled={disabled || isUploading}
            />
            <label
              htmlFor="supabaseFileInput"
              className="btn btn-outline-primary px-4 py-2"
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <FiFile className="me-2" />
              Choose File
            </label>
            <div className="text-bright-muted small mt-3">
              Supports: PDF, Word (.docx, .doc), Text files (max 50MB)
            </div>
          </>
        )}
      </div>
    </div>
  );
};
