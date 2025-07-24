#!/bin/bash

# 🚀 Cloud Deployment Helper Script
# This script helps prepare your project for cloud deployment

echo "🚀 Preparing for cloud deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create .env files if they don't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env with your API keys and configuration"
fi

if [ ! -f "server/.env" ]; then
    echo "📝 Creating backend .env file from template..."
    cp server/env.example server/.env
    echo "⚠️  Please update server/.env with your API keys and configuration"
fi

# Check if all required files exist
echo "🔍 Checking required files..."

required_files=(
    "package.json"
    "vite.config.ts"
    "vercel.json"
    "render.yaml"
    "server/package.json"
    "server/Dockerfile"
    "server/env.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

# Check environment variables
echo ""
echo "🔧 Environment Variables Checklist:"
echo ""

# Frontend variables
echo "Frontend (.env):"
echo "  VITE_API_BASE_URL - Your backend URL"
echo "  VITE_CLERK_PUBLISHABLE_KEY - Your Clerk publishable key"
echo "  VITE_CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name"
echo ""

# Backend variables
echo "Backend (server/.env):"
echo "  GROQ_API_KEY - Your Groq API key"
echo "  TOGETHER_API_KEY - Your Together.ai API key"
echo "  CLERK_SECRET_KEY - Your Clerk secret key"
echo "  NEON_DATABASE_URL - Your Neon database URL"
echo "  QDRANT_URL - Your Qdrant vector database URL"
echo "  CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name"
echo "  JWT_SECRET - Your JWT secret"
echo "  CORS_ORIGIN - Your frontend URL"
echo ""

echo "📋 Deployment Options:"
echo ""
echo "1. Vercel (Frontend) + Render (Backend) - Recommended"
echo "   - Frontend: https://vercel.com/"
echo "   - Backend: https://render.com/"
echo ""
echo "2. Render (Full-Stack)"
echo "   - Both: https://render.com/"
echo "   - Use the render.yaml file for automatic deployment"
echo ""

echo "📖 Next Steps:"
echo "1. Update your .env files with actual values"
echo "2. Push your code to GitHub"
echo "3. Follow the CLOUD_DEPLOYMENT.md guide"
echo "4. Deploy to your chosen platform"
echo ""

echo "🎯 Quick Commands:"
echo ""
echo "# Push to GitHub"
echo "git add ."
echo "git commit -m 'Prepare for cloud deployment'"
echo "git push origin main"
echo ""
echo "# Test build locally"
echo "npm run build"
echo "cd server && npm run build"
echo ""

echo "✅ Cloud deployment preparation complete!"
echo "📚 See CLOUD_DEPLOYMENT.md for detailed instructions" 