// Agent Tools Registry - Central tool management
import { Tool, ToolRegistry, ToolCategory } from '../types';
import { summarizeDoc } from './summarizeDoc';
import { extractTables } from './extractTables';
import { generateEmail } from './generateEmail';
import { analyzeData } from './analyzeData';
import { translateText } from './translateText';
import { searchDocuments } from './searchDocuments';
import { createReport } from './createReport';
import { scheduleMeeting } from './scheduleMeeting';

// Import additional tools as they are created
import { calculateFinancials } from './calculateFinancials';
import { analyzeHRData } from './analyzeHRData';
import { extractLegalClauses } from './extractLegalClauses';
import { analyzeCampaigns } from './analyzeCampaigns';
import { analyzeFeedback } from './analyzeFeedback';
import { analyzeTrends } from './analyzeTrends';

// Tool Registry - All available tools
export const toolRegistry: ToolRegistry = {
  // Document Processing Tools
  summarizeDoc,
  extractTables,
  searchDocuments,
  createReport,
  extractLegalClauses,

  // Communication Tools
  generateEmail,
  translateText,
  scheduleMeeting,

  // Analysis Tools
  analyzeData,
  analyzeTrends,
  analyzeHRData,
  analyzeCampaigns,
  analyzeFeedback,

  // Financial Tools
  calculateFinancials,
};

/**
 * Get tool by name
 */
export function getTool(toolName: string): Tool | undefined {
  return toolRegistry[toolName];
}

/**
 * Get all tools
 */
export function getAllTools(): Tool[] {
  return Object.values(toolRegistry);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): Tool[] {
  return getAllTools().filter(tool => tool.category === category);
}

/**
 * Get tools by agent compatibility
 */
export function getToolsForAgent(agentId: string): Tool[] {
  return getAllTools().filter(tool => 
    !tool.agentCompatibility || tool.agentCompatibility.includes(agentId)
  );
}

/**
 * Execute a tool with error handling
 */
export async function executeTool(
  toolName: string, 
  args: any, 
  agentId?: string
): Promise<any> {
  const tool = getTool(toolName);
  
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  // Check agent compatibility if specified
  if (agentId && tool.agentCompatibility && !tool.agentCompatibility.includes(agentId)) {
    throw new Error(`Agent '${agentId}' cannot use tool '${toolName}'`);
  }

  try {
    console.log(`[TOOL_EXECUTION] Executing ${toolName} with args:`, args);
    const startTime = Date.now();
    
    const result = await tool.execute(args);
    
    const executionTime = Date.now() - startTime;
    console.log(`[TOOL_EXECUTION] ${toolName} completed in ${executionTime}ms`);
    
    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionTime
      }
    };
  } catch (error) {
    console.error(`[TOOL_EXECUTION] Error executing ${toolName}:`, error);
    throw error;
  }
}

/**
 * Get tool schema for validation
 */
export function getToolSchema(toolName: string): any {
  const tool = getTool(toolName);
  return tool?.schema;
}

/**
 * Validate tool arguments against schema
 */
export function validateToolArgs(toolName: string, args: any): boolean {
  const schema = getToolSchema(toolName);
  if (!schema) return false;

  // Basic validation - check required fields
  const required = schema.parameters?.required || [];
  return required.every((field: string) => args[field] !== undefined);
}

/**
 * Get available tool categories
 */
export function getToolCategories(): ToolCategory[] {
  const categories = new Set<ToolCategory>();
  getAllTools().forEach(tool => categories.add(tool.category));
  return Array.from(categories);
}

/**
 * Get tool statistics
 */
export function getToolStats() {
  const tools = getAllTools();
  const categories = getToolCategories();
  
  return {
    totalTools: tools.length,
    categories: categories.length,
    toolsByCategory: categories.reduce((acc, category) => {
      acc[category] = getToolsByCategory(category).length;
      return acc;
    }, {} as Record<string, number>)
  };
} 