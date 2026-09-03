import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 56, showText = true, className = '' }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`d-flex align-items-center gap-2 ${className}`}
      style={{ cursor: 'pointer' }}
      onClick={() => navigate('/')}
      aria-label="SmartWay home"
    >
      <img
        src={logoSvg}
        alt="SmartWay Logo"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(99, 91, 255, 0.35)',
          flexShrink: 0,
          display: 'block',
        }}
      />
      {showText && (
        <div className="d-flex flex-column" style={{ lineHeight: 1.1 }}>
          <span
            className="font-display fw-bold"
            style={{ fontSize: `${size * 0.32}px`, color: '#f1f0fa' }}
          >
            SmartWay
          </span>
          <span className="text-bright-muted" style={{ fontSize: `${size * 0.2}px` }}>
            Study Tool
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
