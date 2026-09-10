module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: { gemini: geminiKey ? 'configured' : 'missing', groq: groqKey ? 'configured' : 'missing', supabase: 'frontend-managed' },
      version: '2.0.0',
      deployment: 'local',
    };
    return res.status(200).json(healthStatus);
  } catch (error) {
    return res.status(500).json({ status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() });
  }
};