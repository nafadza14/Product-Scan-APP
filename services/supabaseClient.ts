import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://rebsjmkxhdxcqtkrzgow.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qoRubpwQ0SE172hLPwCMmA_EwhK4cRq';

// Validation check for debugging
if (typeof window !== 'undefined' && !SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.warn(
    "%c[Supabase Warning] Your API Key does not look like a standard 'anon' key (JWT).", 
    "color: orange; font-weight: bold;"
  );
  console.warn("Please verify you copied the 'anon' public key from Project Settings > API.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);