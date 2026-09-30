export interface SocialLink {
  /** Feather icon key from react-icons/fi. */
  icon: 'linkedin' | 'github' | 'user';
  /** Accessible label and tooltip, e.g. "LinkedIn". */
  label: string;
  /** Profile URL opened in a new tab. */
  href: string;
  /** Brand accent used for the hover glow. */
  accent: string;
}

/**
 * Footer social links. The portfolio is still a placeholder — swap in your real
 * URL here and every footer picks the change up automatically.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    icon: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/josh-ivan-sartin-312287376/',
    accent: '#0a66c2',
  },
  {
    icon: 'github',
    label: 'GitHub',
    href: 'https://github.com/zoulevanz23',
    accent: '#818cf8',
  },
  {
    icon: 'user',
    label: 'Portfolio',
    href: 'https://your-portfolio.example.com',
    accent: '#f59e0b',
  },
];
