import { LLMService } from './llmService';
import { saveChatToHistory } from './chatHistoryService';
import { sanitizePromptInput } from './gptService';
import { EmbeddingService } from './embeddingService';

const llmService = new LLMService();
const embeddingService = new EmbeddingService();

async function getTopRelevantChunks(queryText: string, userId: string, topK = 5) {
  // Generate embedding for the query
  const queryEmbedding = await llmService.generateEmbeddings(queryText);
  // Search for similar vectors with strict filtering (only user's, not deleted)
  const relevantChunks = await embeddingService.searchSimilarEmbeddings(userId, queryEmbedding, topK);
  // Log for debugging
  console.info(`[Retriever] userId=${userId}, query='${queryText}', topK=${topK}`);
  relevantChunks.forEach((chunk: any, i: number) => {
    console.info(`[Retriever] Match #${i+1}: file=${chunk.fileId}, chunk_index=${chunk.chunkIndex}, score=${chunk.score}, text='${(chunk.text||'').slice(0,60)}...`);
  });
  // Map to required output format
  return relevantChunks.map((chunk: any) => ({
    chunk_text: chunk.text || '',
    file_name: chunk.fileId || '',
    chunk_index: chunk.chunkIndex,
    score: chunk.score || 0
  }));
}

export async function generateRAGResponse(queryText: string, userId: string, topK = 5): Promise<string> {
  try {
    const safeQuery = sanitizePromptInput(queryText);
    // 1. 🔍 Get top-k relevant chunks
    const relevantChunks = await getTopRelevantChunks(queryText, userId, topK);

    // 2. 📚 Format the retrieved chunks into a knowledge context (enforce 8K token limit)
    let contextChunks: string[] = [];
    let totalTokens = 0;
    const MAX_TOKENS = 8000;
    for (const chunk of relevantChunks) {
      const chunkText = (chunk.chunk_text || '').trim();
      const chunkTokens = chunkText.split(/\s+/).length;
      if (totalTokens + chunkTokens > MAX_TOKENS) break;
      contextChunks.push(chunkText);
      totalTokens += chunkTokens;
    }
    const context = contextChunks.join('\n\n');

    // 3. 🧠 Construct the strict system and user prompt
    const systemPrompt = 'You are a smart assistant that answers questions using the user\'s uploaded files. Only answer from the provided data.';
    const userPrompt = `CONTEXT:\n${context}\n\nUSER QUESTION: ${safeQuery}`;

    // Log prompt for audit/debug (PII redacted)
    console.info(`[LLM PROMPT] RAG: userId=${userId}, prompt=${safeQuery.slice(0, 200)}...`);

    // 4. 🤖 Send to LLM for completion
    const response = await llmService.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.3,
      max_tokens: 700
    });

    const final_answer = response.content || '';

    // 5. 💾 Save chat to history before returning
    await saveChatToHistory({
      userId,
      encryptedQuery: queryText,
      encryptedResponse: final_answer,
      matchedChunks: relevantChunks
    });

    return final_answer;
  } catch (error) {
    console.error('RAG service error:', error);
    throw new Error(`RAG generation failed: ${error}`);
  }
} 