// Product analytics tool for Product Manager agent
export function analyzeFeedback({ features }: { features: { name: string, score: number }[] }) {
  const sorted = [...features].sort((a, b) => b.score - a.score);
  const topFeatures = sorted.slice(0, 3).map(f => f.name);
  return { topFeatures, advice: `Prioritize: ${topFeatures.join(', ')}` };
}

export const productAnalyticsSchema = {
  name: 'analyzeFeedback',
  description: 'Analyzes product feedback scores and suggests feature priorities.',
  parameters: {
    type: 'object',
    properties: {
      features: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            score: { type: 'number' }
          },
          required: ['name', 'score']
        }
      }
    },
    required: ['features']
  }
}; 