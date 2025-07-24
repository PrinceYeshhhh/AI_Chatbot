// Document Summarization Tool
import { Tool, ToolArgs, ToolResult } from '../types';
import { getDocumentTextById, callLLMSummarize, logToolInvocation } from './helpers';

export const summarizeDoc: Tool = {
  name: 'summarizeDoc',
  description: 'Summarizes uploaded documents and extracts key points',
  category: 'document',
  schema: {
    name: 'summarizeDoc',
    description: 'Summarizes uploaded documents and extracts key points',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'ID of the file to summarize'
        },
        userId: {
          type: 'string',
          description: 'ID of the user requesting summary'
        },
        maxLength: {
          type: 'number',
          description: 'Maximum length of summary in words',
          default: 200
        }
      },
      required: ['fileId', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const { fileId, userId, maxLength } = args;
      const docText = await getDocumentTextById(fileId);
      const summary = await callLLMSummarize(docText, maxLength);
      const duration = Date.now() - start;
      await logToolInvocation({ toolName: 'summarizeDoc', userId, duration, input: args, output: summary, success: true });
      return {
        success: true,
        data: {
          summary: summary.text,
          keyPoints: summary.keyPoints,
          wordCount: summary.wordCount
        },
        metadata: {
          executionTime: summary.executionTime,
          tokensUsed: summary.tokensUsed,
          cost: summary.cost
        }
      };
    } catch (error: any) {
      await logToolInvocation({ toolName: 'summarizeDoc', userId: args.userId, duration: Date.now() - start, input: args, output: error.message, success: false });
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during summarization'
      };
    }
  }
}; 