// Multi-Agent Orchestrator - Routes requests to appropriate agents
import { AgentRegistryManager } from '../registry/agentRegistry';
import { AgentContext, MultiAgentResult, AgentExecutionResult } from '../types';
import { logger } from '../../utils/logger';

export interface OrchestrationStrategy {
  name: string;
  description: string;
  routeRequest(prompt: string, context: AgentContext): Promise<string[]>;
}

export class AgentOrchestrator {
  private agentRegistry: AgentRegistryManager;
  private strategies: Map<string, OrchestrationStrategy> = new Map();

  constructor(agentRegistry: AgentRegistryManager) {
    this.agentRegistry = agentRegistry;
    this.initializeStrategies();
  }

  /**
   * Initialize orchestration strategies
   */
  private initializeStrategies(): void {
    // Keyword-based strategy
    this.strategies.set('keyword', {
      name: 'Keyword-based Routing',
      description: 'Routes requests based on keyword matching',
      routeRequest: async (prompt: string, _context: AgentContext) => {
        const promptLower = prompt.toLowerCase();
        const agents: string[] = [];

        if (promptLower.includes('financial') || promptLower.includes('money') || promptLower.includes('investment')) {
          agents.push('financial-analyst');
        }
        if (promptLower.includes('hr') || promptLower.includes('employee') || promptLower.includes('recruitment')) {
          agents.push('hr-manager');
        }
        if (promptLower.includes('legal') || promptLower.includes('contract') || promptLower.includes('compliance')) {
          agents.push('legal-advisor');
        }
        if (promptLower.includes('marketing') || promptLower.includes('campaign') || promptLower.includes('brand')) {
          agents.push('marketing-strategist');
        }
        if (promptLower.includes('product') || promptLower.includes('roadmap') || promptLower.includes('feature')) {
          agents.push('product-manager');
        }
        if (promptLower.includes('data') || promptLower.includes('analysis') || promptLower.includes('statistics')) {
          agents.push('data-scientist');
        }

        // Default to general assistant if no specific agent found
        if (agents.length === 0) {
          agents.push('general-assistant');
        }

        return agents;
      }
    });

    // Multi-agent strategy
    this.strategies.set('multi_agent', {
      name: 'Multi-Agent Collaboration',
      description: 'Routes to multiple agents for comprehensive analysis',
      routeRequest: async (prompt: string, _context: AgentContext) => {
        const promptLower = prompt.toLowerCase();
        const agents: string[] = [];

        // Always include general assistant for coordination
        agents.push('general-assistant');

        // Add specialized agents based on content
        if (promptLower.includes('financial') || promptLower.includes('money')) {
          agents.push('financial-analyst');
        }
        if (promptLower.includes('data') || promptLower.includes('analysis')) {
          agents.push('data-scientist');
        }
        if (promptLower.includes('hr') || promptLower.includes('employee')) {
          agents.push('hr-manager');
        }

        return agents;
      }
    });
  }

  /**
   * Route request to appropriate agents
   */
  async routeRequest(prompt: string, context: AgentContext, strategy: string = 'keyword'): Promise<string[]> {
    const strategyImpl = this.strategies.get(strategy);
    if (!strategyImpl) {
      logger.warn(`[ORCHESTRATOR] Strategy '${strategy}' not found, using keyword strategy`);
      return this.strategies.get('keyword')!.routeRequest(prompt, context);
    }

    return await strategyImpl.routeRequest(prompt, context);
  }

  /**
   * Execute request with multiple agents
   */
  async executeMultiAgent(_prompt: string, context: AgentContext, agentIds: string[]): Promise<MultiAgentResult> {
    const startTime = Date.now();
    const agentResults: AgentExecutionResult[] = [];
    const errors: string[] = [];

    logger.info(`[ORCHESTRATOR] Executing multi-agent request with ${agentIds.length} agents`);

    try {
      // Execute each agent in parallel
      const executionPromises = agentIds.map(async (agentId) => {
        const agent = this.agentRegistry.getAgent(agentId);
        if (!agent) {
          errors.push(`Agent '${agentId}' not found`);
          return {
            agentId,
            agentName: agentId,
            success: false,
            response: `Agent '${agentId}' not found`,
            toolCalls: [],
            executionTime: 0,
            error: `Agent '${agentId}' not found`
          };
        }

        try {
          // Simulate agent execution (placeholder)
          const executionTime = Math.random() * 1000 + 500; // 500-1500ms
          await new Promise(resolve => setTimeout(resolve, executionTime));

          const result: AgentExecutionResult = {
            agentId,
            agentName: agent.name,
            success: true,
            response: `Agent ${agent.name} processed your request successfully`,
            toolCalls: [],
            executionTime
          };

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Agent ${agent.name} failed: ${errorMessage}`);
          
          return {
            agentId,
            agentName: agent.name,
            success: false,
            response: `Agent ${agent.name} encountered an error`,
            toolCalls: [],
            executionTime: 0,
            error: errorMessage
          };
        }
      });

      const results = await Promise.all(executionPromises);
      agentResults.push(...results);

      // Generate combined response
      const successfulResults = agentResults.filter(r => r.success);
      const combinedResponse = this.generateCombinedResponse(successfulResults, errors);

      return {
        success: successfulResults.length > 0,
        response: combinedResponse,
        agentResults,
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          agentsUsed: agentIds,
          errors
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[ORCHESTRATOR] Multi-agent execution failed:', error);
      
      return {
        success: false,
        response: `Multi-agent execution failed: ${errorMessage}`,
        agentResults: [],
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          agentsUsed: [],
          errors: [errorMessage]
        }
      };
    }
  }

  /**
   * Generate combined response from multiple agents
   */
  private generateCombinedResponse(results: AgentExecutionResult[], errors: string[]): string {
    if (results.length === 0) {
      return "No agents were able to process your request successfully.";
    }

    let response = `Processed your request with ${results.length} agent(s):\n\n`;

    results.forEach((result, index) => {
      response += `**${result.agentName}:**\n`;
      response += `${result.response}\n\n`;
    });

    if (errors.length > 0) {
      response += "**Errors encountered:**\n";
      errors.forEach(error => {
        response += `- ${error}\n`;
      });
    }

    return response;
  }

  /**
   * Get available orchestration strategies
   */
  getStrategies(): OrchestrationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy by name
   */
  getStrategy(name: string): OrchestrationStrategy | undefined {
    return this.strategies.get(name);
  }
} 