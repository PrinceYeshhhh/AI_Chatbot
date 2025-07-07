import { supabase } from '../../lib/supabase';

// User memory module
export async function getUserMemory(userId: string): Promise<any> {
  // Retrieve user memory from Supabase
  const { data, error } = await supabase
    .from('user_memory')
    .select('memory')
    .eq('user_id', userId)
    .single();
  if (error) {
    throw new Error('Failed to fetch user memory: ' + error.message);
  }
  return data?.memory || {};
}

export async function saveUserMemory(userId: string, memory: any): Promise<void> {
  // Upsert user memory in Supabase
  const { error } = await supabase
    .from('user_memory')
    .upsert({ user_id: userId, memory, updated_at: new Date().toISOString() }, { onConflict: ['user_id'] });
  if (error) {
    throw new Error('Failed to save user memory: ' + error.message);
  }
} 