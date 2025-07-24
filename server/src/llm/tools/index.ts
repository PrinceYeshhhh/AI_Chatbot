// Tool plugins index
export * from './summarizer';
export * from './extractor';
export * from './visualizer';
export * from './translator';

// Function router for LLM function calling
import { getUserFiles } from './getUserFiles';
import { summarizeFile } from './summarizeFile';
import { searchMemory } from './searchMemory';
import { calculateFinancials } from '../agents/financialCalculator';
import { analyzeHRData } from '../agents/hrAnalytics';
import { analyzeTrends } from '../agents/dataInsights';
import { extractLegalClauses } from '../agents/legalExtractor';
import { NeonDatabaseService } from '../../services/neonDatabaseService';
import { analyzeCampaigns } from '../agents/marketingAnalytics';
import { analyzeFeedback } from '../agents/productAnalytics';
import { getWeather } from './weather';

const dbService = new NeonDatabaseService();

// Log tool usage to tool_usage_logs table
async function logToolUsageToDatabase({
  user_id,
  chat_id,
  message_id,
  function_name,
  arguments: args,
  response,
  tool_call_id
}: {
  user_id: string;
  chat_id?: string;
  message_id?: string;
  function_name: string;
  arguments: any;
  response: any;
  tool_call_id?: string;
}) {
  try {
    const query = `
      INSERT INTO tool_usage_logs (user_id, chat_id, message_id, function_name, arguments, response, tool_call_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP);
    `;
    
    await dbService.query(query, [
      user_id,
      chat_id || null,
      message_id || null,
      function_name,
      JSON.stringify(args),
      JSON.stringify(response),
      tool_call_id || null
    ]);
  } catch (error) {
    console.error('Failed to log tool usage:', error);
  }
}

function withLogging(fn: Function, toolName: string) {
  return async function(input: any, context: any) {
    const output = await fn(input);
    if (context && context.userId) {
      await logToolUsageToDatabase({
        user_id: context.userId,
        chat_id: context.chatId,
        message_id: context.messageId,
        function_name: toolName,
        arguments: input,
        response: output,
        tool_call_id: context.toolCallId
      });
    }
    return output;
  };
}

export const llmToolRouter: Record<string, Function> = {
  getUserFiles,
  summarizeFile,
  searchMemory,
  calculateFinancials: withLogging(calculateFinancials, 'calculateFinancials'),
  analyzeHRData: withLogging(analyzeHRData, 'analyzeHRData'),
  analyzeTrends: withLogging(analyzeTrends, 'analyzeTrends'),
  extractLegalClauses: withLogging(extractLegalClauses, 'extractLegalClauses'),
  analyzeCampaigns: withLogging(analyzeCampaigns, 'analyzeCampaigns'),
  analyzeFeedback: withLogging(analyzeFeedback, 'analyzeFeedback'),
  getWeather, // Register the weather tool
};

// Function schemas for LLM function calling
export const llmToolSchemas = [
  {
    name: 'getUserFiles',
    description: 'Fetches a list of files uploaded by a user.',
    parameters: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'ID of the user'
        }
      },
      required: ['user_id']
    }
  },
  {
    name: 'summarizeFile',
    description: 'Summarizes the content of a file.',
    parameters: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'ID of the file to summarize'
        }
      },
      required: ['file_id']
    }
  },
  {
    name: 'searchMemory',
    description: 'Searches user memory for relevant information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        user_id: {
          type: 'string',
          description: 'ID of the user'
        }
      },
      required: ['query', 'user_id']
    }
  },
  {
    name: 'getWeather',
    description: 'Fetches the current weather for a given location.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The location to fetch weather for (city, country, etc.)'
        }
      },
      required: ['location']
    }
  },
]; 