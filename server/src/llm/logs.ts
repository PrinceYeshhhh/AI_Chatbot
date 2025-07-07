import { supabase } from '../lib/supabase';

// LLM logging module
// Logs provider, model, latency, cost, user, and task type

export async function logLLMCall({ provider, model, latency, cost, userId, taskType }: {
  provider: string;
  model: string;
  latency: number;
  cost: number;
  userId: string;
  taskType: string;
}) {
  // Insert log into llm_logs table
  const { error } = await supabase
    .from('llm_logs')
    .insert({
      provider,
      model,
      latency,
      cost,
      user_id: userId,
      task_type: taskType,
      created_at: new Date().toISOString()
    });
  if (error) {
    // Log error but do not throw (non-blocking)
    console.error('Failed to log LLM call:', error.message);
  }
} 