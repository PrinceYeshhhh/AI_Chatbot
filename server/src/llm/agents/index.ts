// Multi-agent orchestration index
// Prepare for LangGraph, CrewAI, etc.

import { calculateFinancials, financialCalculatorSchema } from './financialCalculator';
import { analyzeHRData, hrAnalyticsSchema } from './hrAnalytics';
import { analyzeTrends, dataInsightsSchema } from './dataInsights';
import { extractLegalClauses, legalExtractorSchema } from './legalExtractor';
import { marketingAnalyticsSchema, analyzeCampaigns } from './marketingAnalytics';
import { productAnalyticsSchema, analyzeFeedback } from './productAnalytics';

export interface Agent {
  name: string;
  description: string;
  system_prompt: string;
  tools_allowed: string[];
  memory_scope: string;
  functions?: any[];
}

export const AGENTS: Agent[] = [
  {
    name: 'Chartered Accountant',
    description: 'Expert in financial reports, tax, and accounting.',
    system_prompt: 'You are a senior Chartered Accountant. Interpret uploaded financial reports and provide tax-saving advice.',
    tools_allowed: ['rag', 'memory', 'math', 'file_context'],
    memory_scope: 'user_id+file_id+role',
    functions: [financialCalculatorSchema]
  },
  {
    name: 'Analyst',
    description: 'Business, data, and finance analyst. Strategic insights.',
    system_prompt: 'You are a strategic growth analyst. Identify expansion opportunities using uploaded product reports.',
    tools_allowed: ['rag', 'memory', 'math', 'file_context'],
    memory_scope: 'user_id+file_id+role',
    functions: [dataInsightsSchema]
  },
  {
    name: 'HR Manager',
    description: 'HR expert. Employee satisfaction, hiring, and retention.',
    system_prompt: 'You are a top-tier HR Manager. Analyze employee satisfaction data and suggest hiring strategies.',
    tools_allowed: ['rag', 'memory', 'file_context'],
    memory_scope: 'user_id+file_id+role',
    functions: [hrAnalyticsSchema]
  },
  {
    name: 'Lawyer',
    description: 'Legal advisor. Contract review and compliance.',
    system_prompt: 'You are a legal advisor. Review contracts and flag compliance risks.',
    tools_allowed: ['rag', 'memory', 'file_context'],
    memory_scope: 'user_id+file_id+role',
    functions: [legalExtractorSchema]
  },
  {
    name: 'General Chat',
    description: 'Default assistant for general queries.',
    system_prompt: 'You are a helpful AI assistant.',
    tools_allowed: ['rag', 'memory', 'file_context'],
    memory_scope: 'user_id+file_id',
    functions: []
  },
  {
    name: 'Marketing Strategist',
    description: 'Expert in marketing campaigns, brand strategy, and customer engagement.',
    system_prompt: 'You are a senior Marketing Strategist. Analyze campaign data and suggest high-impact marketing strategies.',
    tools_allowed: ['rag', 'memory', 'file_context'],
    memory_scope: 'user_id+file_id+role',
    functions: [marketingAnalyticsSchema]
  },
  {
    name: 'Product Manager',
    description: 'Expert in product development, user feedback, and roadmap planning.',
    system_prompt: 'You are a Product Manager. Review product feedback and prioritize features for the roadmap.',
    tools_allowed: ['rag', 'memory', 'file_context'],
    memory_scope: 'user_id+file_id+role',
    functions: [productAnalyticsSchema]
  }
];

export function getAgentByName(name: string): Agent {
  return AGENTS.find(a => a.name === name) || AGENTS[0];
}

export function orchestrateAgents(task: string, context: any): any {
  // TODO: Implement multi-agent workflow
  return null;
} 