import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Check, AlertCircle, Sun, Moon, Monitor, Palette, Volume2, VolumeX, Eye, EyeOff, Smartphone, Monitor as Desktop } from 'lucide-react';
import { ApiConfig } from '../types';
import { chatService } from '../services/chatService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ApiConfig>(chatService.getApiConfig());
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Settings>({
    theme: 'auto',
    fontSize: 'medium',
    soundEnabled: true,
    animationsEnabled: true,
    highContrast: false,
    reducedMotion: false,
    compactMode: false
  });
  const [activeTab, setActiveTab] = useState<'appearance' | 'accessibility' | 'notifications' | 'advanced'>('appearance');

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

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Here you would typically save to localStorage or send to backend
    console.log(`Setting updated: ${key} = ${value}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'accessibility', label: 'Accessibility', icon: Eye },
            { id: 'notifications', label: 'Notifications', icon: Volume2 },
            { id: 'advanced', label: 'Advanced', icon: Monitor }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright' },
                      { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
                      { value: 'auto', label: 'Auto', icon: Monitor, description: 'Follows system' }
                    ].map(({ value, label, icon: Icon, description }) => (
                      <button
                        key={value}
                        onClick={() => updateSetting('theme', value as any)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          settings.theme === value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="font-medium">{label}</span>
                        </div>
                        <p className="text-sm text-gray-500">{description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Font Size</h3>
                  <div className="flex items-center space-x-4">
                    {[
                      { value: 'small', label: 'Small', size: 'text-sm' },
                      { value: 'medium', label: 'Medium', size: 'text-base' },
                      { value: 'large', label: 'Large', size: 'text-lg' }
                    ].map(({ value, label, size }) => (
                      <button
                        key={value}
                        onClick={() => updateSetting('fontSize', value as any)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          settings.fontSize === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span className={size}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Compact Mode</h4>
                    <p className="text-sm text-gray-500">Reduce spacing for more content</p>
                  </div>
                  <button
                    onClick={() => updateSetting('compactMode', !settings.compactMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.compactMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">High Contrast</h4>
                    <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                  </div>
                  <button
                    onClick={() => updateSetting('highContrast', !settings.highContrast)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Reduced Motion</h4>
                    <p className="text-sm text-gray-500">Minimize animations and transitions</p>
                  </div>
                  <button
                    onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Animations</h4>
                    <p className="text-sm text-gray-500">Enable smooth animations and transitions</p>
                  </div>
                  <button
                    onClick={() => updateSetting('animationsEnabled', !settings.animationsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.animationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                    <p className="text-sm text-gray-500">Play sounds for new messages</p>
                  </div>
                  <button
                    onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.soundEnabled && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Test Sound</h4>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Play Test Sound
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Export Settings</h4>
                  <p className="text-sm text-gray-500 mb-3">Download your current settings as a backup</p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Export Settings
                  </button>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Reset to Defaults</h4>
                  <p className="text-sm text-red-700 mb-3">This will reset all settings to their default values</p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Reset Settings
                  </button>
                </div>
              </div>
            )}
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