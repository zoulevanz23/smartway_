import type { StudyPackResult, GenerationSettings } from '@api/generate';
import { sanitizeSettings, MIN_CONTENT_COUNT } from '@api/generate';

const STOP = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'has',
  'have',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'as',
  'from',
  'which',
  'what',
  'when',
  'where',
  'how',
  'why',
]);

function sentencesOf(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function wordsOf(s: string): string[] {
  return s
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function scoreSentences(sents: string[]): { s: string; score: number }[] {
  const freq: Record<string, number> = {};
  sents.forEach((sent) => wordsOf(sent).forEach((w) => (freq[w] = (freq[w] || 0) + 1)));
  return sents
    .map((s, i) => {
      let score = 0;
      const ws = wordsOf(s);
      ws.forEach((w) => (score += freq[w] || 0));
      // position bonus: first/last paragraphs matter
      if (i < 3) score += 3;
      if (i >= sents.length - 3) score += 2;
      // cue phrases
      if (/is defined as|is called|refers to|:|important|key|essential/i.test(s)) score += 5;
      score = score / Math.max(1, Math.sqrt(ws.length)); // normalize length
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);
}

function keywordsOf(text: string, n = 20): string[] {
  const freq: Record<string, number> = {};
  const sents = sentencesOf(text);
  sents.forEach((sent) => wordsOf(sent).forEach((w) => (freq[w] = (freq[w] || 0) + 1)));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function clusterSentences(scored: { s: string; score: number }[], n: number): string[] {
  const picked: string[] = [];
  const usedWords = new Set<string>();
  for (const { s } of scored) {
    const ws = new Set(wordsOf(s));
    let overlap = 0;
    ws.forEach((w) => {
      if (usedWords.has(w)) overlap++;
    });
    if (picked.length > 0 && overlap / ws.size > 0.6) continue; // too similar
    picked.push(s);
    ws.forEach((w) => usedWords.add(w));
    if (picked.length >= n) break;
  }
  return picked;
}

export function buildFallbackPack(content: string, options?: Partial<GenerationSettings>): StudyPackResult {
  const targets = sanitizeSettings(options);
  const targetCards = Math.max(MIN_CONTENT_COUNT, targets.flashcardCount);
  const targetQuiz = Math.max(MIN_CONTENT_COUNT, targets.quizCount);
  const sents = sentencesOf(content);
  if (sents.length === 0) {
    const fallback = content.slice(0, 200);
    return {
      summary: { overview: fallback, keyPoints: [], definitions: [] },
      flashcards: Array.from({ length: targetCards }, (_, i) => ({
        front: i === 0 ? 'What is the main topic?' : `What is the main topic (point ${i + 1})?`,
        back: fallback,
      })),
      quiz: Array.from({ length: targetQuiz }, (_, i) => ({
        question: i === 0 ? 'What does the content describe?' : `What does the content describe (point ${i + 1})?`,
        options: ['Main topic', `Unrelated A${i}`, `Unrelated B${i}`, `Unrelated C${i}`],
        correct: 0,
        explanation: fallback,
      })),
    };
  }

  const scored = scoreSentences(sents);
  const kws = keywordsOf(content, 20);

  // Summary: overview = top 2 sentences, keyPoints = next 3-5 clustered
  const keyCount = Math.min(5, Math.max(3, Math.floor(sents.length / 6)));
  const keySents = clusterSentences(scored, keyCount);
  const overview = scored
    .slice(0, 2)
    .map((x) => x.s)
    .join(' ');
  const keyPoints = keySents.map((s) => {
    const title = s
      .split(/\s+/)
      .slice(0, 6)
      .join(' ')
      .replace(/[,.;:]$/, '');
    return { title: title.charAt(0).toUpperCase() + title.slice(1), explanation: s };
  });

  // Definitions: Term: definition pattern, else top keywords + sentence
  const definitions: Array<{ term: string; definition: string }> = [];
  const colonRe = /^\s*([^:\n]{2,30})\s*:\s*(.{20,200})/;
  for (const s of sents) {
    const m = s.match(colonRe);
    if (m && definitions.length < 5)
      definitions.push({ term: m[1].trim(), definition: m[2].trim() });
  }
  for (let i = 0; i < kws.length && definitions.length < 5; i++) {
    const kw = kws[i];
    if (definitions.some((d) => d.term.toLowerCase() === kw)) continue;
    const sent = sents.find((s) => s.toLowerCase().includes(kw)) || '';
    if (sent)
      definitions.push({
        term: kw.charAt(0).toUpperCase() + kw.slice(1),
        definition: sent.slice(0, 140),
      });
  }

  // Flashcards: cloze deletion on a keyword. When the source has fewer sentences
  // than requested, sentences are reused but the cloze keyword rotates so each
  // card still targets a different term.
  const cardPool = keySents.length > 0 ? keySents : scored.map((x) => x.s);
  const flashcards = Array.from({ length: targetCards }, (_, i) => {
    const s = cardPool[i % cardPool.length];
    const ws = wordsOf(s);
    const candidates = ws.filter((w) => kws.includes(w));
    const kw = candidates.length > 0 ? candidates[i % candidates.length] : ws[0] || kws[i % kws.length] || 'concept';
    const front = s.replace(new RegExp(`\\b${kw}\\b`, 'i'), '___');
    return { front: front.length > 10 ? front : `What is ${kw}?`, back: s };
  });

  // Quiz: blank keyword, distractors from other keywords
  const quiz = Array.from({ length: targetQuiz }, (_, i) => {
    const s = cardPool[i % cardPool.length];
    const ws = wordsOf(s);
    const candidates = ws.filter((w) => kws.includes(w));
    const kw = candidates.length > 0 ? candidates[i % candidates.length] : ws[0] || kws[0] || 'concept';
    const correct = kw.charAt(0).toUpperCase() + kw.slice(1);
    const distractors = kws
      .filter((k) => k !== kw)
      .slice(i % 3, (i % 3) + 3)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1));
    while (distractors.length < 3) distractors.push('Related concept ' + (distractors.length + 1));
    const options = [correct, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(correct);
    return {
      question: s.replace(new RegExp(`\\b${kw}\\b`, 'i'), '___'),
      options,
      correct: correctIdx,
      explanation: s,
    };
  });

  return {
    summary: { overview, keyPoints, definitions },
    flashcards,
    quiz,
  } as unknown as StudyPackResult;
}
