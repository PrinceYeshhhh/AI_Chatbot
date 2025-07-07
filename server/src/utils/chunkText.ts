import { v4 as uuidv4 } from 'uuid';

// Try to dynamically import gpt-3-encoder for token estimation
let encoder: any = null;
(async () => {
  try {
    // @ts-ignore: gpt-3-encoder is an optional dependency
    encoder = await import('gpt-3-encoder');
  } catch (e) {
    encoder = null;
  }
})();

function estimateTokens(text: string): number {
  if (encoder && encoder.encode) {
    return encoder.encode(text).length;
  }
  return text ? text.split(/\s+/).length : 0;
}

interface ChunkMetadata {
  user_id: string;
  file_name: string;
  file_type: string;
  chunk_index: number;
  chunk_text: string;
  token_count: number;
  uploaded_at?: string;
  file_id?: string;
}

interface ChunkTextInput {
  text: string;
  user_id: string;
  file_name: string;
  file_type: string;
  uploaded_at?: string;
  file_id?: string;
  chunk_size?: number; // tokens per chunk
  chunk_overlap?: number; // tokens overlap
}

export function chunkText({
  text,
  user_id,
  file_name,
  file_type,
  uploaded_at,
  file_id,
  chunk_size = 250,
  chunk_overlap = 20
}: ChunkTextInput): ChunkMetadata[] {
  // Split text into sentences (simple regex, can be improved)
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [];
  const chunks: ChunkMetadata[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;
  let i = 0;

  while (i < sentences.length) {
    const sentence = sentences[i] || '';
    const sentenceTokens = estimateTokens(sentence);
    if (currentTokens + sentenceTokens > chunk_size && currentTokens > 0) {
      // Finalize current chunk
      const chunkText = (currentChunk.join(' ') || '').trim();
      const tokenCount = estimateTokens(chunkText);
      if (tokenCount >= 20) { // Avoid too-small chunks
        const chunk: ChunkMetadata = {
          user_id: user_id || '',
          file_name: file_name || '',
          file_type: file_type || '',
          chunk_index: chunkIndex++,
          chunk_text: chunkText,
          token_count: tokenCount
        };
        if (typeof uploaded_at === 'string') chunk.uploaded_at = uploaded_at;
        if (typeof file_id === 'string') chunk.file_id = file_id;
        chunks.push(chunk);
      }
      // Overlap: keep last chunk_overlap tokens
      let overlapTokens = 0;
      let overlapSentences: string[] = [];
      for (let j = currentChunk.length - 1; j >= 0 && overlapTokens < chunk_overlap; j--) {
        overlapSentences.unshift(currentChunk[j]);
        overlapTokens += estimateTokens(currentChunk[j]);
      }
      currentChunk = [...overlapSentences];
      currentTokens = overlapTokens;
    }
    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
    i++;
  }
  // Add last chunk
  if (currentChunk.length > 0) {
    const chunkText = (currentChunk.join(' ') || '').trim();
    const tokenCount = estimateTokens(chunkText);
    if (tokenCount >= 20) {
      const chunk: ChunkMetadata = {
        user_id: user_id || '',
        file_name: file_name || '',
        file_type: file_type || '',
        chunk_index: chunkIndex++,
        chunk_text: chunkText,
        token_count: tokenCount
      };
      if (typeof uploaded_at === 'string') chunk.uploaded_at = uploaded_at;
      if (typeof file_id === 'string') chunk.file_id = file_id;
      chunks.push(chunk);
    }
  }
  return chunks;
} 