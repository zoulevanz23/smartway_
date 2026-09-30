export interface NormalizedFlashcard {
  question: string;
  answer: string;
}

export interface NormalizedQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface SummaryData {
  overview: string;
  keyPoints: Array<{ title: string; explanation: string }> | string[];
  definitions: Record<string, string> | Array<{ term: string; definition: string }>;
  keyConcepts?: string[];
}

export function normalizeFlashcards(data: unknown): NormalizedFlashcard[] {
  if (!Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>).map((card) => ({
    question: (card.front as string) || (card.question as string) || 'No question available',
    answer: (card.back as string) || (card.answer as string) || 'No answer available',
  }));
}

export function normalizeQuiz(data: unknown): NormalizedQuizQuestion[] {
  if (!Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>).map((q) => ({
    question: (q.question as string) || 'No question available',
    options: (q.options as string[]) || [],
    answer:
      q.options && typeof q.correct === 'number'
        ? ((q.options as string[])[q.correct as number] as string)
        : (q.answer as string) || '',
    explanation: (q.explanation as string) || 'No explanation available',
  }));
}

export function buildFlashcardsContent(cards: NormalizedFlashcard[]): string {
  const lines: string[] = ['SMARTWAY FLASHCARDS', '='.repeat(60), ''];
  cards.forEach((card) => {
    lines.push('Q: ' + card.question);
    lines.push('A: ' + card.answer);
    lines.push('');
  });
  return lines.join('\n');
}

export function buildQuizContent(questions: NormalizedQuizQuestion[]): string {
  const lines: string[] = ['SMARTWAY QUIZ', '='.repeat(60), ''];
  questions.forEach((q, i) => {
    lines.push(`Question ${i + 1}: ${q.question}`);
    q.options.forEach((opt, idx) => {
      const marker = opt === q.answer ? '*' : ' ';
      lines.push(`  ${marker} ${String.fromCharCode(65 + idx)}. ${opt}`);
    });
    lines.push(`Answer: ${q.answer}`);
    lines.push('');
  });
  return lines.join('\n');
}

export function buildSummaryContent(data: SummaryData): string {
  const lines: string[] = [];
  lines.push('STUDY SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Overview:\n${data.overview}`);
  lines.push('');
  if (data.keyPoints.length > 0) {
    lines.push('Key Learning Points:');
    lines.push('-'.repeat(60));
    const points: Array<{ title: string; explanation: string }> = Array.isArray(data.keyPoints)
      ? data.keyPoints.map((p: string | { title: string; explanation: string }) =>
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

/**
 * Best-effort human-readable title for a history entry.
 * Works for space-delimited and CJK text (no whitespace required to find a boundary).
 */
export function deriveTitle(source?: string | null, overview?: string | null): string {
  const clean = (source || '').replace(/\s+/g, ' ').trim();
  if (clean) {
    const sentence =
      clean
        .split(/[.!?。！？\n]/)
        .map((s) => s.trim())
        .find((s) => s.length >= 12) || clean;
    if (sentence.length >= 3) {
      return sentence.length > 60 ? `${sentence.slice(0, 60).trim()}…` : sentence;
    }
  }
  const fallback = (overview || '').replace(/\s+/g, ' ').trim();
  if (fallback.length >= 3) {
    return fallback.length > 60 ? `${fallback.slice(0, 60).trim()}…` : fallback;
  }
  return 'Untitled Study Pack';
}
