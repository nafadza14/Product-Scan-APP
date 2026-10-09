import { createClient } from '@supabase/supabase-js';

// Publishable (client-safe) credentials. Row Level Security on the tables protects user data.
const SUPABASE_URL = 'https://rebsjmkxhdxcqtkrzgow.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qoRubpwQ0SE172hLPwCMmA_EwhK4cRq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
