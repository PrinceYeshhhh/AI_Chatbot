import fetch from 'node-fetch';

export interface ChunkWithMetadata {
  chunk: string;
  metadata: Record<string, any>;
}

export interface EmbeddingWithMetadata {
  embedding: number[];
  metadata: Record<string, any>;
}

function chunkIntoBatches<T>(arr: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    batches.push(arr.slice(i, i + batchSize));
  }
  return batches;
}

function isValidChunk(text: string): boolean {
  if (!text) return false;
  // Remove whitespace and check if anything remains
  const cleaned = text.replace(/\s+/g, '');
  // If only symbols, skip
  if (!/[\w\p{L}\p{N}]/u.test(cleaned)) return false;
  return cleaned.length > 0;
}

async function fetchLocalEmbeddingsBatch(
  inputTexts: string[],
  maxRetries = 2 // One retry on failure
): Promise<number[][]> {
  let attempt = 0;
  let lastError: any = null;
  while (attempt < maxRetries) {
    try {
      const response = await fetch('http://localhost:8000/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: inputTexts })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Local embedding error: ${response.status} ${error}`);
      }
      const data = await response.json() as { embeddings: number[][] };
      return (data.embeddings || []);
    } catch (err) {
      lastError = err;
      const backoff = 1000 * Math.pow(2, attempt);
      await new Promise(res => setTimeout(res, backoff));
      attempt++;
    }
  }
  throw lastError;
}

export async function generateEmbeddings(
  chunks: ChunkWithMetadata[],
  batchSize = 50
): Promise<EmbeddingWithMetadata[]> {
  const results: EmbeddingWithMetadata[] = [];
  let batchNum = 0;
  // Filter out empty or symbol-only chunks
  const validChunks = chunks.filter(item => isValidChunk(item.chunk));
  for (const batch of chunkIntoBatches(validChunks, batchSize)) {
    const inputTexts = batch.map(item => item.chunk);
    const t0 = Date.now();
    let embeddings: number[][] = [];
    try {
      embeddings = await fetchLocalEmbeddingsBatch(inputTexts, 2);
    } catch (err) {
      // Log all failed chunk indices and fileIds in this batch
      batch.forEach(item => {
        const idx = item.metadata?.['chunkIndex'];
        const fileId = item.metadata?.['fileId'];
        console.error(`Embedding failed for chunkIndex=${idx}, fileId=${fileId}:`, err);
      });
      continue;
    }
    const t1 = Date.now();
    for (let i = 0; i < batch.length; i++) {
      const emb = embeddings[i] || [];
      if (!Array.isArray(emb) || emb.length === 0) {
        const idx = batch[i]?.metadata?.['chunkIndex'];
        const fileId = batch[i]?.metadata?.['fileId'];
        console.error(`No embedding returned for batch ${batchNum}, item ${i} (chunkIndex=${idx}, fileId=${fileId})`);
        continue;
      }
      results.push({
        embedding: emb,
        metadata: batch[i]?.metadata ?? {}
      });
      // Optionally log embedding length
      // console.log(`Embedding batch ${batchNum}, item ${i}: length=${emb.length}`);
    }
    // console.log(`Batch ${batchNum} processed in ${t1 - t0}ms`);
    batchNum++;
  }
  return results;
} 