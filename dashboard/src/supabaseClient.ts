import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const demoMode = process.env.REACT_APP_DEMO_MODE === '1';

if (!demoMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

// Demo builds (GitHub Pages) use an in-browser mock backend and a fake signed-in session.
export const supabase: SupabaseClient = demoMode
  ? require('./demo/mockBackend').demoSupabase
  : createClient(supabaseUrl!, supabaseAnonKey!);
