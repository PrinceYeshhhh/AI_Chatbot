const userConfigs: Record<string, any> = {};

const DEFAULT_CONFIG = {
  llmProvider: 'googleai',
  streaming: true,
  systemPrompt: 'You are a helpful assistant.',
  maxTokens: 1024,
  temperature: 0.7,
  memoryMode: 'auto',
};

// Default LLM provider is now Google AI Studio (Gemini)
export async function getUserConfigFromStore(userId: string) {
  return userConfigs[userId] || { ...DEFAULT_CONFIG };
}

export async function updateUserConfigInStore(userId: string, config: any) {
  userConfigs[userId] = { ...DEFAULT_CONFIG, ...config };
  return userConfigs[userId];
} 