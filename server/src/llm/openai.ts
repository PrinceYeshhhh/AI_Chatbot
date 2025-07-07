// OpenAI integration for chat and embeddings
// Handles chat completions (streaming) and embeddings
// Loads API key from process.env.OPENAI_API_KEY

import fetch from 'node-fetch';
import { createParser, EventSourceParser, ParsedEvent } from 'eventsource-parser';
import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
const OPENAI_API_URL = 'https://api.openai.com/v1';

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export async function callOpenAIChat(model: string, messages: any[], options: any = {}) {
  const {
    stream = true,
    temperature = 0.7,
    max_tokens = 1024,
    onToken,
    signal
  } = options;

  const body = {
    model,
    messages,
    stream,
    temperature,
    max_tokens
  };

  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  if (stream) {
    // Streaming response using eventsource-parser
    const parser: EventSourceParser = createParser((event: ParsedEvent) => {
      if (event.type === 'event' && event.data) {
        if (event.data === '[DONE]') return;
        try {
          const json: any = JSON.parse(event.data);
          const content = json.choices?.[0]?.delta?.content;
          if (content && onToken) onToken(content);
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    for await (const chunk of response.body as any) {
      parser.feed(chunk.toString());
    }
    return { role: 'assistant', content: null, streamed: true };
  } else {
    const json: any = await response.json();
    return {
      role: 'assistant',
      content: json.choices?.[0]?.message?.content || '',
      streamed: false
    };
  }
}

export async function callOpenAIEmbeddings(textChunks: string[]) {
  const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: textChunks,
      model: 'text-embedding-3-small'
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embeddings API error: ${error}`);
  }
  const json: any = await response.json();
  return json.data.map((item: any) => item.embedding);
} 