import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCreditCard, FiHelpCircle, FiTrash2, FiFolder, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useStudyPackStore } from '@store/studyPackStore';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HistoryPanel: React.FC = () => {
  const navigate = useNavigate();
  const history = useStudyPackStore((s) => s.history);
  const removeRecord = useStudyPackStore((s) => s.removeRecord);
  const clearHistory = useStudyPackStore((s) => s.clearHistory);
  const [open, setOpen] = useState(true);

  return (
    <div className="card-glass p-4 mx-auto mt-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <FiClock size={18} className="text-accent-indigo" />
          <h2 className="text-bright fw-bold fs-5 mb-0">History</h2>
          <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)', fontSize: 11 }}>
            {history.length}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {history.length > 0 && (
            <button type="button" onClick={clearHistory} className="btn btn-outline-light btn-sm">
              Clear all
            </button>
          )}
          {history.length > 0 && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="btn btn-outline-light btn-sm d-flex align-items-center gap-2" aria-expanded={open}>
              {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              {open ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>

      {history.length === 0 && (
        <p className="text-bright-muted mb-0 small">
          No saved study packs yet. Generate one and it will appear here so you can pick up where you left off.
        </p>
      )}

      {open && history.length > 0 && (
        <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
          {history.map((record) => {
            const cardCount = record.pack?.flashcards?.length ?? 0;
            const quizCount = record.pack?.quiz?.length ?? 0;
            return (
              <li
                key={record.id}
                className="d-flex align-items-center justify-content-between gap-3 p-3 flex-wrap"
                style={{ backgroundColor: 'rgba(18,16,42,0.6)', border: '1px solid rgba(129,140,248,0.16)', borderRadius: '12px' }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/pack/${record.id}`)}
                  className="btn p-0 text-start flex-grow-1"
                  style={{ background: 'none', border: 'none', minWidth: 220 }}
                  title="Open this study pack"
                >
                  <div className="text-bright fw-semibold d-flex align-items-center gap-2">
                    <FiFolder size={15} className="text-accent-indigo flex-shrink-0" />
                    <span className="text-truncate">{record.title}</span>
                    {record.isFallback && (
                      <span className="badge rounded-pill flex-shrink-0" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', fontSize: 10 }}>
                        Offline draft
                      </span>
                    )}
                  </div>
                  <div className="text-bright-muted small mt-1 d-flex align-items-center flex-wrap gap-3">
                    <span className="d-inline-flex align-items-center gap-1">
                      <FiClock size={12} />
                      {formatWhen(record.createdAt)}
                    </span>
                    <span className="d-inline-flex align-items-center gap-1">
                      <FiCreditCard size={12} />
                      {cardCount} cards
                    </span>
                    <span className="d-inline-flex align-items-center gap-1">
                      <FiHelpCircle size={12} />
                      {quizCount} questions
                    </span>
                  </div>
                </button>
                <div className="d-flex align-items-center gap-2">
                  <button type="button" onClick={() => navigate(`/pack/${record.id}`)} className="btn btn-outline-light btn-sm">
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecord(record.id)}
                    className="btn btn-sm d-flex align-items-center"
                    style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
                    aria-label={`Delete ${record.title}`}
                    title="Delete from history"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
