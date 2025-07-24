import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';

interface AnalyticsData {
  systemStats: {
    totalUsers: number;
    totalFiles: number;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    activeUsers: number;
  };
  dailyStats: Array<{
    date: string;
    fileUploads: number;
    messages: number;
    tokens: number;
    cost: number;
    activeUsers: number;
  }>;
  topUsers: Array<{
    user_id: string;
    user_email: string;
    total_events: number;
    file_uploads: number;
    messages: number;
    tokens_used: number;
    cost_estimate: number;
  }>;
  eventCounts: Array<{
    event_type: string;
    count: number;
    unique_users: number;
  }>;
  storageStats: {
    totalFiles: number;
    totalStorageBytes: number;
    totalStorageMB: number;
    storageByType: Record<string, number>;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role } = useWorkspace();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
  }, [role]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, dailyRes, usersRes, eventsRes, storageRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get(`/analytics/daily?days=${timeRange}`),
        api.get('/analytics/top-users?limit=10'),
        api.get('/analytics/events'),
        api.get('/analytics/storage')
      ]);

      setData({
        systemStats: statsRes.data.data,
        dailyStats: dailyRes.data.data,
        topUsers: usersRes.data.data,
        eventCounts: eventsRes.data.data,
        storageStats: storageRes.data.data
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchAnalytics();
  }, [role, timeRange, fetchAnalytics, navigate]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/analytics/export?format=${format}&days=${timeRange}`);
      
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export analytics data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Access Error</h2>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-yellow-800 text-lg font-semibold mb-2">No Data Available</h2>
            <p className="text-yellow-600">Analytics data is not available at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={autoRefresh ? "primary" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
              
              <Button
                onClick={() => handleExport('csv')}
                variant="outline"
                size="sm"
              >
                Export CSV
              </Button>
              
              <Button
                onClick={() => handleExport('json')}
                variant="outline"
                size="sm"
              >
                Export JSON
              </Button>
            </div>
          </div>
        </div>

        {/* System Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Badge variant="secondary">{data.systemStats.totalUsers}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.systemStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active users: {data.systemStats.activeUsers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <Badge variant="secondary">{data.systemStats.totalFiles}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.systemStats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                Storage: {data.storageStats.totalStorageMB.toFixed(1)} MB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <Badge variant="secondary">{data.systemStats.totalMessages}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.systemStats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                Chat activity tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
              <Badge variant="secondary">{data.systemStats.totalTokens.toLocaleString()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.systemStats.totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {data.systemStats.totalTokens.toLocaleString()} tokens used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity (Last {timeRange} days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.dailyStats.slice(-7).map((day, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <div className="flex gap-4 text-sm">
                      <span>📁 {day.fileUploads}</span>
                      <span>💬 {day.messages}</span>
                      <span>👥 {day.activeUsers}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.eventCounts.map((event, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm capitalize">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline">{event.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Users */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Users by Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Messages</th>
                    <th className="text-left py-2">Files</th>
                    <th className="text-left py-2">Tokens</th>
                    <th className="text-left py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topUsers.map((user, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{user.user_email}</td>
                      <td className="py-2">{user.messages}</td>
                      <td className="py-2">{user.file_uploads}</td>
                      <td className="py-2">{user.tokens_used.toLocaleString()}</td>
                      <td className="py-2">${user.cost_estimate.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 