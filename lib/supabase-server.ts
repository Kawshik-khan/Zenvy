import { createClient } from '@supabase/supabase-js';

// This file should ONLY be imported in server-side contexts (e.g. Server Actions, API routes, React Server Components)
if (typeof window !== 'undefined') {
  throw new Error('supabase-server.ts must only be imported on the server side.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Service Role Key is missing from environment variables.');
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
