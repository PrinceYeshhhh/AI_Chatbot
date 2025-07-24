// Report Generation Tool
import { Tool, ToolArgs, ToolResult } from '../types';
import { getReportData, callLLMGenerateReport, logToolInvocation } from './helpers';

export const createReport: Tool = {
  name: 'createReport',
  description: 'Generates comprehensive reports based on data and requirements',
  category: 'document',
  schema: {
    name: 'createReport',
    description: 'Generates comprehensive reports based on data and requirements',
    parameters: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          description: 'Type of report to generate',
          enum: ['executive', 'technical', 'summary', 'detailed'],
          default: 'summary'
        },
        dataSources: {
          type: 'array',
          items: { type: 'string' },
          description: 'File IDs or data sources to include in report'
        },
        userId: {
          type: 'string',
          description: 'ID of the user requesting report'
        },
        format: {
          type: 'string',
          description: 'Output format (pdf, docx, html)',
          enum: ['pdf', 'docx', 'html'],
          default: 'pdf'
        }
      },
      required: ['reportType', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const { reportType, dataSources, userId, format } = args;
      const reportData = await getReportData(dataSources);
      const report = await callLLMGenerateReport({ reportType, reportData, format });
      const duration = Date.now() - start;
      await logToolInvocation({ toolName: 'createReport', userId, duration, input: args, output: report, success: true });
      return {
        success: true,
        data: {
          report: report.report,
          downloadUrl: report.downloadUrl || ''
        },
        metadata: {}
      };
    } catch (error: any) {
      await logToolInvocation({ toolName: 'createReport', userId: args.userId, duration: Date.now() - start, input: args, output: error.message, success: false });
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during report generation'
      };
    }
  }
}; 