import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCcw } from 'react-icons/fi';
import { Logo } from './Logo';

interface StudyNavigationProps {
  title: string;
  rightContent?: React.ReactNode;
}

export const StudyNavigation: React.FC<StudyNavigationProps> = ({ title, rightContent }) => {
  const navigate = useNavigate();
  return (
    <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4 flex-wrap gap-3">
      <div className="d-flex align-items-center gap-2 gap-md-3">
        <button onClick={() => navigate('/app')} className="btn btn-link text-bright-muted p-2" style={{ border: 'none', background: 'none' }} aria-label="Go to home">
          <FiArrowLeft size={20} />
        </button>
        <Logo size={32} showText={true} />
      </div>
      <h1 className="h5 h4-md fw-bold text-bright mb-0 text-center flex-grow-1 order-3 order-md-2" style={{ minWidth: '200px' }}>{title}</h1>
      <div className="d-flex align-items-center gap-2 order-2 order-md-3">
        {rightContent && <div className="me-2 me-md-3">{rightContent}</div>}
        <button onClick={() => navigate('/app')} className="btn d-flex align-items-center gap-1 gap-md-2 px-2 px-md-4 py-2 fw-semibold" style={{ backgroundColor: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', whiteSpace: 'nowrap' }}>
          <FiRefreshCcw size={14} />
          <span className="d-none d-sm-inline">Generate New Study Pack</span>
          <span className="d-inline d-sm-none">New Pack</span>
        </button>
      </div>
    </div>
  );
};