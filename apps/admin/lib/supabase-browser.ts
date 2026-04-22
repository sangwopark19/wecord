import { createClient } from '@supabase/supabase-js';

// Fall back to harmless placeholders during static prerender so `next build`
// can render pages that import this client without real env vars present.
// At runtime in the browser, the real public env vars are substituted by Next.js.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-anon-key';

export const supabaseBrowser = createClient(url, key);
