import React from 'react';

// Fixed ambient aurora gradient blobs behind all page content.
// Decorates the background only; gated behind reduced-motion in CSS.
export const AuroraBackground: React.FC = () => {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <div className="aurora-blob aurora-blob-1 aurora-blob--1 aurora-bg-top-left" />
      <div className="aurora-blob aurora-blob-2 aurora-blob--2 aurora-bg-top-right" />
      <div className="aurora-blob aurora-blob-3 aurora-blob--3 aurora-bg-bottom" />
    </div>
  );
};
