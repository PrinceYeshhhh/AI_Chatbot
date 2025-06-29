@echo off
REM AI Chatbot Development Startup Script for Windows

echo 🚀 Starting AI Chatbot Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing frontend dependencies...
npm install

echo 📦 Installing backend dependencies...
cd server && npm install && cd ..

echo 🔧 Setting up environment files...
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please update .env with your OpenAI API key and other settings
)

if not exist "server\.env" (
    echo 📝 Creating server .env file from template...
    copy server\env.example server\.env
    echo ⚠️  Please update server\.env with your OpenAI API key and other settings
)

echo 🌐 Starting development servers...
echo 📱 Frontend will be available at: http://localhost:5173
echo 🔧 Backend will be available at: http://localhost:3001
echo 📊 Health check: http://localhost:3001/health
echo.
echo Press Ctrl+C to stop both servers

REM Start both servers concurrently
npm run dev 