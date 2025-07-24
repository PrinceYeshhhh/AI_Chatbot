export async function fetchMetrics() {
  // TODO: Replace with real DB/log queries
  return {
    chats: 1234,
    toolsUsed: 87,
    filesUploaded: 56,
    llmTokenUsage: 456789,
    costEstimate: 23.45,
    errors: 3,
    failedWorkflows: 2,
    timeouts: 1,
    timestamp: new Date().toISOString(),
  };
} 