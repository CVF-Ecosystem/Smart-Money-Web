
'use strict';

/* ============================================================================
 *  Supabase Configuration
 *  Copy this file to 'supabase-config.js' and fill in your credentials
 * ============================================================================ */

const SUPABASE_CONFIG = {
  // Your Supabase project URL (from Supabase Dashboard > Settings > API)
  url: 'https://your-project-id.supabase.co',
  
  // Your Supabase anon/public key (from Supabase Dashboard > Settings > API)
  anonKey: 'your-anon-key-here',
  
  // Enable/disable Supabase (set to false to use MOCK_DATA)
  enabled: true,
};

// Initialize Supabase when config is loaded
if (SUPABASE_CONFIG.enabled && window.SupabaseService) {
  window.SupabaseService.initSupabase(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
