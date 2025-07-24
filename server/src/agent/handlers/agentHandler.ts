// Agent Handler - Individual agent execution logic
import { Agent, AgentContext, AgentToolCall, ToolArgs, ToolResult } from '../types';
import { ToolManager } from '../toolManager';
import { logger } from '../../utils/logger';

export interface AgentHandlerResult {
  success: boolean;
  response: string;
  toolCalls: AgentToolCall[];
  metadata: {
    totalExecutionTime: number;
    toolsUsed: string[];
    errors: string[];
  };
}

export class AgentHandler {
  private agent: Agent;
  private toolManager: ToolManager;
  private context: AgentContext;

  constructor(agent: Agent, context: AgentContext) {
    this.agent = agent;
    this.context = context;
    this.toolManager = new ToolManager();
  }

  /**
   * Handle prompt and execute appropriate tools
   */
  async handlePrompt(prompt: string): Promise<AgentHandlerResult> {
    const startTime = Date.now();
    const toolCalls: AgentToolCall[] = [];
    const errors: string[] = [];

    try {
      // Simple tool matching logic (can be enhanced with AI)
      const toolMatches = this.matchToolsToPrompt(prompt);
      
      for (const toolName of toolMatches) {
        if (!this.agent.toolsAllowed.includes(toolName)) {
          errors.push(`Agent ${this.agent.name} cannot use tool ${toolName}`);
          continue;
        }

        try {
          const toolCall: AgentToolCall = {
            toolName,
            args: this.buildToolArgs(toolName, prompt),
            result: { success: false, error: 'Tool not implemented' },
            executionTime: 0,
            timestamp: new Date()
          };

          // Execute tool (placeholder for now)
          const result = await this.executeTool(toolName, toolCall.args);
          toolCall.result = result;
          toolCall.executionTime = Date.now() - startTime;

          toolCalls.push(toolCall);
        } catch (error) {
          errors.push(`Tool ${toolName} execution failed: ${error}`);
        }
      }

      const response = this.buildResponse(prompt, toolCalls, errors);
      
      return {
        success: toolCalls.length > 0 && errors.length === 0,
        response,
        toolCalls,
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          toolsUsed: toolCalls.map(tc => tc.toolName),
          errors
        }
      };

    } catch (error) {
      logger.error(`[AGENT_HANDLER] Error handling prompt:`, error);
      return {
        success: false,
        response: `Error processing request: ${error}`,
        toolCalls: [],
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          toolsUsed: [],
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      };
    }
  }

  /**
   * Match tools to prompt (simple keyword matching)
   */
  private matchToolsToPrompt(prompt: string): string[] {
    const matches: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // Simple keyword matching
    if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
      matches.push('summarizeDoc');
    }
    if (lowerPrompt.includes('table') || lowerPrompt.includes('extract')) {
      matches.push('extractTables');
    }
    if (lowerPrompt.includes('email') || lowerPrompt.includes('generate')) {
      matches.push('generateEmail');
    }
    if (lowerPrompt.includes('analyze') || lowerPrompt.includes('data')) {
      matches.push('analyzeData');
    }
    if (lowerPrompt.includes('translate')) {
      matches.push('translateText');
    }
    if (lowerPrompt.includes('search') || lowerPrompt.includes('find')) {
      matches.push('searchDocuments');
    }
    if (lowerPrompt.includes('report')) {
      matches.push('createReport');
    }
    if (lowerPrompt.includes('meeting') || lowerPrompt.includes('schedule')) {
      matches.push('scheduleMeeting');
    }

    return matches;
  }

  /**
   * Build tool arguments from prompt
   */
  private buildToolArgs(toolName: string, prompt: string): ToolArgs {
    const args: ToolArgs = {
      userId: this.context.userId,
      prompt,
      agentId: this.agent.id
    };
    
    if (this.context.workspaceId) {
      args.workspaceId = this.context.workspaceId;
    }
    
    return args;
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolName: string, args: ToolArgs): Promise<ToolResult> {
    try {
      return await this.toolManager.executeTool(toolName, args);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build response from tool results
   */
  private buildResponse(prompt: string, toolCalls: AgentToolCall[], errors: string[]): string {
    if (toolCalls.length === 0) {
      return "I couldn't find any appropriate tools to handle your request.";
    }

    const successfulCalls = toolCalls.filter(tc => tc.result.success);
    const failedCalls = toolCalls.filter(tc => !tc.result.success);

    let response = `Processed your request with ${successfulCalls.length} tool(s).\n\n`;

    if (successfulCalls.length > 0) {
      response += "**Successful operations:**\n";
      successfulCalls.forEach(call => {
        response += `- ${call.toolName}: ${call.result.data || 'Completed'}\n`;
      });
    }

    if (failedCalls.length > 0) {
      response += "\n**Failed operations:**\n";
      failedCalls.forEach(call => {
        response += `- ${call.toolName}: ${call.result.error}\n`;
      });
    }

    if (errors.length > 0) {
      response += "\n**Errors:**\n";
      errors.forEach(error => {
        response += `- ${error}\n`;
      });
    }

    return response;
  }
} 