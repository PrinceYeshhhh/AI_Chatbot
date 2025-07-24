// Data Analysis Tool
import { Tool, ToolArgs, ToolResult } from '../types';
import { getDataBySource, analyzeDataWithLLMOrStats, logToolInvocation } from './helpers';

export const analyzeData: Tool = {
  name: 'analyzeData',
  description: 'Analyzes data sets and provides insights and trends',
  category: 'analysis',
  schema: {
    name: 'analyzeData',
    description: 'Analyzes data sets and provides insights and trends',
    parameters: {
      type: 'object',
      properties: {
        dataSource: {
          type: 'string',
          description: 'Source of data (file ID, database, API)'
        },
        analysisType: {
          type: 'string',
          description: 'Type of analysis to perform',
          enum: ['trend', 'correlation', 'outlier', 'summary'],
          default: 'summary'
        },
        userId: {
          type: 'string',
          description: 'ID of the user requesting analysis'
        }
      },
      required: ['dataSource', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const { dataSource, analysisType, userId } = args;
      const data = await getDataBySource(dataSource);
      const analysis = await analyzeDataWithLLMOrStats(data, analysisType);
      const duration = Date.now() - start;
      await logToolInvocation({ toolName: 'analyzeData', userId, duration, input: args, output: analysis, success: true });
      return {
        success: true,
        data: analysis.data,
        metadata: analysis.metadata
      };
    } catch (error: any) {
      await logToolInvocation({ toolName: 'analyzeData', userId: args.userId, duration: Date.now() - start, input: args, output: error.message, success: false });
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during data analysis'
      };
    }
  }
}; 