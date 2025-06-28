import { PerformanceMonitor } from '../utils/performanceMonitor';

interface ErrorEvent {
  id: string;
  timestamp: Date;
  error: Error | string;
  context: {
    url: string;
    userAgent: string;
    viewport: { width: number; height: number };
    performance: {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
      timing?: { navigationStart: number; loadEventEnd: number };
    };
    session: {
      sessionId: string;
      userId?: string;
      pageViews: number;
    };
    component?: {
      name: string;
      props?: Record<string, unknown>;
      state?: Record<string, unknown>;
    };
    stack?: string;
    breadcrumbs: Array<{
      timestamp: Date;
      category: string;
      message: string;
      data?: Record<string, unknown>;
    }>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  metadata?: Record<string, unknown>;
}

interface ErrorReport {
  events: ErrorEvent[];
  summary: {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByType: Record<string, number>;
    errorsByComponent: Record<string, number>;
    averageErrorsPerHour: number;
    timeRange: { start: Date; end: Date };
  };
}

interface ErrorTrackingOptions {
  enabled?: boolean;
  sampleRate?: number; // 0-1, percentage of errors to track
  maxEvents?: number;
  flushInterval?: number; // milliseconds
  endpoint?: string;
  apiKey?: string;
  environment?: 'development' | 'staging' | 'production';
  enableBreadcrumbs?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableSessionTracking?: boolean;
}

/**
 * Advanced error tracking service with comprehensive monitoring
 */
class ErrorTrackingService {
  private events: ErrorEvent[] = [];
  private options: ErrorTrackingOptions;
  private sessionId: string;
  private pageViews: number = 0;
  private breadcrumbs: Array<{
    timestamp: Date;
    category: string;
    message: string;
    data?: Record<string, unknown>;
  }> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(options: ErrorTrackingOptions = {}) {
    this.options = {
      enabled: true,
      sampleRate: 1.0,
      maxEvents: 1000,
      flushInterval: 30000, // 30 seconds
      endpoint: '/api/errors',
      environment: 'development',
      enableBreadcrumbs: true,
      enablePerformanceMonitoring: true,
      enableSessionTracking: true,
      ...options
    };

    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize error tracking
   */
  private initialize(): void {
    if (!this.options.enabled || this.isInitialized) return;

    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Set up performance monitoring
      if (this.options.enablePerformanceMonitoring) {
        this.setupPerformanceMonitoring();
      }

      // Set up session tracking
      if (this.options.enableSessionTracking) {
        this.setupSessionTracking();
      }

      // Set up automatic flushing
      this.setupAutoFlush();

      this.isInitialized = true;
      console.log('🚀 Error tracking service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize error tracking:', error);
    }
  }

  /**
   * Track an error
   */
  public trackError(
    error: Error | string,
    context?: {
      component?: string;
      props?: Record<string, unknown>;
      state?: Record<string, unknown>;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): void {
    if (!this.options.enabled) return;

    // Apply sampling
    if (Math.random() > this.options.sampleRate!) {
      return;
    }

    const errorEvent: ErrorEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        performance: this.getPerformanceData(),
        session: {
          sessionId: this.sessionId,
          pageViews: this.pageViews
        },
        component: context?.component ? {
          name: context.component,
          props: context.props,
          state: context.state
        } : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        breadcrumbs: [...this.breadcrumbs]
      },
      severity: context?.severity || 'medium',
      tags: context?.tags || [],
      metadata: context?.metadata
    };

    this.events.push(errorEvent);

    // Trim events if we exceed max
    if (this.events.length > this.options.maxEvents!) {
      this.events = this.events.slice(-this.options.maxEvents!);
    }

    // Log to console in development
    if (this.options.environment === 'development') {
      console.error('🚨 Error tracked:', errorEvent);
    }

    // Immediate flush for critical errors
    if (errorEvent.severity === 'critical') {
      this.flush();
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  public addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.options.enabled || !this.options.enableBreadcrumbs) return;

    this.breadcrumbs.push({
      timestamp: new Date(),
      category,
      message,
      data
    });

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  /**
   * Set user context
   */
  public setUser(userId: string, userData?: Record<string, unknown>): void {
    this.addBreadcrumb('user', 'User context set', { userId, ...userData });
  }

  /**
   * Set component context
   */
  public setComponent(
    componentName: string,
    props?: Record<string, unknown>,
    state?: Record<string, unknown>
  ): void {
    this.addBreadcrumb('component', `Component: ${componentName}`, { props, state });
  }

  /**
   * Flush events to server
   */
  public async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const timer = PerformanceMonitor.startTimer('error-tracking-flush');

    try {
      const eventsToSend = [...this.events];
      this.events = [];

      if (this.options.endpoint) {
        await this.sendToServer(eventsToSend);
      }

      // Store in localStorage as backup
      this.storeInLocalStorage(eventsToSend);

      timer();
    } catch (error) {
      console.error('Failed to flush error events:', error);
      // Restore events if flush failed
      this.events.unshift(...this.events);
    }
  }

  /**
   * Get error report
   */
  public getErrorReport(timeRange?: { start: Date; end: Date }): ErrorReport {
    const now = new Date();
    const start = timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = timeRange?.end || now;

    const filteredEvents = this.events.filter(
      event => event.timestamp >= start && event.timestamp <= end
    );

    const errorsBySeverity: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};

    for (const event of filteredEvents) {
      // Count by severity
      errorsBySeverity[event.severity] = (errorsBySeverity[event.severity] || 0) + 1;

      // Count by error type
      const errorType = event.error instanceof Error ? event.error.name : 'String';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

      // Count by component
      if (event.context.component) {
        errorsByComponent[event.context.component.name] = 
          (errorsByComponent[event.context.component.name] || 0) + 1;
      }
    }

    const hoursInRange = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return {
      events: filteredEvents,
      summary: {
        totalErrors: filteredEvents.length,
        errorsBySeverity,
        errorsByType,
        errorsByComponent,
        averageErrorsPerHour: hoursInRange > 0 ? filteredEvents.length / hoursInRange : 0,
        timeRange: { start, end }
      }
    };
  }

  /**
   * Clear all events
   */
  public clear(): void {
    this.events = [];
    this.breadcrumbs = [];
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          severity: 'high',
          tags: ['unhandled-rejection'],
          metadata: { reason: event.reason }
        }
      );
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(
        new Error(`JavaScript Error: ${event.message}`),
        {
          severity: 'high',
          tags: ['javascript-error'],
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      );
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.trackError(
          new Error(`Resource Loading Error: ${target.tagName}`),
          {
            severity: 'medium',
            tags: ['resource-error'],
            metadata: {
              tagName: target.tagName,
              src: (target as any).src,
              href: (target as any).href
            }
          }
        );
      }
    }, true);
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.addBreadcrumb(
                'performance',
                `Long task detected: ${entry.duration.toFixed(2)}ms`,
                { duration: entry.duration, name: entry.name }
              );
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Failed to set up long task monitoring:', error);
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
          this.addBreadcrumb(
            'performance',
            'High memory usage detected',
            {
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit
            }
          );
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Set up session tracking
   */
  private setupSessionTracking(): void {
    // Track page views
    let lastUrl = window.location.href;
    
    const trackPageView = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        this.pageViews++;
        this.addBreadcrumb('navigation', 'Page view', { url: currentUrl });
        lastUrl = currentUrl;
      }
    };

    // Track initial page view
    trackPageView();

    // Track navigation changes
    window.addEventListener('popstate', trackPageView);
    
    // Override pushState and replaceState to track programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      trackPageView();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      trackPageView();
    };
  }

  /**
   * Set up automatic flushing
   */
  private setupAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }

  /**
   * Send events to server
   */
  private async sendToServer(events: ErrorEvent[]): Promise<void> {
    if (!this.options.endpoint) return;

    const response = await fetch(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.options.apiKey && { 'Authorization': `Bearer ${this.options.apiKey}` })
      },
      body: JSON.stringify({
        events,
        environment: this.options.environment,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send error events: ${response.status}`);
    }
  }

  /**
   * Store events in localStorage as backup
   */
  private storeInLocalStorage(events: ErrorEvent[]): void {
    try {
      const key = 'error_tracking_backup';
      const existing = localStorage.getItem(key);
      const existingEvents = existing ? JSON.parse(existing) : [];
      
      const allEvents = [...existingEvents, ...events];
      
      // Keep only last 100 events
      const trimmedEvents = allEvents.slice(-100);
      
      localStorage.setItem(key, JSON.stringify(trimmedEvents));
    } catch (error) {
      console.warn('Failed to store error events in localStorage:', error);
    }
  }

  /**
   * Get performance data
   */
  private getPerformanceData(): ErrorEvent['context']['performance'] {
    const data: ErrorEvent['context']['performance'] = {};

    if ('memory' in performance) {
      data.memory = (performance as any).memory;
    }

    if ('timing' in performance) {
      data.timing = (performance as any).timing;
    }

    return data;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.flush();
    this.clear();
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService({
  environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
});

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    errorTrackingService.flush();
  });
} 