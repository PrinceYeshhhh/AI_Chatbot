// Data insights tool for Analyst agent
export function analyzeTrends({ data, type }: { data: number[], type: 'growth' | 'decline' | 'outlier' }) {
  let result = {};
  if (type === 'growth') {
    const growth = ((data[data.length - 1] - data[0]) / data[0]) * 100;
    result = { growth, trend: growth > 0 ? 'upward' : 'downward' };
  } else if (type === 'decline') {
    const decline = ((data[0] - data[data.length - 1]) / data[0]) * 100;
    result = { decline, trend: decline > 0 ? 'downward' : 'upward' };
  } else if (type === 'outlier') {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const outliers = data.filter(x => Math.abs(x - mean) > 2 * Math.sqrt(mean));
    result = { outliers };
  }
  return result;
}

export const dataInsightsSchema = {
  name: 'analyzeTrends',
  description: 'Performs trend and outlier analysis on business data.',
  parameters: {
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'number' } },
      type: { type: 'string', enum: ['growth', 'decline', 'outlier'] }
    },
    required: ['data', 'type']
  }
}; 