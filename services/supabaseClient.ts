import { createClient } from '@supabase/supabase-js';

// Publishable (client-safe) credentials. Row Level Security on the tables protects user data.
const SUPABASE_URL = 'https://rebsjmkxhdxcqtkrzgow.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qoRubpwQ0SE172hLPwCMmA_EwhK4cRq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Keep people signed in across visits: store the session in localStorage and refresh it quietly.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

/** Ask the browser not to evict our storage (session, diary, photos) under pressure. */
export const requestPersistentStorage = async () => {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* not supported */ }
};
