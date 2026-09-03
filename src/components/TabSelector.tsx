import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBookOpen, FiCreditCard, FiHelpCircle } from 'react-icons/fi';

export type TabType = 'summary' | 'flashcards' | 'quiz';

interface TabSelectorProps {
  activeTab: TabType;
  totalFlashcards?: number;
  totalQuestions?: number;
}

const tabs = [
  { id: 'summary' as TabType, label: 'Summary', icon: FiBookOpen, path: '/summary' },
  { id: 'flashcards' as TabType, label: 'Flashcards', icon: FiCreditCard, path: '/flashcards' },
  { id: 'quiz' as TabType, label: 'Quiz', icon: FiHelpCircle, path: '/quiz' },
];

export const TabSelector: React.FC<TabSelectorProps> = ({
  activeTab,
  totalFlashcards = 0,
  totalQuestions = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (tab: TabType) => {
    const targetTab = tabs.find((t) => t.id === tab);
    if (targetTab) {
      navigate(targetTab.path, { state: location.state });
    }
  };

  const getTabCount = (tabId: TabType) => {
    switch (tabId) {
      case 'flashcards':
        return totalFlashcards > 0 ? `(${totalFlashcards})` : '';
      case 'quiz':
        return totalQuestions > 0 ? `(${totalQuestions})` : '';
      default:
        return '';
    }
  };

  return (
    <div className="mb-4">
      <div className="position-sticky" style={{ top: '80px', zIndex: 100 }}>
        <div
          className="d-flex gap-1 p-1 mx-auto"
          style={{
            backgroundColor: '#171a26',
            borderRadius: '12px',
            border: '1px solid #2a2f42',
            maxWidth: 'fit-content',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = getTabCount(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`btn d-flex align-items-center gap-2 px-3 py-2 fw-semibold ${
                  isActive ? 'btn-primary text-white' : 'btn-outline-light'
                }`}
                style={{
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '100px',
                  border: 'none',
                  backgroundColor: isActive ? '#6366F1' : 'transparent',
                  color: isActive ? '#fff' : '#9aa3b5',
                }}
              >
                <Icon size={16} />
                <span className="d-none d-sm-inline">{tab.label}</span>
                <span className="d-inline d-sm-none">
                  {tab.id === 'summary' ? 'Sum' : tab.id === 'flashcards' ? 'Cards' : 'Quiz'}
                </span>
                {count && <span className="small opacity-75">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
