import { fetchMetrics } from '../utils/metricsUtils';

export async function getRealtimeMetrics() {
  // For now, return mock data
  return fetchMetrics();
} 