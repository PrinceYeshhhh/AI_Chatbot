// LLM config for reasoning strategies

export const llmConfig = {
  default: 'single-shot',
  strategies: ['single-shot', 'chain-of-thought', 'multi-agent', 'reflexion'],
  // Add more strategies as needed
}; 