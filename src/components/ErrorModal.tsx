import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';

interface ErrorModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  show,
  onClose,
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: 'rgba(14, 16, 24, 0.75)',
          zIndex: 1060,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="position-relative"
          style={{ maxWidth: '440px', width: '90%', margin: '0 auto' }}
        >
          <div
            className="text-center position-relative"
            style={{
              backgroundColor: '#171a26',
              border: '1px solid #2a2f42',
              borderRadius: '16px',
              padding: '2rem',
            }}
          >
            <button
              onClick={onClose}
              className="btn position-absolute d-flex align-items-center justify-content-center"
              style={{
                top: '12px',
                right: '12px',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: '#9aa3b5',
              }}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>

            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
              }}
            >
              <FiAlertCircle size={30} />
            </div>

            <h3 className="text-bright fw-bold mb-2" style={{ fontSize: '1.25rem' }}>
              {title}
            </h3>

            <p className="text-bright-muted mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
              {message}
            </p>

            <div className="d-flex gap-2 justify-content-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2"
                >
                  <FiRefreshCw size={16} />
                  Try Again
                </button>
              )}
              <button
                onClick={onClose}
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
