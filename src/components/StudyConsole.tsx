import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiBookOpen, FiCreditCard, FiTrendingUp } from 'react-icons/fi';

// Live "study pack console" — the product itself, shown as an instrument panel.
// Renders a generated study pack's telemetry: summary, flashcard progress, quiz score.
const OPS_EASE = [0.16, 1, 0.3, 1] as const;

const bootVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.25 + i * 0.14, duration: 0.6, ease: OPS_EASE },
  }),
};

const Row: React.FC<{ label: string; value: string; bar: number; tone: string; glow: string }> = ({
  label,
  value,
  bar,
  tone,
  glow,
}) => (
  <div className="w-100">
    <div className="d-flex align-items-center justify-content-between mb-1">
      <span
        style={{
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(241,240,250,0.5)',
        }}
      >
        {label}
      </span>
      <span className="fw-semibold" style={{ fontSize: 13, color: '#f1f0fa' }}>
        {value}
      </span>
    </div>
    <div className="progress" style={{ height: 6 }}>
      <div
        className="progress-bar"
        style={{ width: `${bar}%`, background: tone, boxShadow: `0 0 12px ${glow}` }}
      />
    </div>
  </div>
);

export const StudyConsole: React.FC = () => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <StaticConsole />;
  }

  return (
    <div
      className="position-relative study-console-wrap"
      style={{
        perspective: 1400,
        filter: 'drop-shadow(0 30px 60px rgba(79,70,229,0.35))',
      }}
    >
      {/* Behind panel: LED ring glow */}
      <div
        aria-hidden
        className="position-absolute rounded"
        style={{
          inset: -20,
          background: 'radial-gradient(60% 60% at 70% 20%, rgba(34,211,238,0.22), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <motion.div
        className="position-relative rounded p-3 study-console-tilt"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateY(-8deg) rotateX(3deg)',
          background:
            'linear-gradient(180deg, rgba(79,70,229,0.10), transparent 30%), rgba(18,16,42,0.85)',
          border: '1px solid rgba(129,140,248,0.25)',
          backdropFilter: 'blur(14px)',
        }}
        animate={{ transform: 'rotateY(-8deg) rotateX(3deg)' }}
        transition={{ type: 'spring', stiffness: 60, damping: 20 }}
      >
        {/* Console header */}
        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
          <div className="d-flex align-items-center gap-2">
            <span className="rounded" style={{ width: 9, height: 9, background: '#ef4444' }} />
            <span className="rounded" style={{ width: 9, height: 9, background: '#f59e0b' }} />
            <span className="rounded" style={{ width: 9, height: 9, background: '#10b981' }} />
            <span
              className="ms-2"
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                color: 'rgba(241,240,250,0.45)',
                textTransform: 'uppercase',
              }}
            >
              smartway / study-pack
            </span>
          </div>
          <span
            className="d-inline-flex align-items-center gap-1 rounded-pill"
            style={{
              fontSize: 10,
              padding: '2px 8px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399',
            }}
          >
            <motion.span
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            online
          </span>
        </div>

        {/* Title block */}
        <motion.div
          variants={bootVariants}
          custom={0}
          initial="hidden"
          animate="show"
          className="px-1 mb-3"
        >
          <div className="d-flex align-items-center gap-2 mb-1">
            <FiBookOpen size={14} style={{ color: '#818cf8' }} />
            <span className="fw-bold" style={{ fontSize: 15, color: '#f1f0fa' }}>
              Study Pack #2472
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(241,240,250,0.5)' }}>
            Human Physiology · Ch. 4 — The Nervous System
          </span>
        </motion.div>

        {/* Telemetry rows */}
        <div className="d-grid gap-3 px-1">
          <motion.div variants={bootVariants} custom={1} initial="hidden" animate="show">
            <Row
              label="Summary"
              value="12 key points"
              bar={100}
              tone="linear-gradient(90deg,#4f46e5,#22d3ee)"
              glow="rgba(99,91,255,0.6)"
            />
          </motion.div>
          <motion.div variants={bootVariants} custom={2} initial="hidden" animate="show">
            <Row
              label="Flashcards"
              value="24 / 24"
              bar={100}
              tone="linear-gradient(90deg,#8b5cf6,#22d3ee)"
              glow="rgba(139,92,246,0.6)"
            />
          </motion.div>
          <motion.div variants={bootVariants} custom={3} initial="hidden" animate="show">
            <Row
              label="Quiz accuracy"
              value="87%"
              bar={87}
              tone="linear-gradient(90deg,#22d3ee,#2dd4bf)"
              glow="rgba(34,211,238,0.6)"
            />
          </motion.div>
        </div>

        {/* Footer chips */}
        <motion.div
          variants={bootVariants}
          custom={4}
          initial="hidden"
          animate="show"
          className="d-flex gap-2 mt-3 px-1"
        >
          {[
            { l: 'SUMMARY', c: '#818cf8' },
            { l: 'CARDS', c: '#22d3ee' },
            { l: 'QUIZ', c: '#2dd4bf' },
          ].map((chip) => (
            <span
              key={chip.l}
              className="rounded-pill px-2 py-1"
              style={{
                fontSize: 9,
                letterSpacing: '0.08em',
                color: chip.c,
                background: 'rgba(18,16,42,0.9)',
                border: '1px solid rgba(129,140,248,0.2)',
              }}
            >
              {chip.l}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Static (reduced-motion / SSR) version — same look, no animation.
const StaticConsole: React.FC = () => (
  <div
    style={{ filter: 'drop-shadow(0 30px 60px rgba(79,70,229,0.35))' }}
    className="study-console-wrap"
  >
    <div
      className="position-relative rounded p-3 study-console-tilt"
      style={{
        transform: 'rotateY(-8deg) rotateX(3deg)',
        background:
          'linear-gradient(180deg, rgba(79,70,229,0.10), transparent 30%), rgba(18,16,42,0.85)',
        border: '1px solid rgba(129,140,248,0.25)',
      }}
    >
      <div className="row align-items-center g-2">
        <div className="col-4">
          <FiCreditCard size={46} style={{ color: '#818cf8' }} />
        </div>
        <div className="col-7">
          <div
            style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#f1f0fa' }}
          >
            Study Pack #2472
          </div>
          <div style={{ fontSize: 12, color: 'rgba(241,240,250,0.6)' }}>
            Generated from your notes
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center mt-3">
        <FiTrendingUp size={18} style={{ color: '#2dd4bf' }} />
      </div>
    </div>
  </div>
);
