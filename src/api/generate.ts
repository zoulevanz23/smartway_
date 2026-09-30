// Type definitions for the SmartWay Study Pack API
export interface StudyPackResult {
  summary: {
    overview: string;
    keyPoints: string[];
    definitions: Record<string, string> | Array<{ term: string; definition: string }>;
    importantConcepts?: string[];
  };
  flashcards: Array<{
    front: string;
    back: string;
    // Legacy support for question/answer format
    question?: string;
    answer?: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct: number | string; // Support both index and answer string
    answer?: string; // Legacy support
    explanation: string;
  }>;
}

// API Response type for error handling
export interface ApiResponse<T = StudyPackResult> {
  data?: T;
  error?: string;
  message?: string;
}

// ---------- Content count configuration ----------

/** A study pack never contains fewer cards/questions than this. */
export const MIN_CONTENT_COUNT = 10;
/** Upper bound so a single request cannot exceed the model's output budget. */
export const MAX_CONTENT_COUNT = 50;
/** Quick-pick options offered in the UI. */
export const CONTENT_COUNT_PRESETS = [10, 15, 20, 30] as const;

export interface GenerationSettings {
  flashcardCount: number;
  quizCount: number;
}

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  flashcardCount: MIN_CONTENT_COUNT,
  quizCount: MIN_CONTENT_COUNT,
};

/** Clamp a requested count into the supported range, falling back when absent/invalid. */
export function clampContentCount(value: unknown, fallback: number = MIN_CONTENT_COUNT): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(MAX_CONTENT_COUNT, Math.max(MIN_CONTENT_COUNT, n));
}

export function sanitizeSettings(input?: Partial<GenerationSettings> | null): GenerationSettings {
  return {
    flashcardCount: clampContentCount(input?.flashcardCount, MIN_CONTENT_COUNT),
    quizCount: clampContentCount(input?.quizCount, MIN_CONTENT_COUNT),
  };
}

// ---------- History ----------

/** A generated pack kept in local History so it can be reopened without regenerating. */
export interface StudyPackRecord {
  id: string;
  title: string;
  createdAt: string;
  settings: GenerationSettings;
  pack: StudyPackResult;
  /** True when produced by the on-device fallback instead of the AI provider. */
  isFallback?: boolean;
}
