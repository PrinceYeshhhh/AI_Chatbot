import axios from 'axios';

export interface AnalyticsEvent {
  event: string;
  url: string;
  title?: string;
  referrer?: string;
  data?: any;
}

export interface AnalyticsConfig {
  websiteId: string;
  baseUrl: string;
  apiKey?: string;
}

export class UmamiAnalyticsService {
  private config: AnalyticsConfig;

  constructor() {
    this.config = {
      websiteId: process.env['UMAMI_WEBSITE_ID']!,
      baseUrl: process.env['UMAMI_BASE_URL'] || 'https://umami.is',
      apiKey: process.env['UMAMI_API_KEY']
    };
  }

  async trackEvent(event: string, userId?: string, data?: any): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event,
        url: '/api/analytics',
        title: 'AI Chatbot Analytics',
        data: {
          userId,
          timestamp: new Date().toISOString(),
          ...data
        }
      };

      // Send to Umami
      await axios.post(`${this.config.baseUrl}/api/collect`, {
        type: 'event',
        payload: analyticsEvent
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Umami analytics error:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  async trackPageView(url: string, title?: string, referrer?: string): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event: 'pageview',
        url,
        title,
        referrer
      };

      await axios.post(`${this.config.baseUrl}/api/collect`, {
        type: 'pageview',
        payload: analyticsEvent
      });
    } catch (error) {
      console.error('Umami pageview error:', error);
    }
  }

  async trackChatMessage(userId: string, messageLength: number, model: string): Promise<void> {
    await this.trackEvent('chat_message', userId, {
      messageLength,
      model,
      category: 'chat'
    });
  }

  async trackFileUpload(userId: string, fileSize: number, fileType: string): Promise<void> {
    await this.trackEvent('file_upload', userId, {
      fileSize,
      fileType,
      category: 'file'
    });
  }

  async trackEmbeddingGeneration(userId: string, embeddingCount: number): Promise<void> {
    await this.trackEvent('embedding_generation', userId, {
      embeddingCount,
      category: 'ai'
    });
  }

  async trackError(userId: string, errorType: string, errorMessage: string): Promise<void> {
    await this.trackEvent('error', userId, {
      errorType,
      errorMessage,
      category: 'error'
    });
  }

  async trackUserAction(userId: string, action: string, data?: any): Promise<void> {
    await this.trackEvent('user_action', userId, {
      action,
      ...data,
      category: 'user'
    });
  }

  async getAnalyticsData(startDate: string, endDate: string): Promise<any> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Umami API key not configured');
      }

      const response = await axios.get(`${this.config.baseUrl}/api/websites/${this.config.websiteId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        params: {
          startAt: startDate,
          endAt: endDate
        }
      });

      return response.data;
    } catch (error) {
      console.error('Umami get analytics error:', error);
      return null;
    }
  }

  async getWebsiteStats(): Promise<any> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Umami API key not configured');
      }

      const response = await axios.get(`${this.config.baseUrl}/api/websites/${this.config.websiteId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Umami get website stats error:', error);
      return null;
    }
  }
} 