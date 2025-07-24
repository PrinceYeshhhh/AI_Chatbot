// HR analytics tool for HR Manager agent
export function analyzeHRData({ satisfactionScores, turnoverRates }: { satisfactionScores: number[], turnoverRates: number[] }) {
  const avgSatisfaction = satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length;
  const avgTurnover = turnoverRates.reduce((a, b) => a + b, 0) / turnoverRates.length;
  let advice = 'Satisfaction and turnover are within normal range.';
  if (avgSatisfaction < 6) advice = 'Employee satisfaction is low. Consider engagement programs.';
  if (avgTurnover > 0.2) advice += ' High turnover detected. Review retention strategies.';
  return { avgSatisfaction, avgTurnover, advice };
}

export const hrAnalyticsSchema = {
  name: 'analyzeHRData',
  description: 'Analyzes employee satisfaction and turnover rates, suggests HR strategies.',
  parameters: {
    type: 'object',
    properties: {
      satisfactionScores: { type: 'array', items: { type: 'number' } },
      turnoverRates: { type: 'array', items: { type: 'number' } }
    },
    required: ['satisfactionScores', 'turnoverRates']
  }
}; 