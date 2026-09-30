/**
 * AI Study Pack Generation API - Vercel 2025 Serverless Function
 * Optimized for large document processing with 2.5-minute timeout
 * P0: SSRF allowlist, 10MB cap, zod validation, private bucket
 */

const axios = require('axios');
const { isAllowedDownloadSize } = require('./_lib/ssrf');
const { generateSchema } = require('./_lib/validators');
const { supabase } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseClient;
function getSupabaseService() {
  if (!supabaseClient && SUPABASE_URL && SERVICE_ROLE_KEY) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  }
  return supabaseClient;
}

const ALLOWED_HOSTNAME_SUFFIXES = ['.supabase.co'];

function validateFileUrl(fileUrl) {
  try {
    const url = new URL(fileUrl);
    return ALLOWED_HOSTNAME_SUFFIXES.some((s) => url.hostname.endsWith(s)) && url.pathname.startsWith('/storage/v1/object/');
  } catch { return false; }
}

let pdfParse, mammoth;
try { pdfParse = require('pdf-parse'); mammoth = require('mammoth'); } catch {}

const generateRequestId = () => Math.random().toString(36).substring(2, 15);

/**
 * Salvage a JSON object from a response that was cut off by the output-token
 * ceiling: close any dangling string/array/object so the complete leading items
 * still parse instead of the whole request failing.
 */
function repairTruncatedJson(source) {
  let out = '';
  const stack = [];
  let inString = false;
  let escaped = false;
  for (const ch of source) {
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; out += ch; continue; }
    if (ch === '{' || ch === '[') { stack.push(ch === '{' ? '}' : ']'); out += ch; continue; }
    if (ch === '}' || ch === ']') { stack.pop(); out += ch; continue; }
    out += ch;
  }
  if (inString) out += '"';
  out = out.replace(/,\s*$/, '');
  // A dangling `"key":` with no value cannot be repaired; drop the fragment.
  out = out.replace(/,?\s*"[^"]*"\s*:\s*$/, '');
  out = out.replace(/,?\s*"[^"]*"\s*:\s*null\s*$/, '');
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i];
  try { return JSON.parse(out); } catch { return null; }
}

function extractStudyPack(raw) {
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  try {
    return JSON.parse(match[0]);
  } catch {
    const repaired = repairTruncatedJson(match[0]);
    if (repaired) {
      console.warn('[generate] Response was truncated; recovered partial JSON');
      return repaired;
    }
    throw new Error('Failed to parse AI response.');
  }
}

const MIN_CONTENT_COUNT = 10;
const MAX_CONTENT_COUNT = 50;

// Never generate fewer than the user asked for; the floor is 10.
const clampContentCount = (value, fallback = MIN_CONTENT_COUNT) => {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(MAX_CONTENT_COUNT, Math.max(MIN_CONTENT_COUNT, n));
};

const extractTextFromBuffer = async (buffer, contentType) => {
  try {
    if (contentType.includes('pdf')) {
      if (!pdfParse) throw new Error('PDF processing not available');
      const data = await pdfParse(buffer);
      return data.text;
    } else if (contentType.includes('word') || contentType.includes('document')) {
      if (!mammoth) throw new Error('Word document processing not available');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (contentType.includes('text')) {
      return buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${contentType}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

const processFileUrl = async (fileUrl) => {
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'SmartWay-AI/2.0' }
    });
    const buffer = Buffer.from(response.data);
    if (!isAllowedDownloadSize(buffer)) {
      throw new Error('File exceeds 10MB limit');
    }
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    return await extractTextFromBuffer(buffer, contentType);
  } catch (error) {
    throw new Error(`Failed to download or process file: ${error.message}`);
  }
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const requestId = generateRequestId();
  console.log(`[${requestId}] Processing generation request`);

  try {
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error.', requestId });
    }

    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body.', requestId, details: parsed.error.flatten() });
    }

    const { text, fileUrl, flashcardCount, quizCount } = parsed.data;
    const targetFlashcards = clampContentCount(flashcardCount);
    const targetQuiz = clampContentCount(quizCount);
    let content = '';

    if (fileUrl) {
      if (!validateFileUrl(fileUrl)) {
        return res.status(400).json({ error: 'Invalid file URL. Must be a Supabase storage URL.', requestId });
      }
      content = await processFileUrl(fileUrl);
    } else if (text) {
      content = text;
    } else {
      return res.status(400).json({ error: 'No content provided.', requestId });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Content too short.', requestId });
    }

    // Larger packs need more source material to stay varied, so scale the
    // truncation window with the requested counts.
    const maxChars = Math.min(12000, 4000 + (targetFlashcards + targetQuiz - 2 * MIN_CONTENT_COUNT) * 200);
    let processedContent = content;
    if (content.length > maxChars) {
      const head = content.slice(0, Math.round(maxChars * 0.7));
      const tail = content.slice(-Math.round(maxChars * 0.3));
      processedContent = head + '\n[...middle truncated...]\n' + tail;
    }

    const contentWords = processedContent.split(/\s+/).length;
    const contentSentences = processedContent.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
    const targetKeyPoints = Math.min(8, Math.max(3, Math.floor(contentSentences / 10)));

    // Keep the per-item budget sane as the requested count grows, so the JSON is
    // never cut off mid-object. The 8192 cap below leaves ample headroom.
    const totalItems = targetFlashcards + targetQuiz;
    const answerWords = totalItems <= 20 ? '60-90' : totalItems <= 40 ? '55-75' : totalItems <= 60 ? '45-60' : '30-45';
    const keyPointWords = totalItems <= 20 ? '60-90' : totalItems <= 40 ? '50-70' : '40-55';

    const prompt = `You are an expert study assistant. Use the source content ONLY to identify topics, then use your knowledge to build a rich, accurate study pack. Stay faithful to the source topics — do not invent unrelated subjects.

CONTENT: ${contentWords} words, ${contentSentences} sentences

Tasks (the item counts are MINIMUMS — never return fewer than stated, and keep every item distinct):
1. Summary: 1 overview (2-3 sentences) + EXACTLY ${targetKeyPoints} key points (title + ${keyPointWords} word explanation) + 3-5 definitions (term + 25-40 words)
2. Flashcards: EXACTLY ${targetFlashcards} Q/A pairs (question 10-16 words, answer ${answerWords} words)
3. Quiz: EXACTLY ${targetQuiz} multiple-choice (4 short options, correct index 0-3, ${answerWords} word explanation)

SOURCE CONTENT:
${processedContent}

FORMAT YOUR RESPONSE AS VALID JSON ONLY (no markdown, no extra text):
{
  "summary": {
    "overview": "3-4 sentence synthesis of the source themes",
    "keyPoints": [{ "title": "Specific Concept Name", "explanation": "focused explanation" }],
    "definitions": [{ "term": "Term", "definition": "precise definition" }]
  },
  "flashcards": [{ "front": "Question (12-18 words)", "back": "Answer" }],
  "quiz": [{ "question": "Question text", "options": ["A","B","C","D"], "correct": 0, "explanation": "Explanation" }]
}`;

    const maxOutputTokens = Math.min(16384, 2048 + targetFlashcards * 180 + targetQuiz * 220);

    const GEMINI_FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

    async function callGeminiModel(model) {
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens } },
        { headers: { 'Content-Type': 'application/json' }, timeout: 150000 }
      );
      const txt = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!txt) throw new Error(`Gemini (${model}) returned an empty response`);
      return txt;
    }

    async function callGemini() {
      const primary = process.env.GEMINI_MODEL || 'gemini-flash-latest';
      const models = [primary, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primary)];
      let lastError;
      for (const model of models) {
        let retryCount = 0;
        const maxRetries = 1;
        while (retryCount <= maxRetries) {
          try {
            return await callGeminiModel(model);
          } catch (apiError) {
            lastError = apiError;
            const status = apiError.response?.status;
            if ((status === 429 || status === 503) && retryCount < maxRetries) {
              const retryAfter = Number(apiError.response.headers?.['retry-after'] || 0) * 1000;
              const delay = retryAfter ? retryAfter + 500 : 2000 + Math.floor(Math.random() * 500);
              await new Promise((r) => setTimeout(r, delay));
              retryCount++;
              continue;
            }
            break;
          }
        }
      }
      throw lastError;
    }

    async function callGroq() {
      // gpt-oss-* are reasoning models: without reasoning_effort/max_tokens headroom
      // the budget is consumed by reasoning tokens and `content` comes back empty.
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: Math.min(32768, 2048 + targetFlashcards * 160 + targetQuiz * 200),
          reasoning_effort: 'low',
        },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 150000 }
      );
      const txt = groqResponse.data.choices?.[0]?.message?.content;
      if (!txt) throw new Error('Groq returned an empty response');
      return txt;
    }

    let aiResponse;
    const useGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;

    if (useGemini) {
      try { aiResponse = await callGemini(); }
      catch (geminiErr) {
        const status = geminiErr.response?.status;
        if ((status === 503 || status === 429 || status === 404) && hasGroq) {
          try { aiResponse = await callGroq(); }
          catch (groqErr) { throw geminiErr; }
        } else { throw geminiErr; }
      }
    } else if (hasGroq) { aiResponse = await callGroq(); }
    else { throw new Error('No AI provider configured'); }

    let studyPack;
    try {
      studyPack = extractStudyPack(aiResponse);
    } catch (parseError) { throw new Error('Failed to parse AI response.'); }

    return res.status(200).json(studyPack);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({ error: 'Invalid AI provider API key.', requestId });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'AI rate limit exceeded.', requestId, retryAfter: 60 });
    }
    if (error.response?.status === 503) {
      return res.status(503).json({ error: 'AI provider busy (503). The free tier is rate limited — please retry shortly.', requestId, retryAfter: 30 });
    }
    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({ error: 'Request timed out.', requestId });
    }
    if (error.message.includes('File exceeds 10MB limit')) {
      return res.status(413).json({ error: 'File too large (10MB limit).', requestId });
    }
    return res.status(500).json({ error: error.message || 'An unexpected error occurred.', requestId });
  }
}
