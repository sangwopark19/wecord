import { supabaseBrowser } from './supabase-browser';

// Re-export browser client as supabaseAdmin for dashboard pages
// All dashboard pages are client components, so they need the browser client
export const supabaseAdmin = supabaseBrowser;
