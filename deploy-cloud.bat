@echo off
REM 🚀 Cloud Deployment Helper Script (Windows)
REM This script helps prepare your project for cloud deployment

echo 🚀 Preparing for cloud deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Create .env files if they don't exist
if not exist ".env" (
    echo 📝 Creating frontend .env file from template...
    copy env.example .env
    echo ⚠️  Please update .env with your API keys and configuration
)

if not exist "server\.env" (
    echo 📝 Creating backend .env file from template...
    copy server\env.example server\.env
    echo ⚠️  Please update server\.env with your API keys and configuration
)

REM Check if all required files exist
echo 🔍 Checking required files...

if exist "package.json" echo ✅ package.json
if exist "vite.config.ts" echo ✅ vite.config.ts
if exist "vercel.json" echo ✅ vercel.json
if exist "render.yaml" echo ✅ render.yaml
if exist "server\package.json" echo ✅ server\package.json
if exist "server\Dockerfile" echo ✅ server\Dockerfile
if exist "server\env.example" echo ✅ server\env.example

echo.
echo 🔧 Environment Variables Checklist:
echo.

REM Frontend variables
echo Frontend (.env):
echo   VITE_API_BASE_URL - Your backend URL
echo   VITE_SUPABASE_URL - Your Supabase URL
echo   VITE_SUPABASE_ANON_KEY - Your Supabase anon key
echo.

REM Backend variables
echo Backend (server\.env):
echo   OPENAI_API_KEY - Your OpenAI API key
echo   SUPABASE_URL - Your Supabase URL
echo   SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key
echo   JWT_SECRET - Your JWT secret
echo   CORS_ORIGIN - Your frontend URL
echo.

echo 📋 Deployment Options:
echo.
echo 1. Vercel (Frontend) + Render (Backend) - Recommended
echo    - Frontend: https://vercel.com/
echo    - Backend: https://render.com/
echo.
echo 2. Render (Full-Stack)
echo    - Both: https://render.com/
echo    - Use the render.yaml file for automatic deployment
echo.

echo 📖 Next Steps:
echo 1. Update your .env files with actual values
echo 2. Push your code to GitHub
echo 3. Follow the CLOUD_DEPLOYMENT.md guide
echo 4. Deploy to your chosen platform
echo.

echo 🎯 Quick Commands:
echo.
echo # Push to GitHub
echo git add .
echo git commit -m "Prepare for cloud deployment"
echo git push origin main
echo.
echo # Test build locally
echo npm run build
echo cd server ^&^& npm run build
echo.

echo ✅ Cloud deployment preparation complete!
echo 📚 See CLOUD_DEPLOYMENT.md for detailed instructions

pause 