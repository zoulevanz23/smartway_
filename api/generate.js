/**
 * AI Study Pack Generation API - Vercel 2025 Serverless Function
 * Optimized for large document processing with 2.5-minute timeout
 */

const axios = require('axios');

// Dynamic package loading with fallbacks for serverless environment
let pdfParse, mammoth;
try {
  pdfParse = require('pdf-parse');
  mammoth = require('mammoth');
} catch (error) {
  console.log('[WARN] Document processing packages not available:', error.message);
}

// Utility functions
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
    console.log(`Processing file URL: ${fileUrl}`);
    
    // Validate URL format
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      throw new Error('Invalid file URL format');
    }
    
    // Log for debugging
    console.log(`Attempting to download from: ${fileUrl}`);
    
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'SmartWay-AI/2.0' }
    });

    console.log(`File downloaded successfully. Content-Type: ${response.headers['content-type']}, Size: ${response.data.length} bytes`);

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    return await extractTextFromBuffer(buffer, contentType);
  } catch (error) {
    console.error('Error processing file URL:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('HTTP Headers:', error.response.headers);
    }
    throw new Error(`Failed to download or process file: ${error.message}`);
  }
};

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = generateRequestId();
  console.log(`[${requestId}] Processing generation request`);

  try {
    // Validate API key (Gemini preferred, Groq as fallback)
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      console.error(`[${requestId}] Missing GEMINI_API_KEY and GROQ_API_KEY`);
      return res.status(500).json({
        error: 'Server configuration error. Set GEMINI_API_KEY (preferred) or GROQ_API_KEY in .env.',
        requestId
      });
    }

    let content = '';
    const { text, fileUrl } = req.body;

    // Process input
    if (fileUrl) {
      console.log(`[${requestId}] Processing file URL`);
      content = await processFileUrl(fileUrl);
    } else if (text) {
      console.log(`[${requestId}] Processing text input`);
      content = text;
    } else {
      return res.status(400).json({
        error: 'No content provided. Please provide either text or fileUrl.',
        requestId
      });
    }

    // Content validation
    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        error: 'Content too short. Please provide more substantial content.',
        requestId
      });
    }

    // Free-tier optimized: cap input to keep TPM ~3100 (vs 7300 before)
    const maxChars = 4000;
    let processedContent = content;
    if (content.length > maxChars) {
      const head = content.slice(0, 2800);
      const tail = content.slice(-1200);
      processedContent = head + '\n[...middle truncated...]\n' + tail;
      console.log(`[${requestId}] Content truncated from ${content.length} to ${processedContent.length} chars (4000 cap)`);
    }

    console.log(`[${requestId}] Content validated. Length: ${processedContent.length}`);

    // Reduced targets for free tier (~1500 output tokens vs 3500 before)
    const contentWords = processedContent.split(/\s+/).length;
    const contentSentences = processedContent.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
    const targetFlashcards = Math.min(8, Math.max(5, Math.floor(contentWords / 120)));
    const targetQuiz = Math.min(8, Math.max(5, Math.floor(contentWords / 150)));
    const targetKeyPoints = Math.min(5, Math.max(3, Math.floor(contentSentences / 10)));

    console.log(`[${requestId}] Targets: ${targetFlashcards} flashcards, ${targetQuiz} quiz, ${targetKeyPoints} key points`);

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
    "keyPoints": [
      { "title": "Specific Concept Name", "explanation": "100-150 word focused explanation with context and example" }
    ],
    "definitions": [
      { "term": "Term", "definition": "40-60 word precise definition" }
    ]
  },
  "flashcards": [
    { "front": "Question (12-18 words)", "back": "Answer (80-120 words)" }
  ],
  "quiz": [
    { "question": "Question text", "options": ["A","B","C","D"], "correct": 0, "explanation": "80-120 word explanation" }
  ]
}`;

    // Helper: call Gemini with retries
    async function callGemini() {
      let retryCount = 0;
      const maxRetries = 3;
      while (retryCount <= maxRetries) {
        try {
          console.log(`[${requestId}] Attempt ${retryCount + 1}/${maxRetries + 1} - Calling Gemini API`);
          const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
          const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 4096 },
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 150000 }
          );
          const txt = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!txt) throw new Error('Gemini returned an empty response');
          console.log(`[${requestId}] Gemini API call successful`);
          return txt;
        } catch (apiError) {
          if (apiError.response) console.error(`[${requestId}] Gemini error ${apiError.response.status}:`, JSON.stringify(apiError.response.data).slice(0, 600));
          const status = apiError.response?.status;
          if ((status === 429 || status === 503) && retryCount < maxRetries) {
            const retryAfter = Number(apiError.response.headers?.['retry-after'] || 0) * 1000;
            const delay = retryAfter ? retryAfter + 500 : Math.pow(2, retryCount) * 2000 + 1000 + Math.floor(Math.random() * 500);
            console.log(`[${requestId}] Gemini overloaded, retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            retryCount++;
            continue;
          }
          throw apiError;
        }
      }
    }

    async function callGroq() {
      console.log(`[${requestId}] Calling Groq API (fallback)`);
      try {
        const groqResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
          },
          {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            timeout: 150000,
          }
        );
        const txt = groqResponse.data.choices?.[0]?.message?.content;
        if (!txt) throw new Error('Groq returned an empty response');
        console.log(`[${requestId}] Groq API call successful`);
        return txt;
      } catch (groqErr) {
        if (groqErr.response) {
          console.error(`[${requestId}] Groq error ${groqErr.response.status}:`, JSON.stringify(groqErr.response.data).slice(0, 800));
        }
        throw groqErr;
      }
    }

    let aiResponse;
    const useGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;

    if (useGemini) {
      try {
        aiResponse = await callGemini();
      } catch (geminiErr) {
        const status = geminiErr.response?.status;
        if ((status === 503 || status === 429) && hasGroq) {
          console.log(`[${requestId}] Gemini unavailable (${status}), falling back to Groq...`);
          try {
            aiResponse = await callGroq();
          } catch (groqErr) {
            console.error(`[${requestId}] Groq fallback also failed:`, groqErr.message);
            throw geminiErr; // surface original Gemini error
          }
        } else {
          throw geminiErr;
        }
      }
    } else if (hasGroq) {
      aiResponse = await callGroq();
    } else {
      throw new Error('No AI provider configured');
    }

    // Parse response
    let studyPack;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      studyPack = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse failed:`, parseError.message);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    console.log(`[${requestId}] Success! Generated ${studyPack.flashcards?.length || 0} flashcards, ${studyPack.quiz?.length || 0} questions`);

    return res.status(200).json(studyPack);

  } catch (error) {
    console.error(`[${requestId}] Error:`, error.message);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    // Handle specific error types
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(500).json({
        error: 'Invalid AI provider API key. Please check GROQ_API_KEY and try again.',
        requestId
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'AI rate limit exceeded. Please wait a minute before trying again.',
        requestId,
        retryAfter: 60,
        info: 'Free tier allows a limited number of requests per minute'
      });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({
        error: 'Request timed out. Please try again with shorter content.',
        requestId
      });
    }

    // Handle file download errors (Supabase-related)
    if (error.message.includes('Failed to download') || error.message.includes('getaddrinfo ENOTFOUND')) {
      return res.status(400).json({
        error: 'Unable to access the uploaded file. Please check if the file is publicly accessible and try uploading again.',
        requestId,
        hint: 'This might be a Supabase storage permission issue.'
      });
    }

    // Handle PDF parsing errors
    if (error.message.includes('PDF processing not available')) {
      return res.status(500).json({
        error: 'PDF processing is temporarily unavailable. Please try uploading a Word document or text file.',
        requestId
      });
    }

    // Handle document processing errors
    if (error.message.includes('Word document processing not available')) {
      return res.status(500).json({
        error: 'Word document processing is temporarily unavailable. Please try uploading a PDF or text file.',
        requestId
      });
    }

    // Surface Groq API error details if present (e.g. decommissioned model, bad request)
    const groqDetail = error.response?.data?.error?.message || error.response?.data?.error || '';
    const groqCode = error.response?.data?.error?.code || '';
    if (groqDetail) {
      return res.status(500).json({
        error: `AI provider error: ${groqDetail}${groqCode ? ' (' + groqCode + ')' : ''}`,
        requestId,
        raw: error.response?.data
      });
    }

    return res.status(500).json({
      error: error.message || 'An unexpected error occurred.',
      requestId,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
