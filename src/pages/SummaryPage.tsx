import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StudyNavigation } from '@components/StudyNavigation';
import { TabSelector } from '@components/TabSelector';
import { SummaryView } from '@components/SummaryView';
import { ExportOptions } from '@components/ExportOptions';
import { FiBookOpen, FiCreditCard, FiHelpCircle } from 'react-icons/fi';

interface KeyPoint {
  title: string;
  explanation: string;
}

interface SummaryData {
  overview: string;
  keyPoints: KeyPoint[] | string[];
  definitions: Record<string, string> | Array<{ term: string; definition: string }>;
  keyConcepts?: string[];
}

function buildSummaryContent(data: SummaryData): string {
  const lines: string[] = [];
  lines.push('STUDY SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Overview:\n${data.overview}`);
  lines.push('');

  if (data.keyPoints.length > 0) {
    lines.push('Key Learning Points:');
    lines.push('-'.repeat(60));
    const points: KeyPoint[] = Array.isArray(data.keyPoints)
      ? data.keyPoints.map((p: string | KeyPoint) =>
          typeof p === 'string'
            ? { title: p, explanation: p }
            : { title: p.title || p, explanation: p.explanation || p }
        )
      : [];
    points.forEach((point, index) => {
      lines.push(`${index + 1}. ${point.title}`);
      lines.push(`   ${point.explanation}`);
      lines.push('');
    });
  }

  if (data.definitions && Object.keys(data.definitions).length > 0) {
    lines.push('Key Definitions:');
    lines.push('-'.repeat(60));
    const defs: Array<{ term: string; definition: string }> = Array.isArray(data.definitions)
      ? data.definitions
      : Object.entries(data.definitions).map(([term, definition]) => ({ term, definition }));
    defs.forEach((def) => {
      lines.push(`${def.term}: ${def.definition}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  useEffect(() => {
    const data = location.state?.summaryData || location.state?.summary;
    if (data) {
      const convertedData: SummaryData = {
        overview: data.overview || 'No overview available',
        keyPoints: data.keyPoints || [],
        definitions: data.definitions || [],
        keyConcepts: data.keyConcepts || data.importantConcepts || [],
      };
      setSummaryData(convertedData);
    } else {
      navigate('/app');
    }
  }, [location.state, navigate]);

  if (!summaryData) {
    return (
      <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-accent-indigo mb-3"
            style={{ width: 48, height: 48 }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-bright-muted">Loading your study summary...</p>
        </div>
      </div>
    );
  }

  const state = location.state;

  return (
    <div className="min-vh-100 bg-gradient-main">
      <div className="container-fluid px-3 py-3">
        <StudyNavigation title="Study Summary" />

        <TabSelector
          activeTab="summary"
          totalFlashcards={state?.flashcards?.length || 0}
          totalQuestions={state?.quiz?.length || 0}
        />

        <div className="row justify-content-center">
          <div className="col-12">
            <SummaryView summaryData={summaryData} />
            <ExportOptions type="summary" content={buildSummaryContent(summaryData)} />
          </div>
        </div>

        <div className="row justify-content-center g-3 mt-4">
          <div className="col-12 col-sm-6 col-md-5 col-lg-4">
            <button
              onClick={() => navigate('/flashcards', { state })}
              className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-3"
              style={{ borderRadius: '14px', padding: '16px 20px', minHeight: '68px' }}
            >
              <FiCreditCard size={28} />
              <div className="text-start">
                <div className="fw-bold fs-6">Study Flashcards</div>
                <small className="opacity-75">{state?.flashcards?.length || 0} cards ready</small>
              </div>
            </button>
          </div>

          <div className="col-12 col-sm-6 col-md-5 col-lg-4">
            <button
              onClick={() => navigate('/quiz', { state })}
              className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-3"
              style={{
                borderRadius: '14px',
                padding: '16px 20px',
                minHeight: '68px',
                backgroundColor: '#8b5cf6',
              }}
            >
              <FiHelpCircle size={28} />
              <div className="text-start">
                <div className="fw-bold fs-6">Take Quiz</div>
                <small className="opacity-75">{state?.quiz?.length || 0} questions</small>
              </div>
            </button>
          </div>
        </div>

        <div className="row justify-content-center mt-3">
          <div className="col-12 col-md-5 col-lg-4">
            <button
              onClick={() => navigate('/app')}
              className="btn btn-outline-light btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ borderRadius: '14px' }}
            >
              <FiBookOpen size={18} />
              New Study Pack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
