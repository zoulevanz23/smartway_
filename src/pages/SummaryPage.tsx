import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { StudyNavigation } from '@components/StudyNavigation';
import { TabSelector } from '@components/TabSelector';
import { SummaryView } from '@components/SummaryView';
import { ExportOptions } from '@components/ExportOptions';
import { FiBookOpen, FiCreditCard, FiHelpCircle } from 'react-icons/fi';
import { useStudyPack } from '@hooks/useStudyPack';
import { buildSummaryContent } from '@utils/studyPack';

interface KeyPoint { title: string; explanation: string; }
interface SummaryData {
  overview: string;
  keyPoints: KeyPoint[] | string[];
  definitions: Record<string, string> | Array<{ term: string; definition: string }>;
  keyConcepts?: string[];
}

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { currentPack, loading } = useStudyPack();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  useEffect(() => {
    if (loading) return;
    const pack = currentPack || (location.state?.generatedContent || location.state?.summaryData ? {
      summary: location.state?.generatedContent?.summary || location.state?.summaryData,
      flashcards: location.state?.generatedContent?.flashcards || location.state?.flashcards,
      quiz: location.state?.generatedContent?.quiz || location.state?.quiz,
    } : null);
    if (pack?.summary) {
      const data = pack.summary;
      setSummaryData({ overview: data.overview || '', keyPoints: data.keyPoints || [], definitions: data.definitions || [], keyConcepts: data.importantConcepts || data.keyConcepts || [] });
    } else { navigate('/app'); }
  }, [currentPack, location.state, navigate, loading, slug]);

  if (loading || !summaryData) {
    return (
      <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center">
        <div className="text-center"><div className="spinner-border text-accent-indigo mb-3" style={{ width: 48, height: 48 }} role="status"><span className="visually-hidden">Loading...</span></div><p className="text-bright-muted">Loading your study summary...</p></div>
      </div>
    );
  }

  const state = {
    summaryData: currentPack?.summary ?? location.state?.summaryData,
    flashcards: currentPack?.flashcards ?? location.state?.flashcards,
    quiz: currentPack?.quiz ?? location.state?.quiz,
  };

  return (
    <div className="min-vh-100 bg-gradient-main">
      <div className="container-fluid px-3 py-3">
        <StudyNavigation title="Study Summary" />
        <TabSelector totalFlashcards={state?.flashcards?.length || 0} totalQuestions={state?.quiz?.length || 0} state={state} />
        <div className="row justify-content-center"><div className="col-12"><SummaryView summaryData={summaryData} /><ExportOptions type="summary" content={buildSummaryContent(summaryData)} /></div></div>
        <div className="row justify-content-center g-3 mt-4">
          <div className="col-12 col-sm-6 col-md-5 col-lg-4"><button onClick={() => navigate('/flashcards', { state })} className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-3" style={{ borderRadius: '14px', padding: '16px 20px', minHeight: '68px' }}><FiCreditCard size={28} /><div className="text-start"><div className="fw-bold fs-6">Study Flashcards</div><small className="opacity-75">{state?.flashcards?.length || 0} cards ready</small></div></button></div>
          <div className="col-12 col-sm-6 col-md-5 col-lg-4"><button onClick={() => navigate('/quiz', { state })} className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-3" style={{ borderRadius: '14px', padding: '16px 20px', minHeight: '68px', backgroundColor: '#8b5cf6' }}><FiHelpCircle size={28} /><div className="text-start"><div className="fw-bold fs-6">Take Quiz</div><small className="opacity-75">{state?.quiz?.length || 0} questions</small></div></button></div>
        </div>
        <div className="row justify-content-center mt-3"><div className="col-12 col-md-5 col-lg-4"><button onClick={() => navigate('/app')} className="btn btn-outline-light btn-lg w-100 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '14px' }}><FiBookOpen size={18} />New Study Pack</button></div></div>
      </div>
    </div>
  );
};