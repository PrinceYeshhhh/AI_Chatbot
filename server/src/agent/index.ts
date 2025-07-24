// Multi-Agent Tools Framework - Main Index
export * from './types';
export * from './tools';
export * from './handlers/agentHandler';
export * from './orchestrator/agentOrchestrator';
export * from './pipeline/multiAgentPipeline';
export * from './registry/agentRegistry';
export * from './toolManager';

// Import classes for main framework
import { AgentRegistryManager } from './registry/agentRegistry';
import { MultiAgentPipeline } from './pipeline/multiAgentPipeline';
import { AgentOrchestrator } from './orchestrator/agentOrchestrator';
import { ToolManager } from './toolManager';
import { ToolCategory } from './types';

// Re-export for convenience
export { AgentHandler } from './handlers/agentHandler';
export { AgentOrchestrator } from './orchestrator/agentOrchestrator';
export { MultiAgentPipeline } from './pipeline/multiAgentPipeline';
export { AgentRegistryManager } from './registry/agentRegistry';
export { ToolManager } from './toolManager';

// Main entry point for Agent Tools Framework
export class AgentToolsFramework {
  private agentRegistry: AgentRegistryManager;
  private pipeline: MultiAgentPipeline;
  private orchestrator: AgentOrchestrator;
  private toolManager: ToolManager;

  constructor() {
    this.agentRegistry = new AgentRegistryManager();
    this.orchestrator = new AgentOrchestrator(this.agentRegistry);
    this.pipeline = new MultiAgentPipeline(this.agentRegistry);
    this.toolManager = new ToolManager();
  }

  /**
   * Process request with automatic agent selection
   */
  async processRequest(prompt: string, context: any) {
    return await this.pipeline.execute(prompt, context);
  }

  /**
   * Execute with specific agent
   */
  async executeAgent(agentId: string, prompt: string, context: any) {
    return await this.pipeline.executeWithAgents(prompt, context, [agentId]);
  }

  /**
   * Process multi-agent request
   */
  async processMultiAgentRequest(prompt: string, context: any) {
    return await this.pipeline.execute(prompt, context, 'multi_agent');
  }

  /**
   * Get all available agents
   */
  getAvailableAgents() {
    return this.agentRegistry.getAllAgents();
  }

  /**
   * Get specific agent
   */
  getAgent(agentId: string) {
    return this.agentRegistry.getAgent(agentId);
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string) {
    return this.agentRegistry.getAgentsByCapability(capability);
  }

  /**
   * Get all available tools
   */
  getAvailableTools() {
    return this.toolManager.getToolInfo();
  }

  /**
   * Get specific tool
   */
  getTool(toolName: string) {
    return this.toolManager.getTool(toolName);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string) {
    return this.toolManager.getToolsByCategory(category as ToolCategory);
  }

  /**
   * Validate tool arguments
   */
  validateToolArgs(toolName: string, args: any) {
    const tool = this.getTool(toolName);
    if (!tool) return false;
    
    // Basic validation - check required fields
    const required = tool.schema.parameters?.required || [];
    return required.every((field: string) => args[field] !== undefined);
  }

  /**
   * Check if agent can use tool
   */
  canAgentUseTool(agentId: string, toolName: string) {
    return this.agentRegistry.canAgentUseTool(agentId, toolName);
  }

  /**
   * Get framework statistics
   */
  getStats() {
    const agents = this.getAvailableAgents();
    const tools = this.getAvailableTools();
    
    return {
      totalAgents: agents.length,
      totalTools: tools.length,
      categories: 8, // Fixed number of categories
      toolsByCategory: {
        document: tools.filter(t => t.category === 'document').length,
        analysis: tools.filter(t => t.category === 'analysis').length,
        communication: tools.filter(t => t.category === 'communication').length,
        automation: tools.filter(t => t.category === 'automation').length,
        utility: tools.filter(t => t.category === 'utility').length,
        financial: tools.filter(t => t.category === 'financial').length,
        hr: tools.filter(t => t.category === 'hr').length,
        legal: tools.filter(t => t.category === 'legal').length,
        marketing: tools.filter(t => t.category === 'marketing').length,
        product: tools.filter(t => t.category === 'product').length
      },
      agentsByRole: agents.reduce((acc, agent) => {
        acc[agent.role] = (acc[agent.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
} 