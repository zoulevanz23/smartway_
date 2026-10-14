/**
 * CJS runtime copy of _lib/validators.ts.
 * See ssrf.js header for why the .js duplicate exists.
 */
const { z } = require('zod');

const generateSchema = z.object({
  text: z.string().min(10).max(20000).optional(),
  fileUrl: z.string().url().optional(),
  flashcardCount: z.number().int().min(1).max(100).optional(),
  quizCount: z.number().int().min(1).max(100).optional(),
});

const packSchema = z.object({
  content_hash: z.string(),
  pack: z.object({
    summary: z.object({
      overview: z.string(),
      keyPoints: z.array(z.object({ title: z.string(), explanation: z.string() })),
      definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
    }),
    flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
    quiz: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        correct: z.number(),
        explanation: z.string(),
      })
    ),
  }),
});

module.exports = { generateSchema, packSchema };
