import React, { useState, useEffect } from 'react';
import { Brain, Zap, Database, FileText, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { chatService } from '../services/chatService';

interface BrainStatus {
  smartBrain: {
    status: 'healthy' | 'error' | 'initializing';
    llmAvailable: boolean;
    embeddingsAvailable: boolean;
    vectorStoreAvailable: boolean;
    activeSessions: number;
  };
  vectorStore: {
    status: 'healthy' | 'error' | 'fallback';
    collectionName?: string;
    documentCount?: number;
    embeddingModel?: string;
    error?: string;
  };
  capabilities: {
    documentProcessing: boolean;
    ragEnabled: boolean;
    streaming: boolean;
    multiModal: boolean;
    realTimeLearning: boolean;
  };
  timestamp: string;
}

interface SessionStats {
  messageCount: number;
  fileCount: number;
  currentMode: string;
  lastActivity: Date | null;
}

const SmartBrainStatus: React.FC = () => {
  const [brainStatus, setBrainStatus] = useState<BrainStatus | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBrainStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await chatService.getBrainStatus();
      setBrainStatus(status);
      
      // Get session stats
      const sessionId = chatService.getSessionId();
      if (sessionId) {
        const stats = await chatService.getSessionStats(sessionId);
        setSessionStats(stats.sessionStats);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brain status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrainStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchBrainStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'initializing':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'initializing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center space-x-2">
          <Activity className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading Smart Brain status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span>Error: {error}</span>
        </div>
        <button
          onClick={fetchBrainStatus}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!brainStatus) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <span>No status information available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Brain Status</h3>
            <p className="text-sm text-gray-600">AI Intelligence System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(brainStatus.smartBrain.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(brainStatus.smartBrain.status)}`}>
            {brainStatus.smartBrain.status}
          </span>
        </div>
      </div>

      {/* Core Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-gray-900">LLM Service</span>
          </div>
          <div className="flex items-center space-x-2">
            {brainStatus.smartBrain.llmAvailable ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {brainStatus.smartBrain.llmAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-gray-900">Vector Store</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(brainStatus.vectorStore.status)}
            <span className="text-sm text-gray-600">
              {brainStatus.vectorStore.status === 'healthy' ? 'Healthy' : 
               brainStatus.vectorStore.status === 'fallback' ? 'Fallback Mode' : 'Error'}
            </span>
          </div>
          {brainStatus.vectorStore.documentCount !== undefined && (
            <div className="text-xs text-gray-500 mt-1">
              {brainStatus.vectorStore.documentCount} documents
            </div>
          )}
        </div>
      </div>

      {/* Capabilities */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Capabilities</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(brainStatus.capabilities).map(([capability, enabled]) => (
            <div key={capability} className="flex items-center space-x-2">
              {enabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600 capitalize">
                {capability.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Information */}
      {sessionStats && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Current Session</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900">Files</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{sessionStats.fileCount}</span>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Messages</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{sessionStats.messageCount}</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Mode: <span className="font-medium capitalize">{sessionStats.currentMode}</span>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}</span>
          <button
            onClick={fetchBrainStatus}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartBrainStatus; 