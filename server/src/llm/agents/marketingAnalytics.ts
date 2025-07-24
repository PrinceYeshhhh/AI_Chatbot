// Marketing analytics tool for Marketing Strategist agent
export function analyzeCampaigns({ impressions, clicks, conversions }: { impressions: number, clicks: number, conversions: number }) {
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks ? (conversions / clicks) * 100 : 0;
  let advice = 'Campaign performance is average.';
  if (ctr < 1) advice = 'Low CTR. Improve ad creatives or targeting.';
  if (conversionRate < 2) advice += ' Low conversion rate. Optimize landing page.';
  if (ctr > 3 && conversionRate > 5) advice = 'Excellent campaign performance!';
  return { ctr, conversionRate, advice };
}

export const marketingAnalyticsSchema = {
  name: 'analyzeCampaigns',
  description: 'Analyzes marketing campaign performance (CTR, conversion rate) and suggests improvements.',
  parameters: {
    type: 'object',
    properties: {
      impressions: { type: 'number' },
      clicks: { type: 'number' },
      conversions: { type: 'number' }
    },
    required: ['impressions', 'clicks', 'conversions']
  }
}; 