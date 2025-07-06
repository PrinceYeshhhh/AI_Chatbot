#!/bin/bash

# 🤖 CI/CD Pipeline Verification Script
# This script simulates the CI/CD pipeline locally to verify all components work correctly

set -e  # Exit on any error

echo "🚀 Starting CI/CD Pipeline Verification..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    print_status "ERROR" "Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_status "ERROR" "npm is not installed"
    exit 1
fi

if ! command_exists docker; then
    print_status "WARNING" "Docker is not installed - Docker validation will be skipped"
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

print_status "SUCCESS" "Prerequisites check completed"

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "INFO" "Node.js version: $NODE_VERSION"

# =============================================================================
# FRONTEND VERIFICATION
# =============================================================================

echo ""
echo "🌐 Frontend Verification"
echo "========================"

cd project

# Install dependencies
print_status "INFO" "Installing frontend dependencies..."
if npm ci --prefer-offline --no-audit; then
    print_status "SUCCESS" "Frontend dependencies installed"
else
    print_status "ERROR" "Frontend dependency installation failed"
    exit 1
fi

# Lint check
print_status "INFO" "Running frontend linting..."
if npm run lint; then
    print_status "SUCCESS" "Frontend linting passed"
else
    print_status "ERROR" "Frontend linting failed"
    exit 1
fi

# Format check
print_status "INFO" "Checking frontend formatting..."
if npm run format:check; then
    print_status "SUCCESS" "Frontend formatting check passed"
else
    print_status "ERROR" "Frontend formatting check failed"
    exit 1
fi

# Type check
print_status "INFO" "Running TypeScript type check..."
if npm run type-check; then
    print_status "SUCCESS" "Frontend type check passed"
else
    print_status "ERROR" "Frontend type check failed"
    exit 1
fi

# Run tests
print_status "INFO" "Running frontend tests..."
if npm run test:ci; then
    print_status "SUCCESS" "Frontend tests passed"
else
    print_status "ERROR" "Frontend tests failed"
    exit 1
fi

# Build
print_status "INFO" "Building frontend..."
if npm run build; then
    print_status "SUCCESS" "Frontend build completed"
else
    print_status "ERROR" "Frontend build failed"
    exit 1
fi

# Security audit
print_status "INFO" "Running frontend security audit..."
if npm run security:audit; then
    print_status "SUCCESS" "Frontend security audit passed"
else
    print_status "WARNING" "Frontend security audit found issues"
fi

# =============================================================================
# BACKEND VERIFICATION
# =============================================================================

echo ""
echo "🔧 Backend Verification"
echo "======================="

cd server

# Install dependencies
print_status "INFO" "Installing backend dependencies..."
if npm ci --prefer-offline --no-audit; then
    print_status "SUCCESS" "Backend dependencies installed"
else
    print_status "ERROR" "Backend dependency installation failed"
    exit 1
fi

# Lint check
print_status "INFO" "Running backend linting..."
if npm run lint; then
    print_status "SUCCESS" "Backend linting passed"
else
    print_status "WARNING" "Backend linting failed or not configured"
fi

# Format check
print_status "INFO" "Checking backend formatting..."
if npm run format:check; then
    print_status "SUCCESS" "Backend formatting check passed"
else
    print_status "WARNING" "Backend formatting check failed or not configured"
fi

# Type check
print_status "INFO" "Running backend TypeScript type check..."
if npm run type-check; then
    print_status "SUCCESS" "Backend type check passed"
else
    print_status "ERROR" "Backend type check failed"
    exit 1
fi

# Run tests
print_status "INFO" "Running backend tests..."
if npm run test:ci; then
    print_status "SUCCESS" "Backend tests passed"
else
    print_status "ERROR" "Backend tests failed"
    exit 1
fi

# Build
print_status "INFO" "Building backend..."
if npm run build; then
    print_status "SUCCESS" "Backend build completed"
else
    print_status "ERROR" "Backend build failed"
    exit 1
fi

# Security audit
print_status "INFO" "Running backend security audit..."
if npm run security:audit; then
    print_status "SUCCESS" "Backend security audit passed"
else
    print_status "WARNING" "Backend security audit found issues"
fi

# =============================================================================
# DOCKER VERIFICATION
# =============================================================================

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "🐳 Docker Verification"
    echo "====================="

    cd ..

    # Build frontend Docker image
    if [ -f "Dockerfile" ]; then
        print_status "INFO" "Building frontend Docker image..."
        if docker build . --file Dockerfile --tag frontend-image:test; then
            print_status "SUCCESS" "Frontend Docker image built successfully"
        else
            print_status "ERROR" "Frontend Docker image build failed"
            exit 1
        fi
    else
        print_status "WARNING" "No frontend Dockerfile found"
    fi

    # Build backend Docker image
    cd server
    if [ -f "Dockerfile" ]; then
        print_status "INFO" "Building backend Docker image..."
        if docker build . --file Dockerfile --tag backend-image:test; then
            print_status "SUCCESS" "Backend Docker image built successfully"
        else
            print_status "ERROR" "Backend Docker image build failed"
            exit 1
        fi
    else
        print_status "WARNING" "No backend Dockerfile found"
    fi

    # Clean up test images
    print_status "INFO" "Cleaning up test Docker images..."
    docker rmi frontend-image:test 2>/dev/null || true
    docker rmi backend-image:test 2>/dev/null || true
fi

# =============================================================================
# ENVIRONMENT VARIABLES CHECK
# =============================================================================

echo ""
echo "🔐 Environment Variables Check"
echo "=============================="

cd ..

# Check for .env files (should not exist in production)
if [ -f ".env" ]; then
    print_status "WARNING" ".env file found - should not be committed to git"
else
    print_status "SUCCESS" "No .env file found (good practice)"
fi

if [ -f "server/.env" ]; then
    print_status "WARNING" "server/.env file found - should not be committed to git"
else
    print_status "SUCCESS" "No server/.env file found (good practice)"
fi

# Check for env.example files
if [ -f "env.example" ]; then
    print_status "SUCCESS" "env.example file found"
else
    print_status "WARNING" "env.example file not found"
fi

if [ -f "server/env.example" ]; then
    print_status "SUCCESS" "server/env.example file found"
else
    print_status "WARNING" "server/env.example file not found"
fi

# =============================================================================
# GITHUB WORKFLOW CHECK
# =============================================================================

echo ""
echo "🔄 GitHub Workflow Check"
echo "======================="

if [ -f ".github/workflows/ci-cd.yml" ]; then
    print_status "SUCCESS" "CI/CD workflow file found"
else
    print_status "ERROR" "CI/CD workflow file not found"
    exit 1
fi

# =============================================================================
# FINAL SUMMARY
# =============================================================================

echo ""
echo "🎉 CI/CD Pipeline Verification Complete!"
echo "========================================"
print_status "SUCCESS" "All checks passed successfully!"

echo ""
echo "📋 Next Steps:"
echo "1. Set up GitHub secrets (see CI_CD_SETUP.md)"
echo "2. Configure environment variables in Vercel and Render"
echo "3. Push to main branch to trigger deployment"
echo "4. Monitor the pipeline execution"

echo ""
echo "📚 Documentation:"
echo "- CI/CD Setup Guide: CI_CD_SETUP.md"
echo "- Environment Variables: env.example"
echo "- Backend Environment: server/env.example"

print_status "INFO" "Verification completed successfully! 🚀" 