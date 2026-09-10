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

    const { text, fileUrl } = parsed.data;
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

    const maxChars = 4000;
    let processedContent = content;
    if (content.length > maxChars) {
      const head = content.slice(0, 2800);
      const tail = content.slice(-1200);
      processedContent = head + '\n[...middle truncated...]\n' + tail;
    }

    const contentWords = processedContent.split(/\s+/).length;
    const contentSentences = processedContent.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
    const targetFlashcards = Math.min(8, Math.max(5, Math.floor(contentWords / 120)));
    const targetQuiz = Math.min(8, Math.max(5, Math.floor(contentWords / 150)));
    const targetKeyPoints = Math.min(5, Math.max(3, Math.floor(contentSentences / 10)));

    const prompt = `You are an expert study assistant. Use the source content ONLY to identify topics, then use your knowledge to build a rich, accurate study pack. Stay faithful to the source topics — do not invent unrelated subjects.

CONTENT: ${contentWords} words, ${contentSentences} sentences

Tasks:
1. Summary: 1 overview (2-3 sentences) + EXACTLY ${targetKeyPoints} key points (title + 60-90 word explanation) + 3-5 definitions (term + 30-50 words)
2. Flashcards: EXACTLY ${targetFlashcards} Q/A pairs (question 10-16 words, answer 60-90 words)
3. Quiz: EXACTLY ${targetQuiz} multiple-choice (4 options, correct index 0-3, 60-90 word explanation)

SOURCE CONTENT:
${processedContent}

FORMAT YOUR RESPONSE AS VALID JSON ONLY (no markdown, no extra text):
{
  "summary": {
    "overview": "3-4 sentence synthesis of the source themes",
    "keyPoints": [{ "title": "Specific Concept Name", "explanation": "100-150 word focused explanation" }],
    "definitions": [{ "term": "Term", "definition": "40-60 word precise definition" }]
  },
  "flashcards": [{ "front": "Question (12-18 words)", "back": "Answer (80-120 words)" }],
  "quiz": [{ "question": "Question text", "options": ["A","B","C","D"], "correct": 0, "explanation": "80-120 word explanation" }]
}`;

    async function callGemini() {
      let retryCount = 0;
      const maxRetries = 3;
      while (retryCount <= maxRetries) {
        try {
          const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
          const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096 } },
            { headers: { 'Content-Type': 'application/json' }, timeout: 150000 }
          );
          const txt = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!txt) throw new Error('Gemini returned an empty response');
          return txt;
        } catch (apiError) {
          const status = apiError.response?.status;
          if ((status === 429 || status === 503) && retryCount < maxRetries) {
            const retryAfter = Number(apiError.response.headers?.['retry-after'] || 0) * 1000;
            const delay = retryAfter ? retryAfter + 500 : Math.pow(2, retryCount) * 2000 + 1000 + Math.floor(Math.random() * 500);
            await new Promise(r => setTimeout(r, delay));
            retryCount++;
            continue;
          }
          throw apiError;
        }
      }
    }

    async function callGroq() {
      try {
        const groqResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4096 },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 150000 }
        );
        const txt = groqResponse.data.choices?.[0]?.message?.content;
        if (!txt) throw new Error('Groq returned an empty response');
        return txt;
      } catch (groqErr) { throw groqErr; }
    }

    let aiResponse;
    const useGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;

    if (useGemini) {
      try { aiResponse = await callGemini(); }
      catch (geminiErr) {
        const status = geminiErr.response?.status;
        if ((status === 503 || status === 429) && hasGroq) {
          try { aiResponse = await callGroq(); }
          catch (groqErr) { throw geminiErr; }
        } else { throw geminiErr; }
      }
    } else if (hasGroq) { aiResponse = await callGroq(); }
    else { throw new Error('No AI provider configured'); }

    let studyPack;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      studyPack = JSON.parse(jsonMatch[0]);
    } catch (parseError) { throw new Error('Failed to parse AI response.'); }

    return res.status(200).json(studyPack);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({ error: 'Invalid AI provider API key.', requestId });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'AI rate limit exceeded.', requestId, retryAfter: 60 });
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
