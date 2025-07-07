#!/bin/bash

echo "🚀 Smart Brain AI Chatbot - Authentication Setup"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

echo "✅ Dependencies installed"

# Create environment files
echo "🔧 Setting up environment files..."

# Client .env
if [ ! -f "client/.env" ]; then
    cp client/env.example client/.env
    echo "✅ Created client/.env"
else
    echo "⚠️  client/.env already exists"
fi

# Server .env
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env"
else
    echo "⚠️  server/.env already exists"
fi

echo ""
echo "🎯 Next Steps:"
echo "==============="
echo ""
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Enable Email authentication in your Supabase dashboard"
echo "3. Copy your Supabase URL and keys to the .env files:"
echo ""
echo "   Client (.env):"
echo "   - VITE_SUPABASE_URL=your_supabase_project_url"
echo "   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo ""
echo "   Server (.env):"
echo "   - SUPABASE_URL=your_supabase_project_url"
echo "   - SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
echo ""
echo "4. Start the development servers:"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:5173 to test the authentication"
echo ""
echo "🔐 Authentication Features:"
echo "- Sign up with email/password"
echo "- Sign in with email/password"
echo "- Session persistence"
echo "- Protected routes"
echo "- JWT validation on backend"
echo ""
echo "✨ Setup complete! Follow the steps above to configure Supabase." 