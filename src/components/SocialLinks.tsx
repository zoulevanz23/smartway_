import React from 'react';
import { FiLinkedin, FiGithub, FiUser, type IconType } from 'react-icons/fi';
import { SOCIAL_LINKS, type SocialLink } from '@utils/socialLinks';

const ICONS: Record<SocialLink['icon'], IconType> = {
  linkedin: FiLinkedin,
  github: FiGithub,
  user: FiUser,
};

interface SocialLinksProps {
  /** Overrides the default SOCIAL_LINKS list. */
  links?: SocialLink[];
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ links = SOCIAL_LINKS, className = '' }) => (
  <ul className={`list-unstyled d-flex align-items-center justify-content-center gap-3 mb-0 ${className}`}>
    {links.map((link) => {
      const Icon = ICONS[link.icon];
      return (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            aria-label={link.label}
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              color: 'rgba(241,240,250,0.7)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(129,140,248,0.22)',
              transition: 'transform 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = link.accent;
              e.currentTarget.style.borderColor = link.accent;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 20px -8px ${link.accent}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(241,240,250,0.7)';
              e.currentTarget.style.borderColor = 'rgba(129,140,248,0.22)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Icon size={18} />
          </a>
        </li>
      );
    })}
  </ul>
);
