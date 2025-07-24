// Financial Calculations Tool
import { Tool, ToolArgs, ToolResult } from '../types';

export const calculateFinancials: Tool = {
  name: 'calculateFinancials',
  description: 'Perform financial calculations and analysis',
  category: 'financial',
  agentCompatibility: ['financial-analyst', 'general-assistant'],
  schema: {
    name: 'calculateFinancials',
    description: 'Calculate financial metrics and perform analysis',
    parameters: {
      type: 'object',
      properties: {
        calculationType: {
          type: 'string',
          enum: ['profit', 'roi', 'tax', 'cashflow', 'breakdown'],
          description: 'Type of financial calculation'
        },
        values: {
          type: 'array',
          items: { type: 'number' },
          description: 'Financial values to calculate'
        },
        period: {
          type: 'string',
          enum: ['monthly', 'quarterly', 'yearly'],
          description: 'Time period for calculation'
        }
      },
      required: ['calculationType', 'values']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    try {
      const calculationType = args['calculationType'];
      const values = args['values'];
      const period = args['period'] || 'yearly';
      
      if (!values || !Array.isArray(values) || values.length === 0) {
        return {
          success: false,
          error: 'Invalid financial values provided'
        };
      }

      let result: any = {};
      
      switch (calculationType) {
        case 'profit':
          result = {
            revenue: values[0] || 0,
            costs: values[1] || 0,
            profit: (values[0] || 0) - (values[1] || 0),
            profitMargin: values[0] ? (((values[0] - (values[1] || 0)) / values[0]) * 100).toFixed(2) + '%' : '0%'
          };
          break;
          
        case 'roi':
          const investment = values[0] || 0;
          const returns = values[1] || 0;
          result = {
            investment,
            returns,
            roi: investment > 0 ? (((returns - investment) / investment) * 100).toFixed(2) + '%' : '0%',
            netGain: returns - investment
          };
          break;
          
        case 'tax':
          const income = values[0] || 0;
          const rate = values[1] || 0.25; // Default 25% tax rate
          result = {
            income,
            taxRate: (rate * 100).toFixed(1) + '%',
            taxAmount: income * rate,
            netIncome: income * (1 - rate)
          };
          break;
          
        case 'cashflow':
          const inflows = values.filter((_, i) => i % 2 === 0).reduce((sum, v) => sum + (v || 0), 0);
          const outflows = values.filter((_, i) => i % 2 === 1).reduce((sum, v) => sum + (v || 0), 0);
          result = {
            totalInflows: inflows,
            totalOutflows: outflows,
            netCashflow: inflows - outflows,
            cashflowRatio: outflows > 0 ? (inflows / outflows).toFixed(2) : 'N/A'
          };
          break;
          
        case 'breakdown':
          result = {
            total: values.reduce((sum, v) => sum + (v || 0), 0),
            breakdown: values.map((v, i) => ({ item: `Item ${i + 1}`, amount: v || 0 })),
            average: values.length > 0 ? (values.reduce((sum, v) => sum + (v || 0), 0) / values.length).toFixed(2) : 0
          };
          break;
          
        default:
          return {
            success: false,
            error: `Unknown calculation type: ${calculationType}`
          };
      }

      return {
        success: true,
        data: {
          calculationType,
          period,
          result,
          timestamp: new Date().toISOString()
        },
        metadata: {
          executionTime: 150,
          tokensUsed: 50
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Financial calculation failed'
      };
    }
  }
}; 