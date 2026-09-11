import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  storage: {
    cacheMaxAge: 0,
  },
});

export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'uploads';
export const getSignedUrl = async (filePath: string, expiresInSeconds = 3600) => {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(filePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
};
