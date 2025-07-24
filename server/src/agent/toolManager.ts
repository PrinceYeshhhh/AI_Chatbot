// Agent Tools Framework - Tool Manager
import { Tool, ToolArgs, ToolResult, ToolCategory } from './types';
import { toolRegistry, getAllTools, getToolsByCategory } from './tools';
import { logger } from '../utils/logger';

export interface ToolInfo {
  name: string;
  description: string;
  category: ToolCategory;
  isAvailable: boolean;
  lastUsed?: Date;
  usageCount: number;
}

export class ToolManager {
  private toolUsage: Map<string, { count: number; lastUsed: Date }> = new Map();

  /**
   * Get information about all available tools
   */
  getToolInfo(): ToolInfo[] {
    return getAllTools().map(tool => {
      const usage = this.toolUsage.get(tool.name);
      const toolInfo: ToolInfo = {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        isAvailable: true,
        usageCount: usage?.count || 0
      };
      
      if (usage?.lastUsed) {
        toolInfo.lastUsed = usage.lastUsed;
      }
      
      return toolInfo;
    });
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): ToolInfo[] {
    return getToolsByCategory(category).map(tool => {
      const usage = this.toolUsage.get(tool.name);
      const toolInfo: ToolInfo = {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        isAvailable: true,
        usageCount: usage?.count || 0
      };
      
      if (usage?.lastUsed) {
        toolInfo.lastUsed = usage.lastUsed;
      }
      
      return toolInfo;
    });
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    // Note: This would need to be implemented in the tools/index.ts file
    // For now, we'll just log it
    logger.info(`[TOOL_MANAGER] Tool registration requested: ${tool.name}`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): boolean {
    // Note: This would need to be implemented in the tools/index.ts file
    // For now, we'll just log it
    logger.info(`[TOOL_MANAGER] Tool unregistration requested: ${toolName}`);
    return true;
  }

  /**
   * Check if tool exists
   */
  hasTool(toolName: string): boolean {
    return toolName in toolRegistry;
  }

  /**
   * Get tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return toolRegistry[toolName];
  }

  /**
   * Execute tool and track usage
   */
  async executeTool(toolName: string, args: ToolArgs): Promise<ToolResult> {
    const tool = this.getTool(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`
      };
    }

    // Track usage
    const usage = this.toolUsage.get(toolName) || { count: 0, lastUsed: new Date() };
    usage.count++;
    usage.lastUsed = new Date();
    this.toolUsage.set(toolName, usage);

    logger.info(`[TOOL_MANAGER] Executing tool: ${toolName} (usage count: ${usage.count})`);

    try {
      const result = await tool.execute(args);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[TOOL_MANAGER] Tool ${toolName} execution failed:`, error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, { count: number; lastUsed: Date }> {
    const stats: Record<string, { count: number; lastUsed: Date }> = {};
    this.toolUsage.forEach((usage, toolName) => {
      stats[toolName] = usage;
    });
    return stats;
  }

  /**
   * Get most used tools
   */
  getMostUsedTools(limit: number = 5): Array<{ name: string; count: number }> {
    return Array.from(this.toolUsage.entries())
      .map(([name, usage]) => ({ name, count: usage.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Clear usage statistics
   */
  clearUsageStats(): void {
    this.toolUsage.clear();
    logger.info('[TOOL_MANAGER] Cleared usage statistics');
  }
} 