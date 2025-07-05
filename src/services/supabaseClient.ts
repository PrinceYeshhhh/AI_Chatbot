import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from '../utils/env';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'http://localhost:54321') as string;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'test-anon-key') as string;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set.');
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const insertProfile = async (userId: string, name: string, mobile: string, username: string) => {
  return supabase.from('profiles').insert({ id: userId, name, mobile, username, role: 'user' });
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return { data, error };
}; 