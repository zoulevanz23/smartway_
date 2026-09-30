/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiCheck, FiX, FiChevronRight, FiTrendingUp, FiRotateCcw, FiBookOpen, FiCreditCard, FiZap } from 'react-icons/fi';
import { StudyNavigation } from '@components/StudyNavigation';
import { TabSelector } from '@components/TabSelector';
import { ExportOptions } from '@components/ExportOptions';
import { normalizeQuiz, buildQuizContent, type NormalizedQuizQuestion } from '@utils/studyPack';
import { useStudyPack } from '@hooks/useStudyPack';

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { currentPack, loading } = useStudyPack();
  const [quizQuestions, setQuizQuestions] = useState<NormalizedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (loading) return;
    const pack = currentPack || (location.state?.generatedContent || location.state?.quiz ? { quiz: location.state?.generatedContent?.quiz || location.state?.quiz, flashcards: location.state?.generatedContent?.flashcards || location.state?.flashcards, summary: location.state?.generatedContent?.summary || location.state?.summaryData } : null);
    if (pack?.quiz) { setQuizQuestions(normalizeQuiz(pack.quiz)); } else { navigate('/app'); }
  }, [currentPack, location.state, navigate, loading, slug]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (showResult) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleNext(); } return; } const optionIndex = parseInt(event.key) - 1; if (optionIndex >= 0 && optionIndex < quizQuestions[currentIndex]?.options.length) { event.preventDefault(); handleAnswerSelect(quizQuestions[currentIndex].options[optionIndex]); } };
    if (quizQuestions.length > 0 && !isComplete) { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }
  }, [showResult, currentIndex, isComplete, quizQuestions.length]);

  const handleAnswerSelect = (answer: string) => { if (showResult) return; setSelectedAnswer(answer); setShowResult(true); const isCorrect = answer === quizQuestions[currentIndex].answer; if (isCorrect) { setScore((s) => s + 1); } setAnsweredQuestions((prev) => (prev.includes(currentIndex) ? prev : [...prev, currentIndex])); };
  const handleNext = () => { if (currentIndex < quizQuestions.length - 1) { setCurrentIndex(currentIndex + 1); setSelectedAnswer(null); setShowResult(false); } else if (currentIndex === quizQuestions.length - 1) { setIsComplete(true); } };
  const getScoreRating = () => { const percentage = (score / quizQuestions.length) * 100; if (percentage >= 90) return { text: 'Excellent', color: '#10b981' }; if (percentage >= 80) return { text: 'Great Job', color: '#38bdf8' }; if (percentage >= 70) return { text: 'Good Work', color: '#f59e0b' }; if (percentage >= 60) return { text: 'Not Bad', color: '#6366F1' }; return { text: 'Needs Improvement', color: '#ef4444' }; };
  const resetQuiz = () => { setCurrentIndex(0); setSelectedAnswer(null); setShowResult(false); setScore(0); setAnsweredQuestions([]); setIsComplete(false); };

  if (loading || quizQuestions.length === 0) { return ( <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center"><div className="spinner-border text-accent-indigo" style={{ width: 48, height: 48 }} role="status"><span className="visually-hidden">Loading...</span></div></div> ); }
  if (quizQuestions.length > 0 && currentIndex >= quizQuestions.length && !isComplete) { setIsComplete(true); return null; }

  if (isComplete) {
    const rating = getScoreRating(); const percentage = Math.round((score / quizQuestions.length) * 100); const state = { summaryData: currentPack?.summary ?? location.state?.summaryData, flashcards: currentPack?.flashcards ?? location.state?.flashcards, quiz: currentPack?.quiz ?? location.state?.quiz };
    return (
      <div className="min-vh-100 bg-gradient-main"><div className="container-fluid px-3 py-4"><StudyNavigation currentPage="quiz" title="Quiz" rightContent={<div className="text-bright fs-5 d-flex align-items-center gap-2"><FiTrendingUp size={20} />{score}/{quizQuestions.length}</div>} />
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(14, 16, 24, 0.8)', zIndex: 1050, padding: '1rem' }}><div className="text-center p-4" style={{ backgroundColor: '#171a26', border: '1px solid #2a2f42', borderRadius: '18px', maxWidth: '420px', width: '100%' }}><div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 76, height: 76, backgroundColor: `${rating.color}26`, color: rating.color, fontSize: 36 }}><FiTrendingUp size={36} /></div><h2 className="text-bright fw-bold mb-2" style={{ fontSize: '1.4rem' }}>Quiz Complete</h2><div className="display-5 fw-bold mb-1" style={{ color: rating.color }}>{score}/{quizQuestions.length}</div><div className="fs-5 text-bright mb-1">{percentage}% Correct</div><div className="fs-6 fw-bold mb-4" style={{ color: rating.color }}>{rating.text}</div><div className="d-grid gap-3"><button onClick={resetQuiz} className="btn btn-primary btn-lg" style={{ borderRadius: '12px' }}><span className="d-flex align-items-center justify-content-center gap-2"><FiRotateCcw size={18} />Retake Quiz</span></button><div className="row g-2"><div className="col-6"><button onClick={() => navigate('/summary', { state })} className="btn btn-outline-light btn-lg w-100"><span className="d-flex align-items-center justify-content-center gap-2"><FiBookOpen size={16} />Summary</span></button></div><div className="col-6"><button onClick={() => navigate('/flashcards', { state })} className="btn btn-outline-light btn-lg w-100"><span className="d-flex align-items-center justify-content-center gap-2"><FiCreditCard size={16} />Cards</span></button></div></div></div></div></div></div></div>
    );
  }

  const currentQuestion = quizQuestions[currentIndex];
  if (!currentQuestion && !isComplete) { return ( <div className="min-vh-100 bg-gradient-main d-flex align-items-center justify-content-center"><div className="spinner-border text-accent-indigo" style={{ width: 48, height: 48 }} role="status"><span className="visually-hidden">Loading question...</span></div></div> ); }

const state = { summaryData: currentPack?.summary ?? location.state?.summaryData, flashcards: currentPack?.flashcards ?? location.state?.flashcards, quiz: currentPack?.quiz ?? location.state?.quiz };

  return (
    <div className="min-vh-100 bg-gradient-main"><div className="container-fluid px-3 py-3"><StudyNavigation currentPage="quiz" title="Quiz" rightContent={<div className="text-bright fs-5 d-flex align-items-center gap-2"><FiTrendingUp size={20} />{score}/{answeredQuestions.length}</div>} />
    <TabSelector totalFlashcards={state?.flashcards?.length || 0} totalQuestions={quizQuestions.length} state={state} />
    <div className="bento-tile p-2 text-center mb-3 mx-auto" style={{ maxWidth: '400px' }}><div className="row g-2 text-center"><div className="col-4"><div className="text-accent-indigo mb-1 fs-5 fw-bold">{score}</div><div className="text-bright-muted small">Correct</div></div><div className="col-4"><div className="text-accent-purple mb-1 fs-5 fw-bold">{answeredQuestions.length}</div><div className="text-bright-muted small">Answered</div></div><div className="col-4"><div className="text-accent-yellow mb-1 fs-5 fw-bold">{answeredQuestions.length > 0 ? Math.round((score / answeredQuestions.length) * 100) : 0}%</div><div className="text-bright-muted small">Accuracy</div></div></div></div>
    <div className="d-flex justify-content-between align-items-center mb-3"><div className="d-flex align-items-center gap-2"><span className="text-bright-muted small">Progress:</span><div className="progress" style={{ width: '180px', height: '6px' }}><div className="progress-bar" style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }} /></div><span className="text-bright-muted small">{Math.round(((currentIndex + 1) / quizQuestions.length) * 100)}%</span></div><div className="text-bright fw-semibold">{currentIndex + 1} / {quizQuestions.length}</div></div>
    <div className="row justify-content-center"><div className="col-12 col-lg-10 col-xl-8"><div className="bento-tile p-3 mb-3"><div className="mb-3"><h2 className="text-bright fw-bold fs-5 mb-2">Question {currentIndex + 1}</h2><p className="text-bright fs-6 lh-base mb-3">{currentQuestion.question}</p></div><div className="d-grid gap-2">{currentQuestion.options.map((option, index) => { const isSelected = selectedAnswer === option; const isCorrect = option === currentQuestion.answer; let buttonStyle: React.CSSProperties = { borderRadius: '10px', padding: '12px 16px', fontSize: '14px', textAlign: 'left', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e2230', border: '1px solid #2a2f42', color: '#ffffff', transition: 'all 0.2s ease' }; if (showResult && isCorrect) { buttonStyle = { ...buttonStyle, backgroundColor: 'rgba(16, 185, 129, 0.18)', border: '1px solid #10b981' }; } else if (showResult && isSelected && !isCorrect) { buttonStyle = { ...buttonStyle, backgroundColor: 'rgba(239, 68, 68, 0.18)', border: '1px solid #ef4444' }; } return ( <button key={index} onClick={() => handleAnswerSelect(option)} disabled={showResult} style={buttonStyle} className="btn text-start"><div className="d-flex align-items-center gap-3 w-100"><div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '12px', fontWeight: 'bold' }}>{String.fromCharCode(65 + index)}</div><span className="flex-grow-1">{option}</span>{showResult && isCorrect && <FiCheck size={20} color="#10b981" />}{showResult && isSelected && !isCorrect && <FiX size={20} color="#ef4444" />}</div></button> ); })}</div>{showResult && ( <div className="mt-3 p-2" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px' }}><h5 className="text-bright fw-bold mb-2 d-flex align-items-center gap-2 fs-6"><FiZap size={16} />Explanation</h5><p className="text-bright-muted mb-0 small">{currentQuestion.explanation}</p></div> )}{showResult && ( <div className="mt-3 d-flex justify-content-center"><button onClick={handleNext} className="btn btn-primary btn-lg px-4" style={{ fontWeight: 600 }}>{currentIndex === quizQuestions.length - 1 ? ( <span className="d-flex align-items-center gap-2">Finish Quiz<FiTrendingUp size={18} /></span> ) : ( <span className="d-flex align-items-center gap-2">Next Question<FiChevronRight size={18} /></span> )}</button></div> )}</div></div></div>
    <ExportOptions type="quiz" content={buildQuizContent(quizQuestions)} />
    </div></div>
  );
};