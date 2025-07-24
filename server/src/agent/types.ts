// Agent Tools Framework - Type Definitions

export interface Tool {
  name: string;
  description: string;
  category: ToolCategory;
  execute: (args: ToolArgs) => Promise<ToolResult>;
  schema: ToolSchema;
  agentCompatibility?: string[]; // Which agents can use this tool
}

export interface ToolRegistry {
  [key: string]: Tool;
}

export interface ToolArgs {
  [key: string]: any;
  userId?: string;
  fileId?: string;
  workspaceId?: string;
  agentId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export type ToolCategory = 
  | 'document' 
  | 'analysis' 
  | 'communication' 
  | 'automation' 
  | 'utility' 
  | 'financial' 
  | 'hr' 
  | 'legal' 
  | 'marketing' 
  | 'product';

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  systemPrompt: string;
  toolsAllowed: string[];
  memoryScope: string;
  capabilities: AgentCapability[];
  config: AgentConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

export interface AgentConfig {
  maxToolsPerRequest: number;
  timeoutMs: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  memoryRetentionDays: number;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export interface AgentRegistry {
  [agentId: string]: Agent;
}

export interface AgentContext {
  userId: string;
  workspaceId?: string;
  sessionId?: string;
  agentId?: string;
  userPreferences?: any;
  conversationHistory?: any[];
}

export interface AgentToolCall {
  toolName: string;
  args: ToolArgs;
  result: ToolResult;
  executionTime: number;
  timestamp: Date;
}

export interface MultiAgentResult {
  success: boolean;
  response: string;
  agentResults: AgentExecutionResult[];
  metadata: {
    totalExecutionTime: number;
    agentsUsed: string[];
    errors: string[];
  };
}

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  response: string;
  toolCalls: AgentToolCall[];
  executionTime: number;
  error?: string;
} 