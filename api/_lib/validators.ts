import { z } from 'zod';

export const generateSchema = z.object({
  text: z.string().min(10).max(20000).optional(),
  fileUrl: z.string().url().optional(),
});

export type GenerateInput = z.infer<typeof generateSchema>;

export const packSchema = z.object({
  content_hash: z.string(),
  pack: z.object({
    summary: z.object({
      overview: z.string(),
      keyPoints: z.array(z.object({ title: z.string(), explanation: z.string() })),
      definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
    }),
    flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
    quiz: z.array(z.object({ question: z.string(), options: z.array(z.string()), correct: z.number(), explanation: z.string() })),
  }),
});

export type PackInput = z.infer<typeof packSchema>;
