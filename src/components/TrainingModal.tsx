import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Brain, Download, Trash2, AlertCircle, CheckCircle, Clock, Database, Search, ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { chatService } from '../services/chatService';
import { TrainingData } from '../types';
import { VirtualList } from './VirtualList';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrainingModal: React.FC<TrainingModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'training' | 'data'>('training');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [trainedData, setTrainedData] = useState<TrainingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'frequent'>('all');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and paginate trained data
  const filteredData = trainedData.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const showFeedbackMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  const handleAddExample = async () => {
    if (!question.trim() || !answer.trim()) {
      showFeedbackMessage('Please fill in both question and answer fields.', 'error');
      return;
    }

    setIsTraining(true);
    setTrainingStatus('training');

    try {
      // Simulate training process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newData: TrainingData = {
        id: Date.now().toString(),
        question: question.trim(),
        answer: answer.trim(),
        timestamp: new Date(),
        usageCount: 0
      };

      setTrainedData(prev => [newData, ...prev]);
      setQuestion('');
      setAnswer('');
      setTrainingStatus('success');
      showFeedbackMessage('Training example added successfully!', 'success');
      
      // Reset status after showing success
      setTimeout(() => setTrainingStatus('idle'), 2000);
    } catch (error) {
      setTrainingStatus('error');
      showFeedbackMessage('Failed to add training example. Please try again.', 'error');
    } finally {
      setIsTraining(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate file processing
      showFeedbackMessage(`Processing ${file.name}...`, 'info');
      setTimeout(() => {
        showFeedbackMessage(`Successfully processed ${file.name}`, 'success');
      }, 2000);
    }
  };

  const handleDeleteData = (id: string) => {
    setTrainedData(prev => prev.filter(item => item.id !== id));
    showFeedbackMessage('Training data deleted successfully.', 'success');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(trainedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trained-data.json';
    link.click();
    URL.revokeObjectURL(url);
    showFeedbackMessage('Data exported successfully!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Training Portal</h2>
              <p className="text-sm text-gray-500">Train your AI with custom examples</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Feedback Toast */}
        {showFeedback && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            feedbackType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            feedbackType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {feedbackType === 'success' ? <CheckCircle className="w-4 h-4" /> :
             feedbackType === 'error' ? <AlertCircle className="w-4 h-4" /> :
             <Clock className="w-4 h-4" />}
            <span className="text-sm font-medium">{feedbackMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'training'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Add Training Data</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'data'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Trained Data ({trainedData.length})</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'training' ? (
            <div className="space-y-6">
              {/* File Upload Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Training Files</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Choose File</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.csv,.json,.pdf,.doc,.docx"
                    />
                  </label>
                  <span className="text-sm text-gray-500">Supports: TXT, CSV, JSON, PDF, DOC</span>
                </div>
              </div>

              {/* Manual Training Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Training Example</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question/Input
                    </label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Enter the question or input that should trigger this response..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={isTraining}
                      style={{ color: 'black', backgroundColor: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Answer/Response
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter the expected response or answer..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={isTraining}
                      style={{ color: 'black', backgroundColor: 'white' }}
                    />
                  </div>
                  <button
                    onClick={handleAddExample}
                    disabled={isTraining || !question.trim() || !answer.trim()}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isTraining || !question.trim() || !answer.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {isTraining ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Training AI...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Training Example</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search training data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ color: 'black', backgroundColor: 'white' }}
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Data</option>
                  <option value="recent">Recent</option>
                  <option value="frequent">Most Used</option>
                </select>
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              {/* Data List */}
              <div className="space-y-3">
                {paginatedData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No training data found</p>
                    <p className="text-sm">Add some training examples to get started</p>
                  </div>
                ) : (
                  paginatedData.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="font-medium text-gray-900">Q: {item.question}</h4>
                            <p className="text-sm text-gray-600 mt-1">A: {item.answer}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Added: {item.timestamp.toLocaleDateString()}</span>
                            <span>Used: {item.usageCount} times</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteData(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete training data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingModal;