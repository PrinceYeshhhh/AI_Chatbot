import { supabase } from '../../lib/supabase';

// Embeddings memory module
export async function getEmbeddingsMemory(sessionId: string): Promise<any[]> {
  // Retrieve embeddings memory from Supabase
  const { data, error } = await supabase
    .from('chat_context')
    .select('context')
    .eq('session_id', sessionId)
    .single();
  if (error) {
    throw new Error('Failed to fetch embeddings memory: ' + error.message);
  }
  // Assume context.embeddings holds the embeddings array
  return data?.context?.embeddings || [];
}

export async function saveEmbeddingsMemory(sessionId: string, userId: string, embeddings: any[]): Promise<void> {
  // Upsert embeddings memory in Supabase (store in context.embeddings)
  // Fetch existing context
  const { data, error: fetchError } = await supabase
    .from('chat_context')
    .select('context')
    .eq('session_id', sessionId)
    .single();
  let context = data?.context || {};
  context.embeddings = embeddings;
  const { error } = await supabase
    .from('chat_context')
    .upsert({ session_id: sessionId, user_id: userId, context, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });
  if (error) {
    throw new Error('Failed to save embeddings memory: ' + error.message);
  }
} 