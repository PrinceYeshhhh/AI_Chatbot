// Simple test to verify Agent Tools Framework is working
import { AgentToolsFramework } from '../index';

describe('Agent Tools Framework - Simple Test', () => {
  test('should initialize without errors', () => {
    expect(() => {
      new AgentToolsFramework();
    }).not.toThrow();
  });

  test('should have agents available', () => {
    const framework = new AgentToolsFramework();
    const agents = framework.getAvailableAgents();
    expect(agents.length).toBeGreaterThan(0);
  });

  test('should have tools available', () => {
    const framework = new AgentToolsFramework();
    const tools = framework.getAvailableTools();
    expect(tools.length).toBeGreaterThan(0);
  });

  test('should get agent by ID', () => {
    const framework = new AgentToolsFramework();
    const agent = framework.getAgent('financial-analyst');
    expect(agent).toBeDefined();
    expect(agent?.name).toBe('Financial Analyst');
  });

  test('should get tool by name', () => {
    const framework = new AgentToolsFramework();
    const tool = framework.getTool('summarizeDoc');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('summarizeDoc');
  });

  test('should validate tool arguments', () => {
    const framework = new AgentToolsFramework();
    const isValid = framework.validateToolArgs('summarizeDoc', {
      fileId: 'test-file',
      userId: 'test-user'
    });
    expect(isValid).toBe(true);
  });

  test('should check agent tool compatibility', () => {
    const framework = new AgentToolsFramework();
    const canUse = framework.canAgentUseTool('financial-analyst', 'calculateFinancials');
    expect(canUse).toBe(true);
  });

  test('should get framework statistics', () => {
    const framework = new AgentToolsFramework();
    const stats = framework.getStats();
    expect(stats.totalAgents).toBeGreaterThan(0);
    expect(stats.totalTools).toBeGreaterThan(0);
  });
}); 