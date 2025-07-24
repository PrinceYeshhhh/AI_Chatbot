// LLM config for reasoning strategies

export const llmConfig = {
  default: 'single-shot',
  strategies: ['single-shot', 'chain-of-thought', 'multi-agent', 'reflexion'],
  // Add more strategies as needed
};

export function getCurrentLLMModel() {
  return process.env['GROQ_MODEL'] || 'llama3-70b-8192';
} 