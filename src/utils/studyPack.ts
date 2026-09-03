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
