import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Live Supabase configuration defaults
const DEFAULT_URL = 'https://qdbuxofhmfkzbdudjsse.supabase.co';
const DEFAULT_KEY = 'sb_publishable_Kumn4EUultC0x8htUFpXQg_tcgPbRXT';

// Read from Next.js environment variables or localStorage or defaults
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('upsc_supabase_url') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('upsc_supabase_key') || '' : '';

export const supabaseUrl = (storedUrl || envUrl || DEFAULT_URL).trim();
export const supabaseAnonKey = (storedKey || envKey || DEFAULT_KEY).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Normalizes user identifier: if user enters a username (e.g. "parth"),
 * converts to a standard virtual domain (e.g. "parth@upsc.local") for Supabase Auth compatibility.
 */
export function normalizeUserIdentifier(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (!trimmed.includes('@')) {
    // Treat as username -> map to internal authentication domain
    const cleanUsername = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    return `${cleanUsername}@upsc.local`;
  }
  return trimmed.toLowerCase();
}

/**
 * Extracts a friendly display username from an email or internal virtual domain
 */
export function getDisplayUsername(emailOrVirtual: string): string {
  if (!emailOrVirtual) return 'Aspirant';
  const prefix = emailOrVirtual.split('@')[0];
  return prefix;
}

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
