interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
    this.setupPerformanceObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserId(): void {
    try {
      const saved = localStorage.getItem('chatbot-user-id');
      if (saved) {
        this.userId = saved;
      }
    } catch (error) {
      console.warn('Failed to load user ID:', error);
    }
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackPerformance(entry);
          }
        });
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Failed to setup performance observer:', error);
      }
    }
  }

  trackEvent(category: string, action: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      event: 'interaction',
      category,
      action,
      label,
      value,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId,
      metadata
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  trackPageView(page: string): void {
    this.trackEvent('navigation', 'page_view', page);
  }

  trackMessageSent(messageLength: number, hasAttachments: boolean = false): void {
    this.trackEvent('chat', 'message_sent', undefined, messageLength, {
      hasAttachments,
      timestamp: new Date().toISOString()
    });
  }

  trackFileUpload(fileType: string, fileSize: number, success: boolean): void {
    this.trackEvent('upload', success ? 'file_upload_success' : 'file_upload_failed', fileType, fileSize, {
      fileType,
      fileSize,
      success,
      timestamp: new Date().toISOString()
    });
  }

  trackVoiceInput(transcriptLength: number, success: boolean): void {
    this.trackEvent('voice', success ? 'voice_input_success' : 'voice_input_failed', undefined, transcriptLength, {
      transcriptLength,
      success,
      timestamp: new Date().toISOString()
    });
  }

  trackError(error: Error, context: string): void {
    this.trackEvent('error', 'application_error', context, undefined, {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  trackPerformance(entry: PerformanceEntry): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration,
      unit: 'ms',
      timestamp: new Date()
    };

    this.performanceMetrics.push(metric);
    this.sendPerformanceMetric(metric);
  }

  trackConversationStart(): void {
    this.trackEvent('conversation', 'conversation_started');
  }

  trackConversationEnd(messageCount: number, duration: number): void {
    this.trackEvent('conversation', 'conversation_ended', undefined, messageCount, {
      messageCount,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  trackFeatureUsage(feature: string): void {
    this.trackEvent('feature', 'feature_used', feature);
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to analytics endpoint if available
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  private async sendPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
    try {
      localStorage.setItem('chatbot-user-id', userId);
    } catch (error) {
      console.warn('Failed to save user ID:', error);
    }
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  clearData(): void {
    this.events = [];
    this.performanceMetrics = [];
  }

  // Batch send all events
  async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: this.events,
          sessionId: this.sessionId,
          userId: this.userId
        })
      });
      this.events = [];
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 