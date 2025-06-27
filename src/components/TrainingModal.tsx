import React, { useState, useRef } from 'react';
import { X, Upload, Plus, FileText, Brain, Download, Trash2, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { chatService } from '../services/chatService';
import { TrainingData } from '../types';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrainingModal({ isOpen, onClose }: TrainingModalProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'examples' | 'stats'>('files');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trainingData, setTrainingData] = useState<TrainingData[]>(chatService.getTrainingData());
  const [newExample, setNewExample] = useState({
    input: '',
    expectedOutput: '',
    intent: ''
  });
  const [isAddingExample, setIsAddingExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file processing
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i + 1) / files.length) * 100);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add mock training data based on file
        const mockData = generateMockTrainingData(file);
        mockData.forEach(data => {
          chatService.addTrainingData(data.input, data.expectedOutput, data.intent);
        });
      }
      
      setTrainingData(chatService.getTrainingData());
      console.log('Files processed successfully:', files.map(f => f.name));
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const generateMockTrainingData = (file: File): Omit<TrainingData, 'id' | 'dateAdded'>[] => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    
    switch (fileType) {
      case 'pdf':
        return [
          {
            input: `What information is in ${baseName}?`,
            expectedOutput: `The document ${baseName} contains detailed information that has been processed and is now available for queries.`,
            intent: 'document_query',
            confidence: 0.95
          },
          {
            input: `Summarize ${baseName}`,
            expectedOutput: `Here's a summary of the key points from ${baseName}: [Content would be extracted and summarized here]`,
            intent: 'summarization',
            confidence: 0.92
          }
        ];
      case 'csv':
        return [
          {
            input: `Analyze the data in ${baseName}`,
            expectedOutput: `I've analyzed the CSV data from ${baseName}. The dataset contains various metrics and insights.`,
            intent: 'data_analysis',
            confidence: 0.98
          },
          {
            input: `What trends are in ${baseName}?`,
            expectedOutput: `Based on the data in ${baseName}, I can identify several key trends and patterns.`,
            intent: 'trend_analysis',
            confidence: 0.94
          }
        ];
      default:
        return [
          {
            input: `What's in the ${baseName} file?`,
            expectedOutput: `The file ${baseName} has been processed and its content is now available for analysis.`,
            intent: 'file_query',
            confidence: 0.90
          }
        ];
    }
  };

  const handleAddExample = async () => {
    if (!newExample.input.trim() || !newExample.expectedOutput.trim() || !newExample.intent.trim()) {
      return;
    }

    setIsAddingExample(true);
    try {
      chatService.addTrainingData(
        newExample.input.trim(),
        newExample.expectedOutput.trim(),
        newExample.intent.trim()
      );
      
      setTrainingData(chatService.getTrainingData());
      setNewExample({ input: '', expectedOutput: '', intent: '' });
    } catch (error) {
      console.error('Error adding training example:', error);
    } finally {
      setIsAddingExample(false);
    }
  };

  const handleDeleteExample = (id: string) => {
    chatService.removeTrainingData(id);
    setTrainingData(chatService.getTrainingData());
  };

  const handleExportData = () => {
    const data = chatService.exportTrainingData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = chatService.getTrainingStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Training Center
              </h2>
              <p className="text-sm text-gray-600">
                Enhance your AI with custom data and examples • {stats.totalExamples} examples trained
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'files'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import Files</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'examples'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Training Examples</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Statistics</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Upload Training Documents
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Drag and drop files here, or click to browse. Supported formats: PDF, TXT, CSV, MD, JSON
                    </p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Choose Files
                    </button>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.txt,.csv,.md,.json,.docx"
              />

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="font-medium text-blue-900">Processing files...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">{Math.round(uploadProgress)}% complete</p>
                </div>
              )}

              {/* Supported Formats */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Supported File Formats
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { ext: 'PDF', desc: 'Documents & Reports', color: 'bg-red-100 text-red-800' },
                    { ext: 'TXT', desc: 'Plain Text Files', color: 'bg-gray-100 text-gray-800' },
                    { ext: 'CSV', desc: 'Data & Spreadsheets', color: 'bg-green-100 text-green-800' },
                    { ext: 'MD', desc: 'Markdown Files', color: 'bg-blue-100 text-blue-800' },
                    { ext: 'JSON', desc: 'Structured Data', color: 'bg-yellow-100 text-yellow-800' },
                    { ext: 'DOCX', desc: 'Word Documents', color: 'bg-purple-100 text-purple-800' }
                  ].map((format) => (
                    <div key={format.ext} className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${format.color}`}>
                        {format.ext}
                      </span>
                      <span className="text-sm text-gray-600">{format.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Uploads */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recent Training Data</h4>
                <div className="space-y-2">
                  {trainingData.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {item.input}
                          </p>
                          <p className="text-xs text-gray-500">
                            Intent: {item.intent} • {item.dateAdded.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Trained
                        </span>
                        <button
                          onClick={() => handleDeleteExample(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {trainingData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No training data yet</p>
                      <p className="text-xs mt-1">Upload files or add examples to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-6">
              {/* Add Example Form */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Training Example
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Input
                    </label>
                    <textarea
                      value={newExample.input}
                      onChange={(e) => setNewExample(prev => ({ ...prev, input: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                      rows={3}
                      placeholder="Enter what a user might ask..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Response
                    </label>
                    <textarea
                      value={newExample.expectedOutput}
                      onChange={(e) => setNewExample(prev => ({ ...prev, expectedOutput: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                      rows={4}
                      placeholder="Enter the ideal response..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intent Category
                    </label>
                    <input
                      type="text"
                      value={newExample.intent}
                      onChange={(e) => setNewExample(prev => ({ ...prev, intent: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., greeting, question, help_request"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddExample}
                      disabled={isAddingExample || !newExample.input.trim() || !newExample.expectedOutput.trim() || !newExample.intent.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      {isAddingExample ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Adding...</span>
                        </div>
                      ) : (
                        'Add Example'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Examples */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Training Examples ({trainingData.length})</h4>
                  {trainingData.length > 0 && (
                    <button
                      onClick={handleExportData}
                      className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {trainingData.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                              User Input
                            </span>
                            <p className="text-sm text-gray-900 mt-1 bg-blue-50 p-2 rounded-lg">
                              {item.input}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                              Expected Response
                            </span>
                            <p className="text-sm text-gray-900 mt-1 bg-green-50 p-2 rounded-lg">
                              {item.expectedOutput}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                              {item.intent}
                            </span>
                            <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                            <span>{item.dateAdded.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteExample(item.id)}
                          className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {trainingData.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No training examples yet</p>
                      <p className="text-sm mt-1">Add your first example above to start training your AI</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalExamples}</p>
                      <p className="text-sm text-blue-700">Training Examples</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{stats.uniqueIntents}</p>
                      <p className="text-sm text-purple-700">Intent Categories</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">{(stats.averageConfidence * 100).toFixed(0)}%</p>
                      <p className="text-sm text-green-700">Avg Confidence</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intent Distribution */}
              {Object.keys(stats.intentDistribution).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Intent Distribution</h4>
                  <div className="space-y-3">
                    {Object.entries(stats.intentDistribution).map(([intent, count]) => (
                      <div key={intent} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">{intent}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(count / stats.totalExamples) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Training Tips */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Training Tips
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Add diverse examples for each intent to improve accuracy</li>
                  <li>• Include edge cases and variations in user input</li>
                  <li>• Keep responses consistent for similar intents</li>
                  <li>• Regularly review and update training data</li>
                  <li>• Aim for at least 10-20 examples per intent category</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Training data helps improve AI responses and accuracy
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
            {activeTab === 'examples' && trainingData.length > 0 && (
              <button 
                onClick={handleExportData}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Export Training Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}