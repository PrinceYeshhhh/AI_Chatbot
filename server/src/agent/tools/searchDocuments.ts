// Document Search Tool
import { Tool, ToolArgs, ToolResult } from '../types';
import { searchDocumentsByQuery, logToolInvocation } from './helpers';

export const searchDocuments: Tool = {
  name: 'searchDocuments',
  description: 'Searches through uploaded documents for specific content',
  category: 'document',
  schema: {
    name: 'searchDocuments',
    description: 'Searches through uploaded documents for specific content',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        userId: {
          type: 'string',
          description: 'ID of the user performing search'
        },
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific file IDs to search in (optional)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10
        }
      },
      required: ['query', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const { query, userId, fileIds, maxResults } = args;
      const results = await searchDocumentsByQuery({ query, userId, fileIds, maxResults });
      const duration = Date.now() - start;
      await logToolInvocation({ toolName: 'searchDocuments', userId, duration, input: args, output: results, success: true });
      return {
        success: true,
        data: {
          results,
          totalResults: results.length,
          query
        },
        metadata: {}
      };
    } catch (error: any) {
      await logToolInvocation({ toolName: 'searchDocuments', userId: args.userId, duration: Date.now() - start, input: args, output: error.message, success: false });
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during document search'
      };
    }
  }
}; 