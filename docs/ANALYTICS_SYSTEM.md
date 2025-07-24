# Advanced Analytics Dashboard

## Overview

The Advanced Analytics Dashboard provides comprehensive tracking and visualization of user activity, file uploads, chat history, and LLM usage for the AI Chatbot platform. This system enables administrators to monitor system performance, user behavior, and cost management in real-time.

## Features

### 📊 Core Analytics
- **User Activity Tracking**: Monitor login/logout events, user registrations, and session data
- **File Upload Analytics**: Track document, image, and audio uploads with processing status
- **Chat Message Analytics**: Monitor conversation patterns and message volumes
- **LLM Usage Tracking**: Detailed token usage and cost estimation
- **Agent Tool Usage**: Track tool calls and execution metrics
- **Error Monitoring**: Comprehensive error logging and analysis

### 📈 Dashboard Components
- **Summary Cards**: Key metrics at a glance (total events, users, uploads, messages)
- **LLM Usage Cards**: Token consumption and cost tracking
- **Interactive Charts**: File uploads vs chat messages, event breakdowns
- **Top Users Table**: User activity rankings and individual metrics
- **Storage Statistics**: File storage usage and vector database metrics

### 🔧 Technical Features
- **Real-time Updates**: Auto-refresh capabilities and live data
- **Date Range Filtering**: 7, 30, or 90-day analysis periods
- **Export Functionality**: CSV export for external analysis
- **Admin-only Access**: Role-based security with admin privileges
- **Responsive Design**: Mobile-friendly dashboard interface

## Database Schema

### Analytics Events Table
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'file_upload', 'file_delete', 'chat_message', 'chat_session_start',
      'chat_session_end', 'agent_tool_call', 'login', 'logout',
      'user_registration', 'llm_api_call', 'embedding_generated',
      'vector_search', 'error_occurred', 'workspace_created',
      'workspace_joined', 'file_processed', 'file_processing_failed'
    )
  ),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions
- `get_analytics_summary()`: Overall statistics for date ranges
- `get_daily_analytics()`: Daily breakdown of metrics
- `get_top_users_by_activity()`: User activity rankings
- `get_event_type_breakdown()`: Event type distribution

## API Endpoints

### Analytics Routes
```
GET /api/analytics/summary          # Get analytics summary
GET /api/analytics/daily            # Get daily analytics
GET /api/analytics/top-users        # Get top users by activity
GET /api/analytics/event-breakdown  # Get event type breakdown
GET /api/analytics/realtime         # Get real-time analytics (24h)
GET /api/analytics/storage          # Get storage statistics
GET /api/analytics/export           # Export analytics data (CSV/JSON)
GET /api/analytics/user-activity/:userId  # Get user activity timeline
```

### Query Parameters
- `start_date`: Start date for analysis (ISO string)
- `end_date`: End date for analysis (ISO string)
- `limit`: Number of results to return (default: 10)
- `format`: Export format ('csv' or 'json')

## Frontend Implementation

### Analytics Dashboard
- **Location**: `/admin/analytics`
- **Access**: Admin users only
- **Components**: 
  - Summary cards with key metrics
  - Interactive charts using custom components
  - Data tables with sorting and filtering
  - Export functionality

### Chart Components
- **FileUploadChart**: Custom chart for file upload vs chat message comparison
- **TokenChart**: Area chart for token usage over time (planned)
- **EventBreakdown**: Bar chart for event type distribution

## Backend Implementation

### Analytics Utility (`utils/analytics.ts`)
```typescript
// Core logging functions
logAnalyticsEvent(event: AnalyticsEvent): Promise<void>
logLLMUsage(userId: string, usage: LLMUsageData): Promise<void>
logFileUpload(userId: string, fileId: string, ...): Promise<void>
logChatMessage(userId: string, messageId: string, ...): Promise<void>

// Query functions
getAnalyticsSummary(startDate?: Date, endDate?: Date): Promise<any>
getDailyAnalytics(startDate?: Date, endDate?: Date): Promise<any[]>
getTopUsersByActivity(limit?: number, ...): Promise<any[]>
getEventTypeBreakdown(startDate?: Date, endDate?: Date): Promise<any[]>
```

### Integration Points
- **Chat Routes**: Log chat messages and LLM usage
- **Upload Routes**: Log file uploads and processing status
- **Auth Routes**: Log login/logout events
- **Agent Tools**: Log tool calls and execution metrics

## Cost Tracking

### LLM Model Pricing
```typescript
const MODEL_PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
  'text-embedding-ada-002': { input: 0.0001, output: 0 },
  'default': { input: 0.01, output: 0.02 }
};
```

### Cost Calculation
- Automatic cost estimation based on token usage
- Support for different model pricing tiers
- Real-time cost tracking and reporting

## Security & Privacy

### Row Level Security (RLS)
- Users can only view their own analytics events
- Admins can view all analytics data
- Secure API endpoints with authentication

### Data Protection
- No sensitive user data in analytics events
- Metadata stored as JSONB for flexibility
- Automatic data retention policies (configurable)

## Usage Examples

### Logging Events
```typescript
// Log a file upload
await logFileUpload(
  userId,
  fileId,
  fileName,
  fileSize,
  fileType,
  'processed',
  { sessionId, workspaceId }
);

// Log LLM usage
await logLLMUsage(userId, {
  model: 'gpt-4',
  promptTokens: 1000,
  completionTokens: 500,
  totalTokens: 1500,
  costEstimate: 0.06,
  responseTime: 2000
});
```

### Querying Analytics
```typescript
// Get summary for last 30 days
const summary = await getAnalyticsSummary();

// Get daily breakdown
const dailyData = await getDailyAnalytics();

// Get top users
const topUsers = await getTopUsersByActivity(10);
```

## Testing

### Test Coverage
- Unit tests for all analytics functions
- Mock Supabase client for testing
- Error handling and edge case coverage

### Test Commands
```bash
# Run analytics tests
npm test analytics.test.ts

# Run all tests
npm test
```

## Deployment

### Environment Variables
```bash
# Required for analytics
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional analytics settings
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_ENABLED=true
```

### Database Migration
```bash
# Apply analytics migration
supabase db push

# Or run manually
psql -d your_db -f supabase/migrations/20250116_create_analytics_events.sql
```

## Future Enhancements

### Planned Features
- **Real-time WebSocket Updates**: Live dashboard updates
- **Advanced Charting**: More sophisticated visualizations
- **Custom Reports**: User-defined analytics reports
- **Alert System**: Automated alerts for usage thresholds
- **Multi-tenant Analytics**: Workspace-level analytics
- **Predictive Analytics**: Usage forecasting and trends

### Performance Optimizations
- **Caching Layer**: Redis-based analytics caching
- **Aggregation Jobs**: Background data aggregation
- **Partitioning**: Time-based table partitioning
- **Index Optimization**: Query performance tuning

## Troubleshooting

### Common Issues
1. **Missing Analytics Data**: Check if events are being logged
2. **Permission Errors**: Verify admin role assignment
3. **Chart Rendering Issues**: Check browser console for errors
4. **Export Failures**: Verify file permissions and disk space

### Debug Commands
```sql
-- Check analytics events
SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 10;

-- Check user roles
SELECT id, email, raw_user_meta_data FROM auth.users;

-- Check function permissions
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'get_analytics%';
```

## Contributing

### Adding New Event Types
1. Update the `AnalyticsEventType` enum
2. Add database constraint for the new event type
3. Create logging function for the new event
4. Update tests and documentation

### Adding New Metrics
1. Extend database functions to include new metrics
2. Update frontend dashboard components
3. Add appropriate tests
4. Update documentation

## Support

For questions or issues with the analytics system:
1. Check the troubleshooting section
2. Review the test files for examples
3. Check the database migration logs
4. Contact the development team

---

*This analytics system provides comprehensive monitoring and insights for the AI Chatbot platform, enabling data-driven decisions and cost optimization.* 

# Analytics & Monitoring for Universal File Intelligence

## Logging
- All file uploads, queries, errors, and deletions are logged (backend and Python microservice).
- Logs include: user_id (hashed), file_id, file_type, action, timestamp, status, error (if any).

## Prometheus/Grafana Integration
- Expose metrics endpoint (e.g., `/metrics`) in backend and microservice.
- Example Prometheus metrics:
  - `file_upload_count{file_type="pdf"}`
  - `file_type_distribution`
  - `query_count`
  - `error_count`
  - `rag_latency_seconds`
- Example Grafana dashboard:
  - File uploads over time
  - RAG query latency
  - Error rates by type
  - Active users/files

## Umami (Frontend Analytics)
- Optionally integrate [Umami](https://umami.is/) for privacy-friendly frontend analytics.
- Track page views, upload button clicks, chat queries, errors.

## Enabling/Disabling Analytics
- Set `ENABLE_ANALYTICS=true` in `.env` to enable advanced analytics.
- All analytics are anonymized and scoped to the current user.

## Privacy
- No personal data is stored in analytics.
- All logs/metrics use hashed user IDs and file IDs.

## Example Prometheus Config
```yaml
scrape_configs:
  - job_name: 'ai_chatbot_backend'
    static_configs:
      - targets: ['localhost:3001']
  - job_name: 'nlp_microservice'
    static_configs:
      - targets: ['localhost:8000']
```

## Example Grafana Dashboard
- Import the provided dashboard JSON from `docs/grafana_dashboard.json`.
- Customize panels for your use case. 