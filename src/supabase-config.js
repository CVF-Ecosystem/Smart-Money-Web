import { SupabaseService } from './sm-supabase.js';

export const SUPABASE_CONFIG_KEY = 'SmartMoney_SupabaseConfig';

// Priority: localStorage (runtime user config) → .env (build-time)
let url = null;
let key = null;

try {
  const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (saved) {
    const config = JSON.parse(saved);
    url = config.url || null;
    key = config.key || null;
  }
} catch (e) {
  // localStorage unavailable (SSR or permissions)
}

if (!url || !key) {
  url = import.meta.env.VITE_SUPABASE_URL || null;
  key = import.meta.env.VITE_SUPABASE_ANON_KEY || null;
}

if (url && key) {
  SupabaseService.initSupabase(url, key);
}
