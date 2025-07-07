import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY'] || process.env['SUPABASE_SECRET_KEY'];
const openaiApiKey = process.env['OPENAI_API_KEY'];

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  throw new Error('Missing Supabase or OpenAI environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getQueryEmbedding(queryText: string, model = 'text-embedding-3-small') {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: queryText,
      model
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }
  const data = await response.json() as { data: { embedding: number[] }[] };
  if (!data || !data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('No embedding returned from OpenAI API');
  }
  return data.data[0].embedding;
}

export async function semanticSearch({
  queryText,
  userId,
  matchThreshold = 0.75,
  matchCount = 5
}: {
  queryText: string;
  userId: string;
  matchThreshold?: number;
  matchCount?: number;
}) {
  const queryEmbedding = await getQueryEmbedding(queryText);
  const { data, error } = await supabase.rpc('match_vector_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    user_id: userId
  });
  if (error) {
    console.error('❌ Error in vector search:', error);
    throw new Error(error.message);
  }
  console.log(`Semantic search returned ${data?.length || 0} results.`);
  return data;
} 