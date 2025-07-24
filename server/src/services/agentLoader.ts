// import { AgentHandler, ToolManager } from '../agent';
// import { ExecutionPipeline } from '../agent/pipeline/executionPipeline';
import { ToolManager } from '../agent';
import { AgentContext } from '../agent/types';
// import { logger } from '../utils/logger';

export async function getAgentConfig(agent_id: string) {
  // const { data, error } = await supabase.from('agents').select('*').eq('agent_id', agent_id).single();
  // if (error) throw new Error(error.message);
  // return data;
  // Placeholder for new provider logic
  console.log(`getAgentConfig: agent_id=${agent_id}`);
  return { agent_id, name: `Agent ${agent_id}`, description: `Description for Agent ${agent_id}` };
}

export async function getAgentTools(agent_id: string) {
  // const { data, error } = await supabase.from('agent_tools').select('*').eq('agent_id', agent_id);
  // if (error) throw new Error(error.message);
  // return data || [];
  // Placeholder for new provider logic
  console.log(`getAgentTools: agent_id=${agent_id}`);
  return [
    { tool_id: 'tool1', name: 'Tool 1', description: 'Description for Tool 1' },
    { tool_id: 'tool2', name: 'Tool 2', description: 'Description for Tool 2' },
  ];
}

export async function getAgentFiles(agent_id: string) {
  // const { data, error } = await supabase.from('agent_files').select('file_id').eq('agent_id', agent_id);
  // if (error) throw new Error(error.message);
  // return (data || []).map(f => f.file_id);
  // Placeholder for new provider logic
  console.log(`getAgentFiles: agent_id=${agent_id}`);
  return ['file1', 'file2'];
}

export async function getAgentMemory(agent_id: string, user_id: string, workspace_id: string, type: string) {
  // const { data, error } = await supabase.from('agent_memory')
  //   .select('*')
  //   .eq('agent_id', agent_id)
  //   .eq('user_id', user_id)
  //   .eq('workspace_id', workspace_id)
  //   .eq('type', type);
  // if (error) throw new Error(error.message);
  // return data || [];
  // Placeholder for new provider logic
  console.log(`getAgentMemory: agent_id=${agent_id}, user_id=${user_id}, workspace_id=${workspace_id}, type=${type}`);
  return [
    { memory_id: 'mem1', agent_id, user_id, workspace_id, type, content: 'Memory content 1' },
    { memory_id: 'mem2', agent_id, user_id, workspace_id, type, content: 'Memory content 2' },
  ];
}

export async function purgeAgentMemory(agent_id: string) {
  // await supabase.from('agent_memory').delete().eq('agent_id', agent_id);
  console.log(`purgeAgentMemory: agent_id=${agent_id}`);
}

export async function purgeAgentFiles(agent_id: string) {
  // await supabase.from('agent_files').delete().eq('agent_id', agent_id);
  console.log(`purgeAgentFiles: agent_id=${agent_id}`);
}

// AGENT CRUD
export async function createAgent(agent: any) {
  // const { data, error } = await supabase.from('agents').insert([agent]).single();
  // if (error) throw new Error(error.message);
  // return data;
  // Placeholder for new provider logic
  console.log(`createAgent: agent=${JSON.stringify(agent)}`);
  return { agent_id: `new_agent_${Date.now()}`, ...agent };
}

export async function updateAgent(agent_id: any, updates: any) {
  // const { data, error } = await supabase.from('agents').update(updates).eq('agent_id', agent_id).single();
  // if (error) throw new Error(error.message);
  // return data;
  // Placeholder for new provider logic
  console.log(`updateAgent: agent_id=${agent_id}, updates=${JSON.stringify(updates)}`);
  return { agent_id, ...updates };
}

export async function deleteAgent(agent_id: any) {
  // const { error } = await supabase.from('agents').delete().eq('agent_id', agent_id);
  // if (error) throw new Error(error.message);
  console.log(`deleteAgent: agent_id=${agent_id}`);
}

export async function listAgents(workspace_id: any) {
  // const { data, error } = await supabase.from('agents').select('*').eq('workspace_id', workspace_id);
  // if (error) throw new Error(error.message);
  // return data || [];
  // Placeholder for new provider logic
  console.log(`listAgents: workspace_id=${workspace_id}`);
  return [
    { agent_id: 'agent1', name: 'Agent 1', workspace_id, description: 'Description for Agent 1' },
    { agent_id: 'agent2', name: 'Agent 2', workspace_id, description: 'Description for Agent 2' },
  ];
}

// AGENT TOOLS CRUD
export async function addAgentTool(agent_id: any, tool: any) {
  // const { data, error } = await supabase.from('agent_tools').insert([{ agent_id, ...tool }]).single();
  // if (error) throw new Error(error.message);
  // return data;
  // Placeholder for new provider logic
  console.log(`addAgentTool: agent_id=${agent_id}, tool=${JSON.stringify(tool)}`);
  return { agent_id, ...tool };
}

export async function removeAgentTool(agent_id: any, tool_id: any) {
  // const { error } = await supabase.from('agent_tools').delete().eq('agent_id', agent_id).eq('tool_id', tool_id);
  // if (error) throw new Error(error.message);
  console.log(`removeAgentTool: agent_id=${agent_id}, tool_id=${tool_id}`);
}

// AGENT FILES CRUD
export async function addAgentFile(agent_id: any, file_id: any) {
  // const { data, error } = await supabase.from('agent_files').insert([{ agent_id, file_id }]).single();
  // if (error) throw new Error(error.message);
  // return data;
  // Placeholder for new provider logic
  console.log(`addAgentFile: agent_id=${agent_id}, file_id=${file_id}`);
  return { agent_id, file_id };
}

export async function removeAgentFile(agent_id: any, file_id: any) {
  // const { error } = await supabase.from('agent_files').delete().eq('agent_id', agent_id).eq('file_id', file_id);
  // if (error) throw new Error(error.message);
  console.log(`removeAgentFile: agent_id=${agent_id}, file_id=${file_id}`);
}

// AGENT MEMORY CRUD
export async function addAgentMemory(agent_id: any, user_id: any, workspace_id: any, type: any, content: any) {
  // const { data, error } = await supabase.from('agent_memory').insert([{ agent_id, user_id, workspace_id, type, content }]).single();
  // if (error) throw new Error(error.message);
  // return data;
  // Placeholder for new provider logic
  console.log(`addAgentMemory: agent_id=${agent_id}, user_id=${user_id}, workspace_id=${workspace_id}, type=${type}, content=${content}`);
  return { agent_id, user_id, workspace_id, type, content };
}

export async function removeAgentMemory(agent_id: any, user_id: any, type: any) {
  // const { error } = await supabase.from('agent_memory').delete().eq('agent_id', agent_id).eq('user_id', user_id).eq('type', type);
  // if (error) throw new Error(error.message);
  console.log(`removeAgentMemory: agent_id=${agent_id}, user_id=${user_id}, type=${type}`);
}

// TOOL EXECUTION (tool-calling schema compatible)
export async function executeAgentTool(agent_id: any, tool_id: any, input: any) {
  try {
    // Get tool configuration from database
    // const { data: tool } = await supabase
    //   .from('agent_tools')
    //   .select('*')
    //   .eq('agent_id', agent_id)
    //   .eq('tool_id', tool_id)
    //   .single();
    
    // if (!tool) {
    //   throw new Error(`Tool ${tool_id} not found for agent ${agent_id}`);
    // }
    
    // Use the new ToolManager
    const toolManager = new ToolManager();
    const result = await toolManager.executeTool(tool_id, input); // Changed tool_id to tool_id
    
    // Log tool usage
    // await supabase.from('agent_tool_logs').insert({
    //   agent_id,
    //   tool_id,
    //   user_id: input.user_id,
    //   input: input,
    //   output: result,
    //   used_at: new Date().toISOString()
    // });
    
    return result;
  } catch (error: any) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
}

// AGENT CHAT (stub)
export async function chatWithAgent(agent_id: any, user_id: any, _message: any, _history: any) {
  try {
    // Load agent configuration
    const agent = await getAgentConfig(agent_id); // Changed loadAgent to getAgentConfig
    if (!agent) {
      throw new Error('Agent not found');
    }

    const _context: AgentContext = {
      agent_id,
      user_id,
      session_id: `session_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // Process with agent
    // Placeholder for new provider logic
    console.log(`chatWithAgent: agent_id=${agent_id}, user_id=${user_id}, _message=${_message}, _history=${JSON.stringify(_history)}`);
    return { agentId: agent_id, user_id, _message, _history, response: `Chat response for agent ${agent_id}` };
  } catch (error) {
    console.error('Error in chatWithAgent:', error);
    throw error;
  }
} 