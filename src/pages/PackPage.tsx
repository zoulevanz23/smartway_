import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StudyNavigation } from '@components/StudyNavigation';
import { TabSelector } from '@components/TabSelector';
import { SummaryView } from '@components/SummaryView';
import { ExportOptions } from '@components/ExportOptions';
import { useStudyPack } from '@hooks/useStudyPack';
import { buildSummaryContent } from '@utils/studyPack';

export const PackPage: React.FC = () => {
  useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentPack, record, loading, error } = useStudyPack();

  if (loading) {
    return (
      <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-accent-indigo mb-3" style={{ width: 48, height: 48 }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-bright-muted">Loading your study pack...</p>
        </div>
      </div>
    );
  }

  if (error || !currentPack) {
    return (
      <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h2 className="text-bright fw-bold mb-3">Study pack not found</h2>
          <button onClick={() => navigate('/app')} className="btn btn-primary">Go to Home</button>
        </div>
      </div>
    );
  }

  const state = {
    summaryData: currentPack.summary,
    flashcards: currentPack.flashcards,
    quiz: currentPack.quiz,
  };

  return (
    <div className="min-vh-100 bg-gradient-main">
      <div className="container-fluid px-3 py-3">
        <StudyNavigation
          title={record ? record.title : 'Shared Study Pack'}
          rightContent={
            <span className="text-bright-muted small">
              {record ? 'From history' : 'Shared link'} · {currentPack.flashcards?.length || 0} cards · {currentPack.quiz?.length || 0} questions
            </span>
          }
        />
        <TabSelector
          totalFlashcards={currentPack.flashcards?.length || 0}
          totalQuestions={currentPack.quiz?.length || 0}
          state={state}
        />
        <div className="row justify-content-center">
          <div className="col-12">
            <SummaryView summaryData={currentPack.summary || { overview: '', keyPoints: [], definitions: [] }} />
            <ExportOptions type="summary" content={buildSummaryContent(currentPack.summary || { overview: '', keyPoints: [], definitions: [] })} />
          </div>
        </div>
        <div className="row justify-content-center g-3 mt-4">
          <div className="col-12 col-sm-6 col-md-5 col-lg-4">
            <button onClick={() => navigate('/flashcards', { state })} className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-3" style={{ borderRadius: '14px', padding: '16px 20px', minHeight: '68px' }}>
              <span className="d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}><span className="fs-4">🎴</span></span>
              <div className="text-start"><div className="fw-bold fs-6">Flashcards</div><small className="opacity-75">{currentPack.flashcards?.length || 0} cards</small></div>
            </button>
          </div>
          <div className="col-12 col-sm-6 col-md-5 col-lg-4">
            <button onClick={() => navigate('/quiz', { state })} className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-3" style={{ borderRadius: '14px', padding: '16px 20px', minHeight: '68px', backgroundColor: '#8b5cf6' }}>
              <span className="d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><span className="fs-4">❓</span></span>
              <div className="text-start"><div className="fw-bold fs-6">Quiz</div><small className="opacity-75">{currentPack.quiz?.length || 0} questions</small></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};