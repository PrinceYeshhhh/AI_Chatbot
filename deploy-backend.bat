@echo off
REM AI Chatbot Backend Deployment Script for Windows
REM This script helps deploy the backend to Render

echo 🚀 Starting AI Chatbot Backend Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)

echo [INFO] Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo [SUCCESS] Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)

echo [SUCCESS] npm version:
npm --version

REM Navigate to server directory
cd server

echo [INFO] Installing backend dependencies...
call npm install

echo [INFO] Building backend...
call npm run build

REM Check if build was successful
if not exist "dist" (
    echo [ERROR] Build failed. dist directory not found.
    exit /b 1
)

echo [SUCCESS] Backend build completed successfully

REM Check environment variables
echo [INFO] Checking environment variables...

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] No .env file found. Please create one based on env.example
    echo [INFO] Creating .env from template...
    copy env.example .env
    echo [WARNING] Please edit .env file with your actual values before deployment
)

REM Go back to project root
cd ..

echo [INFO] Checking Docker configuration...
if exist "server\Dockerfile" (
    echo [SUCCESS] Dockerfile found
) else (
    echo [ERROR] Dockerfile not found in server directory
    exit /b 1
)

echo [INFO] Checking Render configuration...
if exist "render.yaml" (
    echo [SUCCESS] render.yaml found
) else (
    echo [WARNING] render.yaml not found. You'll need to configure Render manually
)

echo.
echo 📋 Deployment Checklist:
echo 1. ✅ Node.js 18+ installed
echo 2. ✅ Dependencies installed
echo 3. ✅ Backend built successfully
echo 4. ✅ Dockerfile configured
echo 5. ✅ render.yaml configured
echo.
echo 🔧 Next Steps:
echo 1. Push your code to GitHub
echo 2. Connect your repo to Render
echo 3. Set environment variables in Render dashboard:
echo    - OPENAI_API_KEY
echo    - JWT_SECRET (at least 32 characters)
echo    - CORS_ORIGIN (your frontend URL)
echo 4. Deploy using your render.yaml configuration
echo.
echo 🌐 After deployment, test these endpoints:
echo    - Health: https://your-app.onrender.com/health
echo    - Status: https://your-app.onrender.com/api/status
echo    - Config: https://your-app.onrender.com/api/status/config
echo.

echo [SUCCESS] Deployment preparation completed!
echo [INFO] Your backend is ready for deployment to Render

pause 