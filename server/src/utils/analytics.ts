import { NeonDatabaseService } from '../services/neonDatabaseService';

// Analytics utility for tracking usage and performance
export interface AnalyticsEvent {
  event_type: string;
  user_id: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface UsageMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  total_tokens_used: number;
  cost_estimate: number;
}

// Groq model pricing (per 1K tokens) - update as needed
const MODEL_PRICING = {
  'llama3-70b-8192': 0.05, // $0.05 per 1K tokens
  'llama3-8b-8192': 0.02,  // $0.02 per 1K tokens
  'mixtral-8x7b-32768': 0.03 // $0.03 per 1K tokens
};

export class AnalyticsService {
  private dbService: NeonDatabaseService;

  constructor() {
    this.dbService = new NeonDatabaseService();
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const query = `
        INSERT INTO analytics_events (event_type, user_id, metadata, timestamp)
        VALUES ($1, $2, $3, $4)
      `;
      
      await this.dbService.query(query, [
        event.event_type,
        event.user_id,
        JSON.stringify(event.metadata),
        event.timestamp
      ]);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  async getUsageMetrics(userId: string, startDate: Date, endDate: Date): Promise<UsageMetrics> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_requests,
          AVG(response_time) as average_response_time,
          SUM(tokens_used) as total_tokens_used
        FROM api_requests 
        WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
      `;
      
      const result = await this.dbService.query(query, [userId, startDate, endDate]);
      const row = result.rows[0];
      
      // Calculate cost estimate
      const totalTokens = row.total_tokens_used || 0;
      const costEstimate = (totalTokens / 1000) * MODEL_PRICING['llama3-70b-8192'];
      
      return {
        total_requests: parseInt(row.total_requests) || 0,
        successful_requests: parseInt(row.successful_requests) || 0,
        failed_requests: parseInt(row.failed_requests) || 0,
        average_response_time: parseFloat(row.average_response_time) || 0,
        total_tokens_used: parseInt(row.total_tokens_used) || 0,
        cost_estimate: costEstimate
      };
    } catch (error) {
      console.error('Failed to get usage metrics:', error);
      return {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        average_response_time: 0,
        total_tokens_used: 0,
        cost_estimate: 0
      };
    }
  }

  async trackAPICall(userId: string, endpoint: string, success: boolean, responseTime: number, tokensUsed?: number): Promise<void> {
    try {
      const query = `
        INSERT INTO api_requests (user_id, endpoint, success, response_time, tokens_used, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await this.dbService.query(query, [
        userId,
        endpoint,
        success,
        responseTime,
        tokensUsed || 0,
        new Date()
      ]);
    } catch (error) {
      console.error('Failed to track API call:', error);
    }
  }

  async getUserAnalytics(userId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          event_type,
          COUNT(*) as count,
          DATE(timestamp) as date
        FROM analytics_events 
        WHERE user_id = $1 
        GROUP BY event_type, DATE(timestamp)
        ORDER BY date DESC, count DESC
      `;
      
      const result = await this.dbService.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return [];
    }
  }

  async getSystemAnalytics(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_events,
          AVG(response_time) as avg_response_time
        FROM analytics_events ae
        LEFT JOIN api_requests ar ON ae.user_id = ar.user_id
        WHERE ae.timestamp >= NOW() - INTERVAL '24 hours'
      `;
      
      const result = await this.dbService.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Failed to get system analytics:', error);
      return {
        active_users: 0,
        total_events: 0,
        avg_response_time: 0
      };
    }
  }
} 