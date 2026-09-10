/**
 * Pack persistence API — stores generated study packs for shareable links.
 * GET /api/pack/:slug → fetch pack from Supabase
 * POST /api/pack → create new pack entry
 */

const { createClient } = require('@supabase/supabase-js');

let supabase;
function getSupabase() {
  if (!supabase) {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Missing Supabase config for pack API');
    supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return supabase;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url.split('?')[0];
  const slugMatch = url.match(/^\/api\/pack\/([a-zA-Z0-9_-]+)$/);

  if (req.method === 'GET' && slugMatch) {
    const slug = slugMatch[1];
    try {
      const { data, error } = await getSupabase()
        .from('packs')
        .select('pack')
        .eq('slug', slug)
        .single();
      if (error || !data) {
        return res.status(404).json({ error: 'Pack not found' });
      }
      return res.status(200).json(data.pack);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch pack' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content_hash, pack } = req.body;
      if (!pack || !content_hash) {
        return res.status(400).json({ error: 'Missing content_hash or pack' });
      }
      const slug = Math.random().toString(36).slice(2, 15);
      const { data, error } = await getSupabase()
        .from('packs')
        .insert({ slug, content_hash, pack, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() })
        .select()
        .single();
      if (error) {
        return res.status(500).json({ error: 'Failed to save pack' });
      }
      return res.status(201).json({ slug, url: `/pack/${slug}` });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save pack' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
