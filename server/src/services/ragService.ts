import { semanticSearch } from './vectorSearchService';
import fetch from 'node-fetch';
import { saveChatToHistory } from './chatHistoryService';

const openaiApiKey = process.env['OPENAI_API_KEY'];

if (!openaiApiKey) {
  throw new Error('Missing OpenAI API key');
}

async function getTopRelevantChunks(queryText: string, userId: string, topK = 5) {
  return await semanticSearch({ queryText, userId, matchCount: topK });
}

export async function generateRAGResponse(queryText: string, userId: string, topK = 5): Promise<string> {
  // 1. 🔍 Get top-k relevant chunks
  const relevantChunks = await getTopRelevantChunks(queryText, userId, topK);

  // 2. 📚 Format the retrieved chunks into a knowledge context
  const context = (relevantChunks || [])
    .map((chunk: any, i: number) => `Document ${i + 1}:
${(chunk.chunk_text || '').trim()}`)
    .join("\n\n");

  // 3. 🧠 Construct the GPT system and user prompt
  const systemPrompt =
    'You are a helpful AI assistant. Use the following context from uploaded files to answer accurately. Do not make up answers.';
  const userPrompt = `User Query: "${queryText}"

Context:
${context}

Answer:`;

  // 4. 🤖 Send to GPT for completion
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-0613',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 700
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }
  const data = await response.json() as any;
  const aiResponse = data.choices?.[0]?.message?.content || '';

  // 5. 💾 Save chat to history before returning
  await saveChatToHistory({
    userId,
    queryText,
    matchedChunks: relevantChunks,
    aiResponse
  });

  return aiResponse;
} 