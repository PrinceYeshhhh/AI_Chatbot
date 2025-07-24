// Multi-Agent Execution Pipeline
import { AgentOrchestrator } from '../orchestrator/agentOrchestrator';
import { AgentRegistryManager } from '../registry/agentRegistry';
import { AgentContext, MultiAgentResult, AgentExecutionResult, Agent } from '../types';
import { logger } from '../../utils/logger';

export interface PipelineConfig {
  enableLogging: boolean;
  enableMetrics: boolean;
  maxConcurrentAgents: number;
  timeoutMs: number;
  defaultStrategy: 'sequential' | 'parallel' | 'hierarchical';
}

export class MultiAgentPipeline {
  private orchestrator: AgentOrchestrator;
  private agentRegistry: AgentRegistryManager;
  private config: PipelineConfig;

  constructor(
    agentRegistry: AgentRegistryManager,
    config: PipelineConfig = {
      enableLogging: true,
      enableMetrics: true,
      maxConcurrentAgents: 3,
      timeoutMs: 60000,
      defaultStrategy: 'sequential'
    }
  ) {
    this.agentRegistry = agentRegistry;
    this.orchestrator = new AgentOrchestrator(agentRegistry);
    this.config = config;
  }

  /**
   * Execute multi-agent pipeline
   */
  async execute(
    prompt: string,
    context: AgentContext,
    strategy?: string
  ): Promise<MultiAgentResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`[PIPELINE] Starting multi-agent execution for user: ${context.userId}`);
      
      const finalStrategy = strategy || this.config.defaultStrategy;
      const result = await this.orchestrator.executeMultiAgent(prompt, context, [finalStrategy]);

      // Log execution
      if (this.config.enableLogging) {
        await this.logMultiAgentExecution(context, prompt, result);
      }

      // Log metrics
      if (this.config.enableMetrics) {
        this.logMultiAgentMetrics(context, result, Date.now() - startTime);
      }

      logger.info(`[PIPELINE] Multi-agent execution completed successfully`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[PIPELINE] Multi-agent execution failed:`, error);
      
      return {
        success: false,
        response: `Multi-agent pipeline execution failed: ${errorMessage}`,
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
   * Execute with specific agent selection
   */
  async executeWithAgents(
    prompt: string,
    context: AgentContext,
    agentIds: string[]
  ): Promise<MultiAgentResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`[PIPELINE] Executing with specific agents: ${agentIds.join(', ')}`);
      
      const results: AgentExecutionResult[] = [];
      
      for (const agentId of agentIds) {
        const agent = this.agentRegistry.getAgent(agentId);
        if (!agent || !agent.isActive) {
          logger.warn(`[PIPELINE] Agent ${agentId} not found or inactive`);
          continue;
        }

        const agentContext: AgentContext = { ...context, agentId };
        const { AgentHandler } = await import('../handlers/agentHandler');
        const handler = new AgentHandler(agent, agentContext);
        
        const result = await handler.handlePrompt(prompt);
        
        const error = result.metadata?.errors?.[0];
        results.push({
          agentId,
          agentName: agent.name,
          success: result.success,
          response: result.response,
          toolCalls: result.toolCalls || [],
          executionTime: result.metadata?.totalExecutionTime || 0,
          ...(error && { error })
        });
      }

      const finalResponse = this.synthesizeResponses(results, prompt);
      const totalExecutionTime = Date.now() - startTime;

      return {
        success: results.some(r => r.success),
        response: finalResponse,
        agentResults: results,
        metadata: {
          totalExecutionTime,
          agentsUsed: agentIds,
          errors: results.filter(r => !r.success).map(r => r.error || 'Unknown error')
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[PIPELINE] Manual agent execution failed:`, error);
      
      return {
        success: false,
        response: `Manual agent execution failed: ${errorMessage}`,
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
   * Log multi-agent execution
   */
  private async logMultiAgentExecution(
    context: AgentContext,
    prompt: string,
    result: MultiAgentResult
  ): Promise<void> {
    try {
      // Supabase logging removed
    } catch (error) {
      logger.error('[PIPELINE] Failed to log multi-agent execution:', error);
    }
  }

  /**
   * Log multi-agent metrics
   */
  private logMultiAgentMetrics(
    context: AgentContext,
    result: MultiAgentResult,
    totalTime: number
  ): void {
    const metrics = {
      userId: context.userId,
      totalAgentsUsed: result.metadata.agentsUsed.length,
      totalExecutionTime: totalTime,
      success: result.success,
      timestamp: new Date().toISOString()
    };

    logger.info('[PIPELINE] Multi-agent metrics:', metrics);
    
    // TODO: Send metrics to monitoring service
    // await metricsService.record('multi_agent_execution', metrics);
  }

  /**
   * Synthesize responses from multiple agents
   */
  private synthesizeResponses(results: AgentExecutionResult[], originalPrompt: string): string {
    const successfulResults = results.filter(r => r.success && r.response);
    
    if (successfulResults.length === 0) {
      return "I wasn't able to process your request with the available agents.";
    }

    if (successfulResults.length === 1) {
      const response = successfulResults[0]?.response;
      return response || "No response available";
    }

    // Multiple successful agents - synthesize response
    const agentNames = successfulResults.map(r => r.agentName || r.agentId);
    const responses = successfulResults.map(r => r.response).filter(Boolean);
    
    return `I consulted with ${agentNames.join(', ')} to provide you with the following response:\n\n${responses.join('\n\n')}`;
  }
} 