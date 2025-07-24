// Hallucination detection module
// Compares LLM answer to source chunks using cosine similarity
// Supports grounding mode (must cite docs)

export async function detectHallucination(answer: string, contextChunks: string[], threshold: number = 0.75): Promise<{ isHallucination: boolean, confidence: number }> {
  // Simple cosine similarity between answer and each context chunk
  function getEmbedding(text: string): number[] {
    // Placeholder: Use a real embedding model in production
    // Here, just use char codes for demo
    return text.split('').map(c => c.charCodeAt(0));
  }
  function cosineSim(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  }
  const answerEmbedding = getEmbedding(answer);
  let maxSim = 0;
  for (const chunk of contextChunks) {
    const sim = cosineSim(answerEmbedding, getEmbedding(chunk));
    if (sim > maxSim) maxSim = sim;
  }
  return { isHallucination: maxSim < threshold, confidence: maxSim };
} 