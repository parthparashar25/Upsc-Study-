import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Next.js environment variables or localStorage
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('upsc_supabase_url') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('upsc_supabase_key') || '' : '';

export const supabaseUrl = storedUrl || envUrl;
export const supabaseAnonKey = storedKey || envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

const dummyUrl = 'https://placeholder-project.supabase.co';
const dummyKey = 'placeholder-key-00000000000000000000000000000000';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export function saveCustomSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('upsc_supabase_url', url.trim());
    localStorage.setItem('upsc_supabase_key', key.trim());
    window.location.reload();
  }
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('upsc_supabase_url');
    localStorage.removeItem('upsc_supabase_key');
    window.location.reload();
  }
}
