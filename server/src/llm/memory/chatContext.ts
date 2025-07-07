import { supabase } from '../../lib/supabase';

// Chat context memory module
export async function getChatContext(sessionId: string): Promise<any> {
  // Retrieve chat context from Supabase
  const { data, error } = await supabase
    .from('chat_context')
    .select('context')
    .eq('session_id', sessionId)
    .single();
  if (error) {
    throw new Error('Failed to fetch chat context: ' + error.message);
  }
  return data?.context || {};
}

export async function saveChatContext(sessionId: string, userId: string, context: any): Promise<void> {
  // Upsert chat context in Supabase
  const { error } = await supabase
    .from('chat_context')
    .upsert({ session_id: sessionId, user_id: userId, context, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });
  if (error) {
    throw new Error('Failed to save chat context: ' + error.message);
  }
} 