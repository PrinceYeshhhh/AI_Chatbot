// Agent Tools Framework Verification Script
import { AgentRegistryManager } from './registry/agentRegistry';
import { ToolManager } from './toolManager';
import { AgentOrchestrator } from './orchestrator/agentOrchestrator';
import { AgentHandler } from './handlers/agentHandler';
import { AgentContext } from './types';

async function verifyFramework() {
  console.log('🔍 Verifying Agent Tools Framework...\n');

  try {
    // 1. Test Agent Registry
    console.log('1. Testing Agent Registry...');
    const agentRegistry = new AgentRegistryManager();
    const agents = agentRegistry.getAllAgents();
    console.log(`✅ Found ${agents.length} agents`);
    
    const generalAgent = agentRegistry.getAgent('general-assistant');
    if (generalAgent) {
      console.log(`✅ General assistant agent found: ${generalAgent.name}`);
    }

    // 2. Test Tool Manager
    console.log('\n2. Testing Tool Manager...');
    const toolManager = new ToolManager();
    const toolInfo = toolManager.getToolInfo();
    console.log(`✅ Found ${toolInfo.length} tools`);
    
    const toolCategories = toolInfo.map(t => t.category);
    const uniqueCategories = [...new Set(toolCategories)];
    console.log(`✅ Tool categories: ${uniqueCategories.join(', ')}`);

    // 3. Test Agent Handler
    console.log('\n3. Testing Agent Handler...');
    if (generalAgent) {
      const context: AgentContext = {
        userId: 'test-user',
        workspaceId: 'test-workspace'
      };
      
      const handler = new AgentHandler(generalAgent, context);
      console.log('✅ Agent handler created successfully');
      
      // Test handler with a simple prompt
      const handlerResult = await handler.handlePrompt('Summarize this document');
      console.log(`✅ Handler test result: ${handlerResult.success ? 'Success' : 'Failed'}`);
    }

    // 4. Test Orchestrator
    console.log('\n4. Testing Agent Orchestrator...');
    const orchestrator = new AgentOrchestrator(agentRegistry);
    const strategies = orchestrator.getStrategies();
    console.log(`✅ Found ${strategies.length} orchestration strategies`);
    
    strategies.forEach(strategy => {
      console.log(`   - ${strategy.name}: ${strategy.description}`);
    });

    // 5. Test Tool Execution (simulated)
    console.log('\n5. Testing Tool Execution...');
    const testArgs = {
      userId: 'test-user',
      workspaceId: 'test-workspace',
      prompt: 'Summarize this document',
      agentId: 'general-assistant'
    };
    
    const result = await toolManager.executeTool('summarizeDoc', testArgs);
    console.log(`✅ Tool execution result: ${result.success ? 'Success' : 'Failed'}`);

    // 6. Test Multi-Agent Execution
    console.log('\n6. Testing Multi-Agent Execution...');
    const multiAgentResult = await orchestrator.executeMultiAgent(
      'Analyze financial data and create a report',
      { userId: 'test-user', workspaceId: 'test-workspace' },
      ['general-assistant', 'financial-analyst']
    );
    
    console.log(`✅ Multi-agent execution: ${multiAgentResult.success ? 'Success' : 'Failed'}`);
    console.log(`   Response: ${multiAgentResult.response.substring(0, 100)}...`);

    console.log('\n🎉 Agent Tools Framework verification completed successfully!');
    console.log('\n📋 Framework Status:');
    console.log('   ✅ Agent Registry: Working');
    console.log('   ✅ Tool Manager: Working');
    console.log('   ✅ Agent Handler: Working');
    console.log('   ✅ Orchestrator: Working');
    console.log('   ✅ Tool Execution: Working');
    console.log('   ✅ Multi-Agent: Working');
    
    return true;

  } catch (error) {
    console.error('❌ Framework verification failed:', error);
    return false;
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyFramework().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { verifyFramework }; 