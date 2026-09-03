import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
} from 'framer-motion';
import {
  FiBookOpen,
  FiCreditCard,
  FiHelpCircle,
  FiFileText,
  FiSend,
  FiArrowRight,
  FiZap,
} from 'react-icons/fi';
import { Logo } from '@components/Logo';
import { Magnetic } from '@components/Magnetic';
import { StudyConsole } from '@components/StudyConsole';

const OPS_EASE = [0.16, 1, 0.3, 1] as const;

// Choreographed "systems online" boot-up — different roles move differently:
// headline words stagger, subhead fades up after, console panels boot in sequence.
const heroWordVar = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.1 + i * 0.09, duration: 0.7, ease: OPS_EASE },
  }),
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const reduced = useReducedMotion();

  // Scroll-scrubbed "pipeline" — the line draws itself and the step number
  // counts up as you scroll through the section.
  const pipelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: pipelineRef, offset: ['start 80%', 'end 70%'] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const lineScale = useTransform(smoothProgress, [0, 1], [0, 1]);
  const lineOpacity = useTransform(smoothProgress, [0, 0.12], [0, 1]);
  const activeStep = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 3]);
  const lineGradient = 'linear-gradient(90deg, #4f46e5, #22d3ee)';

  // Cursor-tracked halo on the hero console.
  const mx = useMotionValue(-400);
  const my = useMotionValue(-300);
  const haloBg = useMotionTemplate`radial-gradient(240px circle at ${mx}px ${my}px, rgba(99,91,255,0.12), transparent 70%)`;

  const headline = ['You', 'did', 'the', 'reading.', "We'll", 'handle', 'the', 'review.'];

  const steps = [
    {
      n: '01',
      title: 'Drop your material',
      desc: 'PDF, DOCX, or pasted notes — whatever you have.',
      accent: '#818cf8',
    },
    {
      n: '02',
      title: 'Get the pack',
      desc: 'Summary, flashcards, and a quiz that actually tests you.',
      accent: '#22d3ee',
    },
    {
      n: '03',
      title: 'Find the gaps',
      desc: 'Study what you missed, not what you already know.',
      accent: '#2dd4bf',
    },
  ];

  return (
    <div className="min-vh-100 bg-gradient-main position-relative">
      <div
        className="container px-3 pt-4"
        style={{ maxWidth: '1200px', position: 'relative', zIndex: 2 }}
      >
        {/* Top bar */}
        <motion.nav
          className="glass-nav d-flex align-items-center justify-content-between px-3 py-2"
          initial={reduced ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: OPS_EASE }}
        >
          <Logo size={44} showText />
          <button
            onClick={() => navigate('/app')}
            className="btn btn-primary d-flex align-items-center gap-1"
            style={{ padding: '0.45rem 1.1rem', fontSize: 14 }}
          >
            Launch Console
            <FiArrowRight size={15} />
          </button>
        </motion.nav>

        {/* ============ HERO — asymmetric 58/42, left-aligned ============ */}
        <section className="hero-section row align-items-center mb-5">
          {/* Left: message stack */}
          <div className="col-lg-6 col-md-7 order-1">
            <motion.div
              className="d-inline-flex align-items-center gap-2 mb-3"
              style={{
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgba(241,240,250,0.45)',
                fontFamily: 'monospace',
              }}
              initial={reduced ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: OPS_EASE }}
            >
              <span
                style={{
                  width: 18,
                  height: 1,
                  background: 'rgba(129,140,248,0.4)',
                  display: 'inline-block',
                }}
              />
              PDF · DOCX · Pasted text → Study pack
            </motion.div>

            <motion.h1
              className="font-display fw-bold mb-3"
              style={{
                fontSize: 'clamp(2.2rem, 5.4vw, 3.6rem)',
                lineHeight: 1.04,
                color: '#f1f0fa',
              }}
            >
              {headline.map((w, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={heroWordVar}
                  initial={reduced ? false : 'hidden'}
                  animate="show"
                  className="d-inline-block"
                  style={{
                    marginRight: '0.28em',
                    fontStyle: w === "We'll" ? 'italic' : 'normal',
                    fontWeight: w === 'review.' ? 700 : 700,
                  }}
                >
                  {w === 'review.' ? <span className="gradient-text">review.</span> : w}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="mb-4"
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: 'rgba(241,240,250,0.62)',
                maxWidth: '30rem',
              }}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: OPS_EASE }}
            >
              Paste what you have or drop a file. You get back the three things you actually study
              from — a tight summary, cards you flip with your keyboard, and a quiz that shows
              what's still fuzzy.
            </motion.p>

            <motion.div
              className="d-flex flex-wrap align-items-center gap-3 mb-4"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.7, ease: OPS_EASE }}
            >
              <Magnetic>
                <button
                  onClick={() => navigate('/app')}
                  className="btn btn-primary btn-lg"
                  style={{ fontSize: 17, fontWeight: 600, padding: '0.8rem 1.6rem' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <FiZap size={18} />
                    Power up a study pack
                  </span>
                </button>
              </Magnetic>
              <button
                onClick={() => navigate('/about')}
                className="btn btn-outline-light btn-lg"
                style={{ fontSize: 16 }}
              >
                See how it works
              </button>
            </motion.div>

            <motion.div
              className="d-flex align-items-center gap-3"
              style={{ flexWrap: 'wrap' }}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {[
                { l: 'PDF', c: '#818cf8' },
                { l: 'DOCX', c: '#22d3ee' },
                { l: 'TXT', c: '#2dd4bf' },
              ].map((f) => (
                <span
                  key={f.l}
                  className="d-inline-flex align-items-center gap-1.5"
                  style={{ fontSize: 12.5, color: 'rgba(241,240,250,0.45)' }}
                >
                  <FiFileText size={14} style={{ color: f.c }} />
                  {f.l}
                </span>
              ))}
              <span style={{ fontSize: 12.5, color: 'rgba(241,240,250,0.45)' }}>
                — or paste text
              </span>
            </motion.div>
          </div>

          {/* Right: the study console (product itself) */}
          <motion.div
            className="col-lg-6 col-md-5 order-2 hero-console-col mt-4 mt-md-0"
            onMouseMove={(e) => {
              if (reduced) return;
              const r = e.currentTarget.getBoundingClientRect();
              mx.set(e.clientX - r.left);
              my.set(e.clientY - r.top);
            }}
            initial={reduced ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: OPS_EASE }}
            style={{ position: 'relative' }}
          >
            <motion.div
              className="position-absolute"
              style={{ inset: 0, background: haloBg, zIndex: -1 }}
              aria-hidden
            />
            <StudyConsole />
          </motion.div>
        </section>

        {/* ============ PIPELINE — scroll-scrubbed story ============ */}
        <section ref={pipelineRef} className="mb-5 position-relative" style={{ padding: '2rem 0' }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <motion.div
              style={{ width: 28, height: 28 }}
              initial={reduced ? false : { rotate: 0 }}
              whileInView={{ rotate: 360 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <FiZap size={26} style={{ color: '#818cf8' }} />
            </motion.div>
            <h2
              className="font-display fw-bold mb-0"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#f1f0fa' }}
            >
              From chaos to <span className="gradient-text">consolidated.</span>
            </h2>
          </div>

          {/* Progress line that draws as you scroll */}
          <div
            className="position-relative my-4"
            style={{ height: 3, background: 'rgba(129,140,248,0.14)', borderRadius: 999 }}
          >
            <motion.div
              className="position-absolute top-0 start-0 h-100"
              style={{
                originX: 0,
                scaleX: lineScale,
                opacity: lineOpacity,
                borderRadius: 999,
                background: lineGradient,
              }}
            />
          </div>

          <div className="row g-4">
            {steps.map((s, i) => (
              <PipelineStep key={s.n} step={s} index={i} activeStep={activeStep} />
            ))}
          </div>
        </section>

        {/* ============ FEATURES — one hero + two supporting (broken 3-up) ============ */}
        <section className="mb-5">
          <div className="row g-4 align-items-stretch">
            <div className="col-lg-6">
              <div className="bento-tile bento-tile--accent h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div
                    className="d-flex align-items-center justify-content-center rounded mb-3"
                    style={{
                      width: 60,
                      height: 60,
                      background: 'linear-gradient(135deg,#4f46e5,#22d3ee)',
                      color: '#fff',
                      boxShadow: '0 10px 30px rgba(99,91,255,0.4)',
                    }}
                  >
                    <FiBookOpen size={28} />
                  </div>
                  <h3
                    className="font-display fw-bold mb-2"
                    style={{ fontSize: 22, color: '#f1f0fa' }}
                  >
                    Summaries that skip the fluff
                  </h3>
                  <p
                    className="mb-0"
                    style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(241,240,250,0.62)' }}
                  >
                    Key concepts, definitions, and the points that matter — extracted and expanded
                    so you actually retain them, not a wall of reformatted text.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="row g-4 h-100">
                <div className="col-md-6">
                  <div className="bento-tile h-100 p-4">
                    <FiCreditCard size={26} style={{ color: '#22d3ee', marginBottom: 14 }} />
                    <h4
                      className="font-display fw-semibold mb-1"
                      style={{ fontSize: 16, color: '#f1f0fa' }}
                    >
                      Flip-ready cards
                    </h4>
                    <p className="mb-0" style={{ fontSize: 13.5, color: 'rgba(241,240,250,0.6)' }}>
                      Keyboard-driven active recall.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bento-tile h-100 p-4">
                    <FiHelpCircle size={26} style={{ color: '#2dd4bf', marginBottom: 14 }} />
                    <h4
                      className="font-display fw-semibold mb-1"
                      style={{ fontSize: 16, color: '#f1f0fa' }}
                    >
                      Quiz that scores you
                    </h4>
                    <p className="mb-0" style={{ fontSize: 13.5, color: 'rgba(241,240,250,0.6)' }}>
                      Instant feedback, real accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOOTER CTA ============ */}
        <section className="text-center" style={{ padding: '2rem 0 3rem' }}>
          <h2
            className="font-display fw-bold mb-2"
            style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)', color: '#f1f0fa' }}
          >
            Your next study session, <span className="gradient-text">already mounted.</span>
          </h2>
          <p className="mb-4" style={{ color: 'rgba(241,240,250,0.55)' }}>
            Made by Josh Ivan Sartin. All rights reserved. {year}
          </p>
          <Magnetic>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-primary btn-lg px-5 py-3"
              style={{ fontSize: 18, fontWeight: 600 }}
            >
              <span className="d-flex align-items-center gap-2">
                <FiSend size={18} />
                Open the console
              </span>
            </button>
          </Magnetic>
        </section>
      </div>
    </div>
  );
};

interface PipelineStepProps {
  step: { n: string; title: string; desc: string; accent: string };
  index: number;
  activeStep: ReturnType<typeof useTransform<number>>;
}

const PipelineStep: React.FC<PipelineStepProps> = ({ step, index, activeStep }) => {
  const reduced = useReducedMotion();
  const opacity = useTransform(activeStep, (v) => (v >= index ? 1 : 0.4));
  const scale = useTransform(activeStep, (v) => (v === index ? 1.08 : 1));

  return (
    <div className="col-md-4">
      <motion.div
        className="bento-tile h-100 p-4"
        style={{ opacity, scale }}
        initial={reduced ? false : { opacity: 0, y: 24 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: OPS_EASE, delay: index * 0.08 }}
      >
        <motion.span
          className="font-display fw-bold d-block mb-2"
          style={{ fontSize: 30, color: step.accent }}
          whileHover={reduced ? undefined : { x: 4 }}
        >
          {step.n}
        </motion.span>
        <h3 className="font-display fw-bold mb-1" style={{ fontSize: 18, color: '#f1f0fa' }}>
          {step.title}
        </h3>
        <p className="mb-0" style={{ fontSize: 14, color: 'rgba(241,240,250,0.6)' }}>
          {step.desc}
        </p>
      </motion.div>
    </div>
  );
};
