#!/bin/bash

# AI Chatbot Development Startup Script

echo "🚀 Starting AI Chatbot Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "📦 Installing backend dependencies..."
cd server && npm install && cd ..

echo "🔧 Setting up environment files..."
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env with your OpenAI API key and other settings"
fi

if [ ! -f "server/.env" ]; then
    echo "📝 Creating server .env file from template..."
    cp server/env.example server/.env
    echo "⚠️  Please update server/.env with your OpenAI API key and other settings"
fi

echo "🌐 Starting development servers..."
echo "📱 Frontend will be available at: http://localhost:5173"
echo "🔧 Backend will be available at: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start both servers concurrently
npm run dev 