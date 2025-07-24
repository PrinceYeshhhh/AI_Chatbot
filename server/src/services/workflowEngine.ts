import { v4 as uuidv4 } from 'uuid';
import { AgentRegistryManager } from '../agent/registry/agentRegistry';
import { ToolManager } from '../agent/toolManager';
import { logger, logAnalyticsEvent, logSystemAlert, sendWebhookAlert } from '../utils/logger';

const agentRegistry = new AgentRegistryManager();
const toolManager = new ToolManager();

export type WorkflowStep = {
  id: string;
  agent_id: string;
  name: string;
  type?: string;
  next?: string | string[];
  condition?: string;
  retries?: number;
  params?: Record<string, any>;
};

export type WorkflowConfig = {
  name: string;
  steps: WorkflowStep[];
  start: string;
};

export type WorkflowRunLog = {
  stepId: string;
  agentId: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'fail';
  input: any;
  output?: any;
  error: string;
  startedAt: string;
  finishedAt?: string;
  retries: number;
};

export async function executeWorkflow({
  workflowConfig,
  userId,
  workflowId
}: {
  workflowConfig: WorkflowConfig,
  userId: string,
  workflowId: string
}) {
  const runId = uuidv4();
  const logs: WorkflowRunLog[] = [];
  let context: any = {};
  let currentStepId = workflowConfig.start;
  let finished = false;
  const stepMap = Object.fromEntries(workflowConfig.steps.map(s => [s.id, s]));
  const STEP_TIMEOUT_MS = 30000; // 30 seconds per step

  while (!finished && currentStepId) {
    const step = stepMap[currentStepId];
    if (!step) break;
    let status: WorkflowRunLog['status'] = 'pending';
    let output = null;
    let error = '';
    let retries = 0;
    let succeeded = false;
    let startedAt = new Date().toISOString();
    let stepStart = Date.now();
    while (retries <= (step.retries || 0) && !succeeded) {
      status = 'running';
      try {
        // Real provider logic: choose agent/provider based on step config
        const agentData = await getAgentData(step.agent_id);
        // Per-step timeout logic
        output = await Promise.race([
          executeAgentStep(agentData, context, step.params),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Step timeout')), STEP_TIMEOUT_MS))
        ]);
        status = 'success';
        succeeded = true;
      } catch (e: any) {
        error = e.message;
        status = 'fail';
        retries++;
        await logSystemAlert({
          alert_type: 'workflow_step_failure',
          severity: 'high',
          message: `Workflow step failed: ${step.name}`,
          context: { runId, stepId: step.id, agentId: step.agent_id, userId, retries },
          metadata: { error: e.message, stack: e.stack }
        });
        await sendWebhookAlert({
          type: 'workflow_step_failure',
          runId,
          stepId: step.id,
          agentId: step.agent_id,
          userId,
          retries,
          error: e.message,
          stack: e.stack
        });
        if (retries > (step.retries || 0)) {
          // Error handling: log and break if max retries exceeded
          break;
        }
      }
    }
    const finishedAt = new Date().toISOString();
    const stepDuration = Date.now() - stepStart;
    const outputSize = output ? JSON.stringify(output).length : 0;
    logs.push({
      stepId: step.id,
      agentId: step.agent_id,
      name: step.name,
      status,
      input: { context, params: step.params },
      output,
      error: error || '',
      startedAt,
      finishedAt,
      retries
    });
    // Detailed logging for each step
    logger.info(`[WORKFLOW] Step: ${step.name}, Status: ${status}, Duration: ${stepDuration}ms, OutputSize: ${outputSize}, Retries: ${retries}`);
    // Pass output to context for next step
    context = { ...context, [`step_${step.id}`]: output };
    if (status === 'fail') {
      await logSystemAlert({
        alert_type: 'workflow_failure',
        severity: 'high',
        message: `Workflow failed at step: ${step.name}`,
        context: { runId, stepId: step.id, agentId: step.agent_id, userId },
        metadata: { error }
      });
      await sendWebhookAlert({
        type: 'workflow_failure',
        runId,
        stepId: step.id,
        agentId: step.agent_id,
        userId,
        error
      });
      break;
    }
  }
  // On workflow success
  await logSystemAlert({
    alert_type: 'workflow_success',
    severity: 'low',
    message: `Workflow completed successfully`,
    context: { runId, userId },
    metadata: { logs }
  });
  // Store workflow run log (implement your provider logic here)
  await storeWorkflowRunLog({ runId, logs, finalContext: context });
  return { runId, logs, finalContext: context };
}

// Helper: Get agent data by ID
async function getAgentData(agentId: string) {
  const agent = agentRegistry.getAgent(agentId);
  if (!agent) throw new Error(`Agent not found: ${agentId}`);
  return agent;
}

// Helper: Execute agent step (tool call)
async function executeAgentStep(agent: any, context: any, params: any) {
  // For this example, assume params include toolName and toolArgs
  if (!params || !params.toolName) throw new Error('No toolName specified in step params');
  if (!agent.toolsAllowed.includes(params.toolName)) throw new Error(`Agent ${agent.name} cannot use tool ${params.toolName}`);
  const toolArgs = { ...params.toolArgs, userId: context.userId || params.userId };
  const result = await toolManager.executeTool(params.toolName, toolArgs);
  return result;
}

// Helper: Choose next step based on output/context
function chooseNextStep(nextSteps: string[], output: any, context: any): string | undefined {
  // Example: If output.success, pick first; else, pick second (customize as needed)
  if (!Array.isArray(nextSteps) || nextSteps.length === 0) return undefined;
  if (output && output.success && nextSteps.length > 0) return nextSteps[0];
  if (nextSteps.length > 1) return nextSteps[1];
  return nextSteps[0];
}

// Helper: Store workflow run log
async function storeWorkflowRunLog({ runId, logs, finalContext }: { runId: string, logs: WorkflowRunLog[], finalContext: any }) {
  try {
    logger.info({ runId, logs, finalContext }, '[WORKFLOW] Workflow run log');
    await logAnalyticsEvent({
      user_id: finalContext?.userId || 'unknown',
      event_type: 'workflow_run',
      event_data: { runId, logs, finalContext },
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Failed to store workflow run log:', err);
  }
}

// Simulate agent call (replace with real agent execution logic)
async function simulateAgentCall(agent: any, context: any, params: any) {
  // For now, just echo agent name and params
  return {
    agent: agent.name,
    params,
    receivedContext: context
  };
}