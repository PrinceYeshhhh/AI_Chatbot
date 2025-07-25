// import { v4 as uuidv4 } from 'uuid';

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
  modality?: 'text' | 'audio' | 'image' | 'table' | 'video';
}

export function chunkText({
  text,
  user_id,
  file_name,
  file_type,
  uploaded_at,
  file_id,
  chunk_size = 250,
  chunk_overlap = 20,
  modality = 'text'
}: ChunkTextInput): ChunkMetadata[] {
  let units: string[] = [];
  if (modality === 'audio') {
    // For audio transcripts, split by utterance or sentence
    units = text.split(/(?<=[.!?\n])\s+/);
  } else if (modality === 'image') {
    // For OCR/image, split by lines or blocks
    units = text.split(/\n+/);
  } else if (modality === 'table') {
    // For tables, split by rows
    units = text.split(/\n+/);
  } else {
    // Default: text, split by sentences
    units = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [];
  }
  const chunks: ChunkMetadata[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;
  let i = 0;

  while (i < units.length) {
    const unit = units[i] || '';
    const unitTokens = estimateTokens(unit);
    if (currentTokens + unitTokens > chunk_size && currentTokens > 0) {
      // Finalize current chunk
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
      // Overlap: keep last chunk_overlap tokens
      let overlapTokens = 0;
      let overlapUnits: string[] = [];
      for (let j = currentChunk.length - 1; j >= 0 && overlapTokens < chunk_overlap; j--) {
        const chunkItem = currentChunk[j];
        if (chunkItem) {
          overlapUnits.unshift(chunkItem);
          overlapTokens += estimateTokens(chunkItem);
        }
      }
      currentChunk = [...overlapUnits];
      currentTokens = overlapTokens;
    }
    currentChunk.push(unit);
    currentTokens += unitTokens;
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

// Semantic chunking by paragraphs or headers (for DOCX/PDF)
export function chunkByParagraphsOrHeaders(text: string, maxTokens = 1000): string[] {
  // Split by headers (lines with all caps or ending with colon) or double line breaks
  const blocks = text.split(/(\n{2,}|\r\n{2,}|^.*: *$|^[A-Z][A-Z\s\d\-]+$)/m).map(b => b.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;
  for (const block of blocks) {
    const blockTokens = block.split(/\s+/).length;
    if (currentTokens + blockTokens > maxTokens && current) {
      chunks.push(current.trim());
      current = '';
      currentTokens = 0;
    }
    current += (current ? '\n\n' : '') + block;
    currentTokens += blockTokens;
  }
  if (current) chunks.push(current.trim());
  return chunks;
} 