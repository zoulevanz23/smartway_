import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFileText,
  FiBookOpen,
  FiCreditCard,
  FiHelpCircle,
  FiUpload,
  FiZap,
  FiCheck,
} from 'react-icons/fi';
import { Logo } from '@components/Logo';

export const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-gradient-main position-relative">
      <div
        className="container px-3 py-4"
        style={{ maxWidth: '900px', position: 'relative', zIndex: 2 }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Logo size={44} showText />
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline-light d-flex align-items-center gap-2"
          >
            <FiArrowLeft size={16} /> Back
          </button>
        </div>

        <h1
          className="font-display fw-bold mb-2"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#f1f0fa' }}
        >
          How <span className="gradient-text">SmartWay</span> works
        </h1>
        <p
          className="mb-4"
          style={{ color: 'rgba(241,240,250,0.62)', lineHeight: 1.6, maxWidth: 640 }}
        >
          Paste your notes or drop a file. SmartWay turns it into the three things you actually
          study from — a tight summary, flashcards, and a quiz.
        </p>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="bento-tile h-100 p-4">
              <div
                className="d-flex align-items-center justify-content-center rounded mb-3"
                style={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg,#4f46e5,#818cf8)',
                  color: '#fff',
                }}
              >
                <FiUpload size={20} />
              </div>
              <h3 className="h6 fw-bold mb-1" style={{ color: '#f1f0fa' }}>
                1 · Load material
              </h3>
              <p className="small mb-0" style={{ color: 'rgba(241,240,250,0.6)' }}>
                Upload PDF, DOCX, TXT or paste text directly. Up to 50MB per file.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bento-tile h-100 p-4">
              <div
                className="d-flex align-items-center justify-content-center rounded mb-3"
                style={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg,#8b5cf6,#22d3ee)',
                  color: '#fff',
                }}
              >
                <FiZap size={20} />
              </div>
              <h3 className="h6 fw-bold mb-1" style={{ color: '#f1f0fa' }}>
                2 · AI builds the pack
              </h3>
              <p className="small mb-0" style={{ color: 'rgba(241,240,250,0.6)' }}>
                Groq generates summary + definitions, flip cards, and quiz with explanations.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bento-tile h-100 p-4">
              <div
                className="d-flex align-items-center justify-content-center rounded mb-3"
                style={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg,#22d3ee,#2dd4bf)',
                  color: '#fff',
                }}
              >
                <FiCheck size={20} />
              </div>
              <h3 className="h6 fw-bold mb-1" style={{ color: '#f1f0fa' }}>
                3 · Study & track
              </h3>
              <p className="small mb-0" style={{ color: 'rgba(241,240,250,0.6)' }}>
                Review summary, flip cards with keyboard, take quiz, export to .txt/.md.
              </p>
            </div>
          </div>
        </div>

        <div className="bento-tile p-4 mb-4">
          <h2 className="h5 fw-bold mb-3" style={{ color: '#f1f0fa' }}>
            What you get
          </h2>
          <div className="row g-3">
            <div className="col-md-4 d-flex gap-3">
              <FiBookOpen size={20} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="fw-semibold small" style={{ color: '#f1f0fa' }}>
                  Summary
                </div>
                <div className="small" style={{ color: 'rgba(241,240,250,0.6)' }}>
                  Overview, key points (click to expand), and definitions.
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex gap-3">
              <FiCreditCard size={20} style={{ color: '#22d3ee', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="fw-semibold small" style={{ color: '#f1f0fa' }}>
                  Flashcards
                </div>
                <div className="small" style={{ color: 'rgba(241,240,250,0.6)' }}>
                  Front/back cards, flip with Space, navigate with arrows.
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex gap-3">
              <FiHelpCircle size={20} style={{ color: '#2dd4bf', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="fw-semibold small" style={{ color: '#f1f0fa' }}>
                  Quiz
                </div>
                <div className="small" style={{ color: 'rgba(241,240,250,0.6)' }}>
                  Multiple choice with instant feedback + explanations.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-tile p-4 mb-4">
          <h2 className="h5 fw-bold mb-3" style={{ color: '#f1f0fa' }}>
            Tips
          </h2>
          <ul className="small mb-0" style={{ color: 'rgba(241,240,250,0.6)', lineHeight: 1.8 }}>
            <li>Longer, detailed notes generate richer packs — aim for 500+ words.</li>
            <li>
              If upload fails, check that the <code>uploads</code> bucket is Public and CORS allows
              this origin.
            </li>
            <li>Use Copy / Download .txt / .md on each study page to export.</li>
          </ul>
        </div>

        <div className="d-flex gap-3">
          <button onClick={() => navigate('/app')} className="btn btn-primary px-4">
            <FiFileText className="me-2" />
            Try it now
          </button>
          <button onClick={() => navigate('/')} className="btn btn-outline-light px-4">
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
};
