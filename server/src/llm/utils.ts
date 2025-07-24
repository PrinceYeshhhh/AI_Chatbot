// Utility functions for LLM integration

export function formatPromptWithContext(contextChunks: string[], userQuestion: string): string {
  // TODO: Format prompt for RAG (context + user question)
  return '';
}

export function countTokens(text: string): number {
  // TODO: Implement token counting (approximate for now)
  return text.split(' ').length;
}

export function truncateContext(chunks: string[], maxTokens: number): string[] {
  // TODO: Truncate context to fit within maxTokens
  return chunks;
}

/**
 * Formats the prompt for the LLM, allowing easy brand/personality modification.
 * @param userMessage - The user's message
 * @param brandPersona - Optional brand/personality instructions
 * @returns Formatted prompt array for LLM
 */
export function buildLLMPrompt(userMessage: string, brandPersona?: string) {
  const systemPrompt = brandPersona
    ? { role: 'system', content: brandPersona }
    : { role: 'system', content: 'You are a helpful AI assistant.' };
  return [systemPrompt, { role: 'user', content: userMessage }];
} 