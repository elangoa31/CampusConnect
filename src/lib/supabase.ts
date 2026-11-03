import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  if (!rawUrl || !rawAnonKey) return false;
  const isUrlValid = rawUrl.startsWith('http') && !rawUrl.includes('your-project.supabase.co');
  const isKeyValid = rawAnonKey.length > 20 && !rawAnonKey.includes('your-anon-key');
  return isUrlValid && isKeyValid;
};

// Safe fallback URL and key to prevent runtime instantiation crashes when credentials are not yet set
const supabaseUrl = isSupabaseConfigured()
  ? rawUrl
  : 'https://placeholder.supabase.co';

const supabaseAnonKey = isSupabaseConfigured()
  ? rawAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
