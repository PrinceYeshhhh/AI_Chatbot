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

async function fetchEmbeddingsBatch(
  inputTexts: string[],
  model: string,
  apiKey: string,
  maxRetries = 3
): Promise<number[][]> {
  let attempt = 0;
  let lastError: any = null;
  while (attempt < maxRetries) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: inputTexts,
          model
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }
      const data = await response.json() as { data: { embedding: number[] }[] };
      return (data.data || []).map((d: any) => d.embedding || []);
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
  model = 'text-embedding-3-small',
  batchSize = 50
): Promise<EmbeddingWithMetadata[]> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const results: EmbeddingWithMetadata[] = [];
  let batchNum = 0;
  for (const batch of chunkIntoBatches(chunks, batchSize)) {
    const inputTexts = batch.map(item => item.chunk);
    const t0 = Date.now();
    const embeddings = await fetchEmbeddingsBatch(inputTexts, model, apiKey);
    const t1 = Date.now();
    for (let i = 0; i < batch.length; i++) {
      const emb = embeddings[i] || [];
      if (!Array.isArray(emb) || emb.length === 0) {
        console.error(`No embedding returned for batch ${batchNum}, item ${i}`);
        continue;
      }
      results.push({
        embedding: emb,
        metadata: batch[i]?.metadata ?? {}
      });
      console.log(`Embedding batch ${batchNum}, item ${i}: length=${emb.length}`);
    }
    console.log(`Batch ${batchNum} processed in ${t1 - t0}ms`);
    batchNum++;
  }
  return results;
} 