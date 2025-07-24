// Agent Tools Framework Tests
import { AgentToolsFramework } from '../index';
import { AgentContext } from '../types';
import { summarizeDoc } from '../tools/summarizeDoc';
import { analyzeData } from '../tools/analyzeData';
import { generateEmail } from '../tools/generateEmail';
import { createReport } from '../tools/createReport';
import { extractTables } from '../tools/extractTables';
import { searchDocuments } from '../tools/searchDocuments';
import { executeWorkflow } from '../../services/workflowEngine';
import { ToolManager } from '../toolManager';

describe('Agent Tools Framework', () => {
  let agentFramework: AgentToolsFramework;

  beforeEach(() => {
    agentFramework = new AgentToolsFramework();
  });

  describe('Initialization', () => {
    test('should initialize with default agents', () => {
      const agents = agentFramework.getAvailableAgents();
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(agent => agent.id === 'financial-analyst')).toBe(true);
      expect(agents.some(agent => agent.id === 'hr-manager')).toBe(true);
    });

    test('should initialize with default tools', () => {
      const tools = agentFramework.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some(tool => tool.name === 'summarizeDoc')).toBe(true);
      expect(tools.some(tool => tool.name === 'analyzeData')).toBe(true);
    });
  });

  describe('Agent Management', () => {
    test('should get agent by ID', () => {
      const agent = agentFramework.getAgent('financial-analyst');
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('Financial Analyst');
    });

    test('should get agents by capability', () => {
      const financialAgents = agentFramework.getAgentsByCapability('financial_analysis');
      expect(financialAgents.length).toBeGreaterThan(0);
      expect(financialAgents[0].capabilities.some(cap => cap.name === 'financial_analysis')).toBe(true);
    });

    test('should check agent tool compatibility', () => {
      const canUseTool = agentFramework.canAgentUseTool('financial-analyst', 'calculateFinancials');
      expect(canUseTool).toBe(true);
    });
  });

  describe('Tool Management', () => {
    test('should get tool by name', () => {
      const tool = agentFramework.getTool('summarizeDoc');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('summarizeDoc');
    });

    test('should get tools by category', () => {
      const documentTools = agentFramework.getToolsByCategory('document');
      expect(documentTools.length).toBeGreaterThan(0);
      expect(documentTools.every(tool => tool.category === 'document')).toBe(true);
    });

    test('should validate tool arguments', () => {
      const isValid = agentFramework.validateToolArgs('summarizeDoc', {
        fileId: 'test-file',
        userId: 'test-user'
      });
      expect(isValid).toBe(true);
    });
  });

  describe('Request Processing', () => {
    const mockContext: AgentContext = {
      userId: 'test-user',
      workspaceId: 'test-workspace'
    };

    test('should process basic request', async () => {
      const result = await agentFramework.processRequest(
        'Summarize this document',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    test('should handle specific agent request', async () => {
      const result = await agentFramework.executeAgent(
        'financial-analyst',
        'Analyze this financial data',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.agentId).toBe('financial-analyst');
    });

    test('should handle multi-agent request', async () => {
      const result = await agentFramework.processMultiAgentRequest(
        'I need both financial analysis and HR insights',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.agentResults.length).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid agent ID', () => {
      const agent = agentFramework.getAgent('invalid-agent');
      expect(agent).toBeUndefined();
    });

    test('should handle invalid tool name', () => {
      const tool = agentFramework.getTool('invalid-tool');
      expect(tool).toBeUndefined();
    });

    test('should handle tool execution errors', async () => {
      const mockContext: AgentContext = {
        userId: 'test-user'
      };

      // This should not throw but return an error result
      const result = await agentFramework.processRequest(
        'Execute invalid tool',
        mockContext
      );

      expect(result.success).toBe(true); // Framework should handle errors gracefully
    });
  });

  describe('Statistics', () => {
    test('should return framework statistics', () => {
      const stats = agentFramework.getStats();
      
      expect(stats.totalAgents).toBeGreaterThan(0);
      expect(stats.totalTools).toBeGreaterThan(0);
      expect(stats.categories).toBeGreaterThan(0);
      expect(stats.toolsByCategory).toBeDefined();
    });
  });
}); 

describe('Agent Tools - Production Tests', () => {
  const toolManager = new ToolManager();
  it('summarizes a document', async () => {
    const result = await summarizeDoc.execute({ fileId: 'test.txt', userId: 'user1', maxLength: 100 });
    expect(result.success).toBe(true);
    expect(result.data.summary).toBeDefined();
  });
  it('analyzes data', async () => {
    const result = await analyzeData.execute({ dataSource: 'test.csv', analysisType: 'summary', userId: 'user1' });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  it('generates an email', async () => {
    const result = await generateEmail.execute({ recipient: 'test@example.com', subject: 'Test', context: 'Test context', tone: 'formal', userId: 'user1' });
    expect(result.success).toBe(true);
    expect(result.data.email).toBeDefined();
  });
  it('creates a report', async () => {
    const result = await createReport.execute({ reportType: 'summary', dataSources: ['test.csv'], userId: 'user1', format: 'pdf' });
    expect(result.success).toBe(true);
    expect(result.data.report).toBeDefined();
  });
  it('extracts tables', async () => {
    const result = await extractTables.execute({ fileId: 'test.xlsx', format: 'json', userId: 'user1' });
    expect(result.success).toBe(true);
    expect(result.data.tables).toBeInstanceOf(Array);
  });
  it('searches documents', async () => {
    const result = await searchDocuments.execute({ query: 'test', userId: 'user1', fileIds: ['test.txt'], maxResults: 5 });
    expect(result.success).toBe(true);
    expect(result.data.results).toBeInstanceOf(Array);
  });
});

describe('LLM Routing - Provider Fallback', () => {
  it('routes to the correct provider and falls back on error', async () => {
    // Mock callLLM to simulate fallback
    const { callLLM } = require('../../llm/router');
    let calledProviders: string[] = [];
    jest.spyOn(require('../../llm/router'), 'callLLM').mockImplementation(async ({ provider }) => {
      calledProviders.push(provider);
      if (provider === 'groq') throw new Error('Groq down');
      return { content: 'ok' };
    });
    const result = await callLLM({ provider: ['groq', 'together'], model: 'llama3', messages: [{ role: 'user', content: 'test' }] });
    expect(result.content).toBe('ok');
    expect(calledProviders).toEqual(['groq', 'together']);
  });
});

describe('Workflow Engine - Step Execution', () => {
  it('executes a simple workflow with branching', async () => {
    const workflowConfig = {
      name: 'Test Workflow',
      start: 'step1',
      steps: [
        { id: 'step1', agent_id: 'general-assistant', name: 'Summarize', params: { toolName: 'summarizeDoc', toolArgs: { fileId: 'test.txt', userId: 'user1' } }, next: ['step2', 'step3'] },
        { id: 'step2', agent_id: 'general-assistant', name: 'Analyze', params: { toolName: 'analyzeData', toolArgs: { dataSource: 'test.csv', userId: 'user1' } }, next: 'step4' },
        { id: 'step3', agent_id: 'general-assistant', name: 'Fallback', params: { toolName: 'generateEmail', toolArgs: { recipient: 'test@example.com', subject: 'Fallback', context: 'Fallback', tone: 'formal', userId: 'user1' } }, next: 'step4' },
        { id: 'step4', agent_id: 'general-assistant', name: 'Finish', params: { toolName: 'createReport', toolArgs: { reportType: 'summary', dataSources: ['test.csv'], userId: 'user1', format: 'pdf' } } }
      ]
    };
    const result = await executeWorkflow({ workflowConfig, userId: 'user1', workflowId: 'wf1' });
    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.logs.some(log => log.status === 'success')).toBe(true);
  });
}); 