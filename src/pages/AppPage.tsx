import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBookOpen,
  FiCreditCard,
  FiHelpCircle,
  FiRefreshCcw,
  FiZap,
  FiStar,
  FiClock,
  FiTarget,
} from 'react-icons/fi';
import { InputForm } from '@components/InputForm';
import { Logo } from '@components/Logo';
import { ErrorModal } from '@components/ErrorModal';
import type { StudyPackResult } from '@api/generate';
import { hashContent, getCachedPack, setCachedPack } from '@utils/cache';
import { buildFallbackPack } from '@utils/fallbackStudyPack';

const LOADING_FACTS = [
  {
    icon: FiStar,
    text: 'Active recall beats re-reading — flashcards strengthen memory 50% faster.',
  },
  {
    icon: FiClock,
    text: 'The spacing effect: review after 1 day, 3 days, and 7 days to lock it in.',
  },
  {
    icon: FiTarget,
    text: 'Teaching what you just learned cements it — try explaining a card out loud.',
  },
  {
    icon: FiBookOpen,
    text: 'Interleaving topics (mixing subjects) builds stronger connections than block study.',
  },
  {
    icon: FiZap,
    text: 'Your pack is being crafted — summaries, cards, and quiz tailored to your notes.',
  },
  { icon: FiStar, text: 'Elaboration helps: ask “why does this work?” for each key point.' },
];

function isRetryableError(msg: string): boolean {
  return /rate limit|429|503|high demand|overloaded|temporarily busy/i.test(msg);
}

function isUserError(msg: string): boolean {
  return /No content provided|Content too short|Invalid file type|file size|No text content|Failed to download|Unable to access/i.test(
    msg
  );
}

export const AppPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<StudyPackResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [lastSubmissionData, setLastSubmissionData] = useState<{
    text?: string;
    file?: File;
    fileUrl?: string;
  } | null>(null);
  const [lastContentText, setLastContentText] = useState<string>('');
  const lastRequestRef = useRef<number>(0);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    if (location.state?.generatedContent) {
      setGeneratedContent(location.state.generatedContent);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    setFactIndex(0);
    const id = window.setInterval(() => setFactIndex((i) => (i + 1) % LOADING_FACTS.length), 2800);
    return () => window.clearInterval(id);
  }, [isLoading]);

  const handleSubmit = async (data: { text?: string; file?: File; fileUrl?: string }) => {
    // Throttle: 45s minimum between requests
    const now = Date.now();
    const sinceLast = now - lastRequestRef.current;
    if (lastRequestRef.current && sinceLast < 45000) {
      const wait = Math.ceil((45000 - sinceLast) / 1000);
      setError(`Please wait ${wait}s before generating again — free tier resets shortly.`);
      setShowErrorModal(true);
      return;
    }

    // Build cache key from text or fileUrl
    const cacheKeySource = data.text || data.fileUrl || '';
    const cacheKey = cacheKeySource ? hashContent(cacheKeySource.slice(0, 8000)) : '';

    if (cacheKey) {
      const cached = getCachedPack(cacheKey) as StudyPackResult | null;
      if (cached && cached.summary && cached.flashcards && cached.quiz) {
        setGeneratedContent(cached);
        setIsFallback(false);
        setError(null);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      setRetryAfter(null);
      setIsFallback(false);
      setLastSubmissionData(data);
      // Keep raw text for fallback if fileUrl fails server-side
      if (data.text) setLastContentText(data.text);

      let response: Response;

      if (data.fileUrl) {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: data.fileUrl }),
        });
      } else if (data.text) {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.text }),
        });
      } else {
        throw new Error('No content provided. Please upload your file to storage or enter text.');
      }

      let parsed: Record<string, unknown> | null = null;
      const text = await response.text();
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        /* not JSON */
      }

      if (!response.ok) {
        const serverMsg =
          (parsed?.error as string) || (parsed?.message as string) || text.slice(0, 400);
        const ra =
          (parsed?.retryAfter as number) || Number(response.headers.get('Retry-After')) || 0;
        if (ra) setRetryAfter(ra);
        if (!parsed) {
          throw new Error(
            `Server returned non-JSON (${response.status}). Is the API server running? Run: npm run dev:full — not just npm run dev. Details: ${serverMsg.slice(0, 200)}`
          );
        }
        const err = new Error(serverMsg || 'Failed to generate study pack') as Error & {
          retryAfter?: number;
          status?: number;
        };
        err.retryAfter = ra;
        err.status = response.status;
        throw err;
      }

      const result = parsed as Record<string, unknown> & {
        summary?: unknown;
        flashcards?: unknown[];
        quiz?: unknown[];
      };
      if (!result || typeof result !== 'object') throw new Error('Invalid response from server');
      if (!result.summary || !result.flashcards || !result.quiz) {
        throw new Error('Invalid response format from server');
      }

      lastRequestRef.current = Date.now();
      setGeneratedContent(result);
      setIsFallback(false);
      setError(null);
      if (cacheKey) setCachedPack(cacheKey, result);
    } catch (error) {
      console.error('Error generating study pack:', error);
      const msg = error instanceof Error ? error.message : String(error);
      const retryAfterVal = (error as { retryAfter?: number })?.retryAfter || 0;

      // Never fallback on user errors (bad input)
      if (isUserError(msg)) {
        setError(msg);
        setShowErrorModal(true);
        return;
      }

      // Retryable → show countdown and auto-retry if retryAfter, else try fallback after 1s
      if (isRetryableError(msg)) {
        if (retryAfterVal) {
          setRetryAfter(retryAfterVal);
          let remaining = retryAfterVal;
          if (countdownRef.current) window.clearInterval(countdownRef.current);
          countdownRef.current = window.setInterval(() => {
            remaining -= 1;
            setRetryAfter(remaining);
            if (remaining <= 0) {
              if (countdownRef.current) window.clearInterval(countdownRef.current);
              // Auto-retry once
              if (lastSubmissionData) handleSubmit(lastSubmissionData);
            }
          }, 1000);
          setError(
            `Free tier busy — retrying in ${retryAfterVal}s. You can also use the offline draft below.`
          );
          setShowErrorModal(true);
          // Offer instant fallback in background while waiting
          const fallbackText = data.text || lastContentText;
          if (fallbackText && fallbackText.length > 50) {
            const pack = buildFallbackPack(fallbackText);
            setGeneratedContent(pack);
            setIsFallback(true);
            if (cacheKey) setCachedPack(cacheKey + '_fallback', pack);
          }
          return;
        }
        // Retryable but no retryAfter → try fallback strictly as last resort
        const fallbackText = data.text || lastContentText;
        if (fallbackText && fallbackText.length > 50) {
          const pack = buildFallbackPack(fallbackText);
          setGeneratedContent(pack);
          setIsFallback(true);
          setError(
            'AI temporarily unavailable — showing offline draft from your notes. Tap Retry with AI to try again.'
          );
          setShowErrorModal(false);
          return;
        }
      }

      // Generic fallback only for AI failures, not user errors
      const fallbackText = data.text || lastContentText;
      if (fallbackText && fallbackText.length > 80 && !isUserError(msg)) {
        const pack = buildFallbackPack(fallbackText);
        setGeneratedContent(pack);
        setIsFallback(true);
        setError(null);
        setShowErrorModal(false);
        return;
      }

      let errorMessage = msg || 'Failed to generate study pack.';
      if (msg.includes('Invalid file type'))
        errorMessage = 'Please upload a PDF, Word document (.docx, .doc), or text file.';
      else if (msg.includes('file size'))
        errorMessage = 'File size must be less than 50MB. Please upload a smaller file.';
      else if (msg.includes('No text content'))
        errorMessage =
          'No text content could be extracted from the document. Please check the file and try again.';
      else if (msg.includes('Failed to fetch'))
        errorMessage = 'Network error. Please check your connection and try again.';

      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    setRetryAfter(null);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    if (lastSubmissionData) handleSubmit(lastSubmissionData);
  };

  const handleRetryWithAI = () => {
    setIsFallback(false);
    if (lastSubmissionData) handleSubmit(lastSubmissionData);
  };

  const handleCloseError = () => {
    setShowErrorModal(false);
    setError(null);
    setRetryAfter(null);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
  };

  const handleNavigateTo = (path: string) => {
    if (!generatedContent) return;
    navigate(path, {
      state: {
        summaryData: generatedContent.summary,
        flashcards: generatedContent.flashcards,
        quiz: generatedContent.quiz,
      },
    });
  };

  return (
    <div className="min-vh-100 bg-gradient-main">
      <div className="container-fluid px-3 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Logo size={48} showText={true} />
          <div></div>
        </div>

        <div className="text-center mb-4">
          <h1 className="display-4 fw-bold mb-2 gradient-text">SmartWay Study Tool</h1>
          <p className="text-bright-muted lead">
            Transform your notes into comprehensive study materials instantly
          </p>
        </div>

        <InputForm onSubmit={handleSubmit} isLoading={isLoading} />

        {isLoading && (
          <div className="d-flex justify-content-center my-5">
            <div
              className="position-relative overflow-hidden"
              style={{
                maxWidth: '520px',
                width: '100%',
                background:
                  'linear-gradient(180deg, rgba(79,70,229,0.10), transparent 40%), rgba(18,16,42,0.85)',
                border: '1px solid rgba(129,140,248,0.2)',
                borderRadius: '20px',
                backdropFilter: 'blur(16px)',
                boxShadow:
                  '0 20px 60px rgba(79,70,229,0.25), 0 0 0 1px rgba(129,140,248,0.08) inset',
                padding: '2rem 1.5rem',
              }}
            >
              {/* aurora glow behind card */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: -40,
                  background:
                    'radial-gradient(60% 60% at 50% 0%, rgba(99,70,229,0.18), transparent 70%)',
                  filter: 'blur(20px)',
                  pointerEvents: 'none',
                }}
              />
              <div className="position-relative" style={{ zIndex: 1 }}>
                <div className="d-flex flex-column align-items-center">
                  <div className="position-relative mb-3" style={{ width: 64, height: 64 }}>
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
                      style={{ border: '3px solid rgba(129,140,248,0.15)' }}
                    />
                    <motion.div
                      className="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
                      style={{
                        border: '3px solid transparent',
                        borderTopColor: '#818cf8',
                        borderRightColor: '#22d3ee',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                    />
                    <div
                      className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                        boxShadow: '0 4px 16px rgba(99,70,229,0.4)',
                      }}
                    >
                      <FiZap size={18} color="#fff" />
                    </div>
                  </div>
                  <div
                    className="text-bright fw-bold fs-5 mb-1"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {retryAfter
                      ? `Free tier busy — retrying in ${retryAfter}s`
                      : 'Crafting your study pack'}
                  </div>
                  <div
                    className="text-bright-muted small mb-3 text-center"
                    style={{ minHeight: 20 }}
                  >
                    {retryAfter
                      ? 'You’ll get an offline draft while we retry with AI.'
                      : 'Turning your notes into summaries, flashcards, and quiz'}
                  </div>
                </div>

                <div
                  className="position-relative d-flex align-items-center justify-content-center mb-4"
                  style={{
                    minHeight: 64,
                    background: 'rgba(5,5,12,0.4)',
                    borderRadius: 12,
                    border: '1px solid rgba(129,140,248,0.12)',
                    padding: '0.9rem 1rem',
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={factIndex}
                      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="d-flex align-items-center gap-3 w-100"
                    >
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background:
                            'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(34,211,238,0.25))',
                          border: '1px solid rgba(129,140,248,0.2)',
                        }}
                      >
                        {React.createElement(LOADING_FACTS[factIndex].icon, {
                          size: 18,
                          color: '#a5b4fc',
                        })}
                      </div>
                      <div
                        className="text-bright small"
                        style={{ lineHeight: 1.5, fontSize: '0.9rem' }}
                      >
                        {LOADING_FACTS[factIndex].text}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="d-flex justify-content-center gap-1.5 mb-4">
                  {LOADING_FACTS.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-pill"
                      style={{
                        height: 6,
                        width: i === factIndex ? 22 : 6,
                        background:
                          i === factIndex
                            ? 'linear-gradient(90deg, #4f46e5, #22d3ee)'
                            : 'rgba(129,140,248,0.25)',
                        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                        borderRadius: 999,
                      }}
                    />
                  ))}
                </div>

                <div className="w-100">
                  <div
                    className="progress"
                    style={{ height: 6, background: 'rgba(18,16,42,0.9)', borderRadius: 999 }}
                  >
                    <motion.div
                      className="progress-bar"
                      style={{
                        borderRadius: 999,
                        backgroundImage: 'linear-gradient(90deg, #4f46e5, #8b5cf6, #22d3ee)',
                        width: '100%',
                      }}
                      animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <span
                      className="text-bright-muted"
                      style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      Analyzing
                    </span>
                    <span
                      className="text-bright-muted"
                      style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      Pack ready soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {generatedContent && !isLoading && (
          <div className="mt-5">
            <div className="text-center mb-4">
              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                <h2 className="text-bright fw-bold fs-3 mb-0">Study Pack Ready</h2>
                {isFallback && (
                  <span
                    className="badge rounded-pill d-inline-flex align-items-center gap-1"
                    style={{
                      background: 'rgba(245,158,11,0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245,158,11,0.35)',
                      fontSize: 12,
                    }}
                  >
                    <FiZap size={12} /> Offline draft — AI unavailable
                  </span>
                )}
              </div>
              <p className="text-bright-muted">
                {isFallback
                  ? 'Generated from your notes on-device. Tap Retry with AI when the free tier resets.'
                  : "Choose how you'd like to study your material"}
              </p>
              {isFallback && (
                <button onClick={handleRetryWithAI} className="btn btn-outline-light btn-sm mt-1">
                  <FiRefreshCcw size={14} className="me-1" /> Retry with AI
                </button>
              )}
            </div>

            <div className="row g-4 justify-content-center">
              <div className="col-lg-4 col-md-6 col-12">
                <div
                  className="bento-tile h-100 text-center p-4 d-flex flex-column"
                  style={{ minHeight: '240px', cursor: 'pointer' }}
                  onClick={() => handleNavigateTo('/summary')}
                >
                  <div
                    className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366F1',
                    }}
                  >
                    <FiBookOpen size={28} />
                  </div>
                  <h3 className="h5 fw-bold text-bright mb-2">Smart Summary</h3>
                  <p className="text-bright-muted mb-4">
                    Organized overview with key points, definitions, and important concepts
                  </p>
                  <div className="mt-auto">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => handleNavigateTo('/summary')}
                    >
                      View Summary
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-12">
                <div
                  className="bento-tile h-100 text-center p-4 d-flex flex-column"
                  style={{ minHeight: '240px', cursor: 'pointer' }}
                  onClick={() => handleNavigateTo('/flashcards')}
                >
                  <div
                    className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      color: '#8b5cf6',
                    }}
                  >
                    <FiCreditCard size={28} />
                  </div>
                  <h3 className="h5 fw-bold text-bright mb-2">Interactive Flashcards</h3>
                  <p className="text-bright-muted mb-4">
                    {generatedContent.flashcards?.length || 5} flashcards with flip animations to
                    test your knowledge
                  </p>
                  <div className="mt-auto">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => handleNavigateTo('/flashcards')}
                    >
                      Study Flashcards
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-12">
                <div
                  className="bento-tile h-100 text-center p-4 d-flex flex-column"
                  style={{ minHeight: '240px', cursor: 'pointer' }}
                  onClick={() => handleNavigateTo('/quiz')}
                >
                  <div
                    className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                    }}
                  >
                    <FiHelpCircle size={28} />
                  </div>
                  <h3 className="h5 fw-bold text-bright mb-2">Interactive Quiz</h3>
                  <p className="text-bright-muted mb-4">
                    {generatedContent.quiz?.length || 5} questions with instant feedback and scoring
                  </p>
                  <div className="mt-auto">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => handleNavigateTo('/quiz')}
                    >
                      Take Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setGeneratedContent(null);
                  setIsFallback(false);
                  setError(null);
                }}
                className="btn btn-outline-light btn-lg px-4"
              >
                <FiRefreshCcw className="me-2" />
                Generate Another Study Pack
              </button>
            </div>
          </div>
        )}
      </div>

      <ErrorModal
        show={showErrorModal}
        onClose={handleCloseError}
        message={error ? (retryAfter ? `${error} (${retryAfter}s)` : error) : ''}
        onRetry={lastSubmissionData ? handleRetry : undefined}
      />
    </div>
  );
};
