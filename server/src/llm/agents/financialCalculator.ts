// Financial calculator tool for CA agent
export function calculateFinancials({ type, values }: { type: string, values: number[] }) {
  switch (type) {
    case 'tax':
      // Simple tax calculation (e.g., 30% of income)
      return { tax: values[0] * 0.3 };
    case 'profit':
      return { profit: values[0] - values[1] };
    case 'roi':
      return { roi: ((values[1] - values[0]) / values[0]) * 100 };
    default:
      return { error: 'Unknown calculation type' };
  }
}

export const financialCalculatorSchema = {
  name: 'calculateFinancials',
  description: 'Performs financial calculations (tax, profit, ROI, etc.)',
  parameters: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['tax', 'profit', 'roi'] },
      values: { type: 'array', items: { type: 'number' } }
    },
    required: ['type', 'values']
  }
}; 