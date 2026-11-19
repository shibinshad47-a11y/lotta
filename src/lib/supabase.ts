import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or custom localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('lotta_custom_supabase_url');
  const customKey = localStorage.getItem('lotta_custom_supabase_key');

  const url = customUrl || envUrl;
  const key = customKey || envKey;

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20 &&
    !key.includes('placeholder')
  );

  return { url, key, isConfigured };
};

export const setCustomSupabaseConfig = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('lotta_custom_supabase_url', url.trim());
    localStorage.setItem('lotta_custom_supabase_key', key.trim());
  } else {
    localStorage.removeItem('lotta_custom_supabase_url');
    localStorage.removeItem('lotta_custom_supabase_key');
  }
};

let clientInstance: SupabaseClient | null = null;
const { url, key, isConfigured } = getSupabaseConfig();

if (isConfigured) {
  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = clientInstance;
export const isLiveSupabase = isConfigured && Boolean(clientInstance);
