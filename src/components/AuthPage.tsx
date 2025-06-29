import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, MessageSquare, Shield, Brain, Upload, Zap, Users } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    mobile: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    alert(`${isLogin ? 'Login' : 'Registration'} successful! (Demo)`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          
          {/* Left Column - Product Description */}
          <div className="space-y-8 lg:pr-8">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Imperial AI Chatboard
                </h1>
                <p className="text-gray-600 text-sm">Your Personal AI Assistant</p>
              </div>
            </div>

            {/* Main Description */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Train your own GPT-style AI assistant with documents, files, or prompts.
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Ask questions. Get smart answers. Perfect for business owners, students, and teams.
                  <span className="block mt-2 font-medium text-blue-600">
                    Private, customizable, and always learning.
                  </span>
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Training</h3>
                    <p className="text-sm text-gray-600">Upload PDFs, docs, or text files</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Memory</h3>
                    <p className="text-sm text-gray-600">Remembers your conversations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Private & Secure</h3>
                    <p className="text-sm text-gray-600">Your data stays protected</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Instant Answers</h3>
                    <p className="text-sm text-gray-600">Get responses in seconds</p>
                  </div>
                </div>
              </div>

              {/* Example Preview */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Example Use Case</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      "Upload a 20-page PDF manual. Ask anything — and your AI will instantly answer 
                      with specific details from your document."
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>10,000+ users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Enterprise secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>99.9% uptime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Form Header */}
              <div className="p-8 pb-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {isLogin ? 'Welcome Back' : 'Get Started Free'}
                  </h3>
                  <p className="text-gray-600">
                    {isLogin 
                      ? 'Sign in to continue to your AI assistant' 
                      : 'Create your account and start training your AI'
                    }
                  </p>
                </div>

                {/* Toggle Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isLogin
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                      !isLogin
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username (Register only) */}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Choose a username"
                          required={!isLogin}
                          style={{ color: 'black', backgroundColor: 'white' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your email"
                        required
                        style={{ color: 'black', backgroundColor: 'white' }}
                      />
                    </div>
                  </div>

                  {/* Mobile (Register only) */}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="+1 (555) 123-4567"
                          required={!isLogin}
                          style={{ color: 'black', backgroundColor: 'white' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your password"
                        required
                        style={{ color: 'black', backgroundColor: 'white' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                      </div>
                    ) : (
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    )}
                  </button>
                </form>

                {/* Forgot Password (Login only) */}
                {isLogin && (
                  <div className="text-center mt-4">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isLogin && (
                <div className="px-8 pb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Free Plan Includes:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 1,000 AI messages per month</li>
                      <li>• Upload up to 10 documents</li>
                      <li>• Basic conversation history</li>
                      <li>• Email support</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-gray-500 mt-6">
              By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
              <button className="text-blue-600 hover:text-blue-700 underline">Terms of Service</button>
              {' '}and{' '}
              <button className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};