import { createClient } from '@supabase/supabase-js';
import { EmbeddingWithMetadata } from '../utils/generateEmbeddings';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY'] || process.env['SUPABASE_SECRET_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function storeChunksInSupabase(embeddedChunks: EmbeddingWithMetadata[]) {
  const inserts = embeddedChunks.map(chunk => ({
    user_id: chunk.metadata['user_id'],
    file_name: chunk.metadata['file_name'],
    chunk_index: chunk.metadata['chunk_index'],
    chunk_text: chunk.metadata['chunk_text'],
    embedding: chunk.embedding,
  }));

  // Log vector size for debug
  if (inserts.length > 0 && inserts[0] && Array.isArray(inserts[0].embedding)) {
    console.log(`Storing ${inserts.length} vectors. Example vector size: ${inserts[0].embedding.length}`);
  }

  const { data, error } = await supabase.from('vector_chunks').insert(inserts);
  if (error) {
    console.error('❌ Failed to store embeddings:', error);
    throw new Error(error.message);
  }
  return data;
} 