/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiRotateCw, FiChevronLeft, FiChevronRight, FiHelpCircle, FiZap, FiTarget } from 'react-icons/fi';
import { StudyNavigation } from '@components/StudyNavigation';
import { TabSelector } from '@components/TabSelector';
import { ExportOptions } from '@components/ExportOptions';
import { normalizeFlashcards, buildFlashcardsContent, type NormalizedFlashcard } from '@utils/studyPack';
import { useStudyPack } from '@hooks/useStudyPack';

export const FlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { currentPack, loading } = useStudyPack();
  const [flashcards, setFlashcards] = useState<NormalizedFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (loading) return;
    const pack = currentPack || (location.state?.generatedContent || location.state?.flashcards ? { flashcards: location.state?.generatedContent?.flashcards || location.state?.flashcards, quiz: location.state?.generatedContent?.quiz || location.state?.quiz, summary: location.state?.generatedContent?.summary || location.state?.summaryData } : null);
    if (pack?.flashcards) { setFlashcards(normalizeFlashcards(pack.flashcards)); } else { navigate('/app'); }
  }, [currentPack, location.state, navigate, loading, slug]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft': event.preventDefault(); if (currentIndex > 0) handlePrevious(); break;
        case 'ArrowRight': event.preventDefault(); if (currentIndex < flashcards.length - 1) handleNext(); break;
        case ' ': case 'Enter': event.preventDefault(); handleFlip(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flashcards.length]);

  const handleNext = () => { if (currentIndex < flashcards.length - 1) { setCurrentIndex(currentIndex + 1); setIsFlipped(false); } };
  const handlePrevious = () => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setIsFlipped(false); } };
  const handleFlip = () => { setIsFlipped(!isFlipped); };

  if (loading || flashcards.length === 0) {
    return (
      <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center">
        <div className="spinner-border text-accent-indigo" style={{ width: 48, height: 48 }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const state = currentPack ? { quiz: currentPack.quiz } : location.state;

  return (
    <div className="min-vh-100 bg-gradient-main">
      <div className="container-fluid px-3 py-3">
        <StudyNavigation currentPage="flashcards" title="Flashcards" rightContent={<div className="text-bright fs-5 fw-semibold">{currentIndex + 1} / {flashcards.length}</div>} />
        <TabSelector totalFlashcards={flashcards.length} totalQuestions={state?.quiz?.length || 0} />
        <div className="d-flex justify-content-center mb-3">
          <div className="flashcard-container position-relative" style={{ width: '100%', maxWidth: '600px', height: '300px', perspective: '1000px' }}>
            <div className="flashcard position-relative w-100 h-100" style={{ transformStyle: 'preserve-3d', cursor: 'pointer' }} onClick={handleFlip}>
              <div className="flashcard-side position-absolute w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ backfaceVisibility: 'hidden', backgroundColor: '#171a26', border: '2px solid #6366F1', borderRadius: '16px', zIndex: isFlipped ? 1 : 2 }}>
                <div className="text-center w-100">
                  <div className="mb-3 text-accent-indigo d-flex justify-content-center"><FiHelpCircle size={32} /></div>
                  <h3 className="text-bright fw-bold mb-3 fs-4">Question</h3>
                  <p className="text-bright fs-5 lh-base mb-3 px-2" style={{ minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{currentCard.question}</p>
                  <div className="d-flex align-items-center justify-content-center gap-2 text-bright-muted"><FiRotateCw size={16} /><span className="small fw-medium">Click to reveal answer</span></div>
                </div>
              </div>
              <div className="flashcard-side position-absolute w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: '#1e2230', border: '2px solid #8b5cf6', borderRadius: '16px', zIndex: isFlipped ? 2 : 1 }}>
                <div className="text-center w-100">
                  <div className="mb-3 text-accent-purple d-flex justify-content-center"><FiZap size={32} /></div>
                  <h3 className="text-bright fw-bold mb-3 fs-4">Answer</h3>
                  <p className="text-bright fs-5 lh-base mb-3 px-2" style={{ minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{currentCard.answer}</p>
                  <div className="d-flex align-items-center justify-content-center gap-2 text-bright-muted"><FiRotateCw size={16} /><span className="small fw-medium">Click to see question</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <button onClick={handlePrevious} disabled={currentIndex === 0} className="btn btn-outline-light d-flex align-items-center gap-2" style={{ minWidth: '100px' }}><FiChevronLeft size={18} /><span className="d-none d-sm-inline">Previous</span></button>
          <button onClick={handleFlip} className="btn btn-primary d-flex align-items-center gap-2" style={{ minWidth: '100px' }}><FiRotateCw size={18} />Flip</button>
          <button onClick={handleNext} disabled={currentIndex === flashcards.length - 1} className="btn btn-outline-light d-flex align-items-center gap-2" style={{ minWidth: '100px' }}><span className="d-none d-sm-inline">Next</span><FiChevronRight size={18} /></button>
        </div>
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <small className="text-bright-muted">Progress</small>
            <small className="text-bright fw-semibold">{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</small>
          </div>
          <div className="progress" style={{ height: '6px' }}><div className="progress-bar" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} /></div>
        </div>
        <div className="d-flex justify-content-center mt-4">
          <div className="bento-tile p-3 text-center" style={{ maxWidth: '600px', width: '100%' }}>
            <h4 className="text-bright fw-bold mb-2 fs-6 d-flex align-items-center justify-content-center gap-2"><FiTarget size={16} />Study Tips</h4>
            <div className="row g-2 text-center">
              <div className="col-md-4 col-12"><div className="text-bright-muted small"><strong>Keyboard:</strong><br />Arrow keys to navigate<br />Space/Enter to flip</div></div>
              <div className="col-md-4 col-12"><div className="text-bright-muted small"><strong>Study Method:</strong><br />Read question carefully<br />Think before flipping</div></div>
              <div className="col-md-4 col-12"><div className="text-bright-muted small"><strong>Best Practice:</strong><br />Review multiple times<br />Focus on difficult ones</div></div>
            </div>
          </div>
        </div>
        <ExportOptions type="flashcards" content={buildFlashcardsContent(flashcards)} />
      </div>
    </div>
  );
};