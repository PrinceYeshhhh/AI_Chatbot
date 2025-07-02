import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
  return supabase.from('profiles').insert({ id: userId, name, mobile, username });
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return { data, error };
}; 