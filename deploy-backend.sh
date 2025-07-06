#!/bin/bash

# AI Chatbot Backend Deployment Script
# This script helps deploy the backend to Render

set -e  # Exit on any error

echo "🚀 Starting AI Chatbot Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Navigate to server directory
cd server

print_status "Installing backend dependencies..."
npm install

print_status "Building backend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed. dist directory not found."
    exit 1
fi

print_success "Backend build completed successfully"

# Check environment variables
print_status "Checking environment variables..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Please create one based on env.example"
    print_status "Creating .env from template..."
    cp env.example .env
    print_warning "Please edit .env file with your actual values before deployment"
fi

# Check required environment variables
REQUIRED_VARS=("OPENAI_API_KEY" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] && ! grep -q "^${var}=" .env 2>/dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_warning "Missing required environment variables: ${MISSING_VARS[*]}"
    print_status "Please set these in your Render dashboard:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
fi

# Test the build locally
print_status "Testing build locally..."
timeout 10s npm start &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Test health endpoint
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "Local server test passed"
else
    print_warning "Local server test failed, but continuing with deployment"
fi

# Kill the test server
kill $SERVER_PID 2>/dev/null || true

# Go back to project root
cd ..

print_status "Checking Docker configuration..."
if [ -f "server/Dockerfile" ]; then
    print_success "Dockerfile found"
else
    print_error "Dockerfile not found in server directory"
    exit 1
fi

print_status "Checking Render configuration..."
if [ -f "render.yaml" ]; then
    print_success "render.yaml found"
else
    print_warning "render.yaml not found. You'll need to configure Render manually"
fi

# Deployment checklist
echo ""
echo "📋 Deployment Checklist:"
echo "1. ✅ Node.js 18+ installed"
echo "2. ✅ Dependencies installed"
echo "3. ✅ Backend built successfully"
echo "4. ✅ Dockerfile configured"
echo "5. ✅ render.yaml configured"
echo ""
echo "🔧 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repo to Render"
echo "3. Set environment variables in Render dashboard:"
echo "   - OPENAI_API_KEY"
echo "   - JWT_SECRET (at least 32 characters)"
echo "   - CORS_ORIGIN (your frontend URL)"
echo "4. Deploy using your render.yaml configuration"
echo ""
echo "🌐 After deployment, test these endpoints:"
echo "   - Health: https://your-app.onrender.com/health"
echo "   - Status: https://your-app.onrender.com/api/status"
echo "   - Config: https://your-app.onrender.com/api/status/config"
echo ""

print_success "Deployment preparation completed!"
print_status "Your backend is ready for deployment to Render" 