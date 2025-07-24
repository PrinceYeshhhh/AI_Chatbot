// Stub weather tool for LLM tool-calling
export async function getWeather({ location }: { location: string }) {
  // In production, integrate with a real weather API here
  return {
    location,
    temperature: '22°C',
    condition: 'Sunny',
    source: 'Stubbed weather tool'
  };
} 