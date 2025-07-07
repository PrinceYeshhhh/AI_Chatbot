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