// Email Generation Tool
import { Tool, ToolArgs, ToolResult } from '../types';
import { callLLMGenerateEmail, logToolInvocation } from './helpers';

export const generateEmail: Tool = {
  name: 'generateEmail',
  description: 'Generates professional emails based on context and requirements',
  category: 'communication',
  schema: {
    name: 'generateEmail',
    description: 'Generates professional emails based on context and requirements',
    parameters: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'Email recipient name or address'
        },
        subject: {
          type: 'string',
          description: 'Email subject line'
        },
        context: {
          type: 'string',
          description: 'Context or purpose of the email'
        },
        tone: {
          type: 'string',
          description: 'Email tone (formal, casual, professional)',
          enum: ['formal', 'casual', 'professional'],
          default: 'professional'
        },
        userId: {
          type: 'string',
          description: 'ID of the user generating email'
        }
      },
      required: ['recipient', 'subject', 'context', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const { recipient, subject, context, tone, userId } = args;
      const email = await callLLMGenerateEmail({ recipient, subject, context, tone });
      const duration = Date.now() - start;
      await logToolInvocation({ toolName: 'generateEmail', userId, duration, input: args, output: email, success: true });
      return {
        success: true,
        data: {
          email
        },
        metadata: {}
      };
    } catch (error: any) {
      await logToolInvocation({ toolName: 'generateEmail', userId: args.userId, duration: Date.now() - start, input: args, output: error.message, success: false });
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during email generation'
      };
    }
  }
}; 