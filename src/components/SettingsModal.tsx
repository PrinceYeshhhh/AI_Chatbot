import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { ApiConfig } from '../types';
import { chatService } from '../services/chatService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ApiConfig>(chatService.getApiConfig());
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setConfig(chatService.getApiConfig());
      setErrors({});
      setSaved(false);
    }
  }, [isOpen]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.endpoint.trim()) {
      newErrors.endpoint = 'API endpoint is required';
    } else if (!config.endpoint.startsWith('/') && !config.endpoint.startsWith('http')) {
      newErrors.endpoint = 'Endpoint must start with / or http';
    }

    if (!config.model.trim()) {
      newErrors.model = 'Model selection is required';
    }

    if (config.temperature < 0 || config.temperature > 2) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    if (config.maxTokens < 1 || config.maxTokens > 4000) {
      newErrors.maxTokens = 'Max tokens must be between 1 and 4000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;

    setIsLoading(true);
    try {
      // Simulate API validation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      chatService.updateApiConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultConfig: ApiConfig = {
      endpoint: '/api/chat',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000
    };
    setConfig(defaultConfig);
    setErrors({});
    setSaved(false);
  };

  const handleClose = () => {
    setErrors({});
    setSaved(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Chatbot Settings</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* API Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                  <input
                    type="text"
                    value={config.endpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                      errors.endpoint ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="/api/chat"
                  />
                  {errors.endpoint && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.endpoint}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter your API key (optional for demo)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                      errors.model ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                  </select>
                  {errors.model && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.model}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature ({config.temperature})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                    {errors.temperature && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.temperature}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 0 }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                        errors.maxTokens ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      min="1"
                      max="4000"
                    />
                    {errors.maxTokens && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.maxTokens}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance & Integration</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">API Integration Guide</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    To integrate this chatbot with your mobile app or web platform:
                  </p>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Use the configured endpoint above</p>
                    <p>• Include your API key in the Authorization header</p>
                    <p>• Send POST requests with conversation context</p>
                    <p>• Handle typing indicators and message status</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">React Native Integration</h4>
                  <p className="text-sm text-green-800">
                    This interface is fully compatible with React Native. Use the same components 
                    and services with minimal modifications for your mobile app.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-200 ${
              saved 
                ? 'bg-green-600 text-white' 
                : isLoading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};