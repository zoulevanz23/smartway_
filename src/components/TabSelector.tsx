import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FiBookOpen, FiCreditCard, FiHelpCircle } from 'react-icons/fi';

interface TabSelectorProps {
  totalFlashcards?: number;
  totalQuestions?: number;
}

const tabs = [
  { id: 'summary', label: 'Summary', icon: FiBookOpen, path: '/summary' },
  { id: 'flashcards', label: 'Flashcards', icon: FiCreditCard, path: '/flashcards' },
  { id: 'quiz', label: 'Quiz', icon: FiHelpCircle, path: '/quiz' },
];

export const TabSelector: React.FC<TabSelectorProps> = ({ totalFlashcards = 0, totalQuestions = 0 }) => {
  const { slug } = useParams<{ slug: string }>();
  const base = slug ? `/pack/${slug}` : '';
  const getTabCount = (tabId: string) => {
    if (tabId === 'flashcards') return totalFlashcards > 0 ? `(${totalFlashcards})` : '';
    if (tabId === 'quiz') return totalQuestions > 0 ? `(${totalQuestions})` : '';
    return '';
  };
  return (
    <div className="mb-4">
      <div className="position-sticky" style={{ top: '80px', zIndex: 100 }}>
        <div className="d-flex gap-1 p-1 mx-auto" style={{ backgroundColor: '#171a26', borderRadius: '12px', border: '1px solid #2a2f42', maxWidth: 'fit-content' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = getTabCount(tab.id);
            const fullPath = base + tab.path;
            return (
              <NavLink key={tab.id} to={fullPath} end={false} className={({ isActive }) => `btn d-flex align-items-center gap-2 px-3 py-2 fw-semibold ${isActive ? 'btn-primary text-white' : 'btn-outline-light'}`} style={{ borderRadius: '8px', fontSize: '14px', minWidth: '100px', border: 'none', backgroundColor: 'transparent', color: '#9aa3b5' }}>
                <Icon size={16} />
                <span className="d-none d-sm-inline">{tab.label}</span>
                <span className="d-inline d-sm-none">{tab.id === 'summary' ? 'Sum' : tab.id === 'flashcards' ? 'Cards' : 'Quiz'}</span>
                {count && <span className="small opacity-75">{count}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
