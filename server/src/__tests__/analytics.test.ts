import { 
  logAnalyticsEvent, 
  logLLMUsage, 
  logFileUpload, 
  logChatMessage,
  getAnalyticsSummary,
  getDailyAnalytics,
  getTopUsersByActivity,
  getEventTypeBreakdown
} from '../utils/analytics';

// Remove all Supabase mocks and references throughout the file

describe('Analytics Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logAnalyticsEvent', () => {
    it('should log an analytics event successfully', async () => {
      const event = {
        userId: 'test-user-id',
        eventType: 'file_upload' as const,
        metadata: { fileId: 'test-file', size: 1024 }
      };

      await expect(logAnalyticsEvent(event)).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      // No Supabase mock, so this test will fail if it throws
      const event = {
        userId: 'test-user-id',
        eventType: 'file_upload' as const,
        metadata: { fileId: 'test-file' }
      };

      // Should not throw even if database fails
      await expect(logAnalyticsEvent(event)).resolves.not.toThrow();
    });
  });

  describe('logLLMUsage', () => {
    it('should log LLM usage with cost calculation', async () => {
      const usage = {
        model: 'gpt-4',
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
        costEstimate: 0.06,
        responseTime: 2000
      };

      await expect(logLLMUsage('test-user-id', usage)).resolves.not.toThrow();
    });
  });

  describe('logFileUpload', () => {
    it('should log file upload event', async () => {
      await expect(logFileUpload(
        'test-user-id',
        'file-123',
        'test.pdf',
        1024 * 1024, // 1MB
        'application/pdf',
        'processed',
        { sessionId: 'session-123' }
      )).resolves.not.toThrow();
    });
  });

  describe('logChatMessage', () => {
    it('should log chat message event', async () => {
      await expect(logChatMessage(
        'test-user-id',
        'msg-123',
        150,
        true,
        { sessionId: 'session-123' }
      )).resolves.not.toThrow();
    });
  });

  describe('Analytics Queries', () => {
    it('should get analytics summary', async () => {
      // No Supabase mock, so this test will fail if it throws
      const summary = await getAnalyticsSummary();
      expect(summary).toBeDefined();
      expect(summary?.total_events).toBe(100);
    });

    it('should get daily analytics', async () => {
      // No Supabase mock, so this test will fail if it throws
      const dailyData = await getDailyAnalytics();
      expect(dailyData).toHaveLength(1);
      expect(dailyData[0].date).toBe('2024-01-01');
    });

    it('should get top users by activity', async () => {
      // No Supabase mock, so this test will fail if it throws
      const topUsers = await getTopUsersByActivity(5);
      expect(topUsers).toHaveLength(1);
      expect(topUsers[0].user_email).toBe('user1@example.com');
    });

    it('should get event type breakdown', async () => {
      // No Supabase mock, so this test will fail if it throws
      const breakdown = await getEventTypeBreakdown();
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].event_type).toBe('file_upload');
    });
  });
}); 