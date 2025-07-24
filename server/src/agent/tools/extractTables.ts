// Table Extraction Tool
import { Tool, ToolArgs, ToolResult } from '../types';
import { extractTablesFromFile, logToolInvocation } from './helpers';

export const extractTables: Tool = {
  name: 'extractTables',
  description: 'Extracts tables from spreadsheets or PDFs',
  category: 'document',
  schema: {
    name: 'extractTables',
    description: 'Extracts tables from spreadsheets or PDFs',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'ID of the file to extract tables from'
        },
        format: {
          type: 'string',
          description: 'Output format (csv, json, xlsx)',
          enum: ['csv', 'json', 'xlsx'],
          default: 'csv'
        },
        userId: {
          type: 'string',
          description: 'ID of the user requesting extraction'
        }
      },
      required: ['fileId', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const { fileId, format, userId } = args;
      const tables = await extractTablesFromFile(fileId, format);
      const duration = Date.now() - start;
      await logToolInvocation({ toolName: 'extractTables', userId, duration, input: args, output: tables, success: true });
      return {
        success: true,
        data: {
          tables,
          totalTables: tables.length
        },
        metadata: {}
      };
    } catch (error: any) {
      await logToolInvocation({ toolName: 'extractTables', userId: args.userId, duration: Date.now() - start, input: args, output: error.message, success: false });
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during table extraction'
      };
    }
  }
}; 