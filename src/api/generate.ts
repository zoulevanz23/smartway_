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
