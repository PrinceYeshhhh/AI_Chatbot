import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY'] || process.env['SUPABASE_SECRET_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function saveChatToHistory({ userId, queryText, matchedChunks, aiResponse }: {
  userId: string;
  queryText: string;
  matchedChunks: any[];
  aiResponse: string;
}) {
  const { error } = await supabase.from('chat_history').insert([
    {
      user_id: userId,
      query_text: queryText,
      matched_chunks: matchedChunks,
      ai_response: aiResponse,
    },
  ]);
  if (error) throw new Error('Failed to save chat history: ' + error.message);
}

export async function getChatHistoryForUser(userId: string) {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Failed to fetch chat history: ' + error.message);
  return data;
}

export async function clearChatHistoryForUser(userId: string) {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error('Failed to clear chat history: ' + error.message);
} 