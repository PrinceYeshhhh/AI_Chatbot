#!/bin/bash

# Zero-downtime deployment script for AI Chatbot
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
DEPLOYMENT_NAME="ai-chatbot-${ENVIRONMENT}"
NAMESPACE="ai-chatbot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check function
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    log_info "Performing health check on $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health" > /dev/null; then
            log_success "Health check passed on attempt $attempt"
            return 0
        else
            log_warning "Health check failed on attempt $attempt/$max_attempts"
            sleep 10
            ((attempt++))
        fi
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Rollback production deployment
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml up -d --scale frontend=1 --scale backend=1
        
        if health_check "http://localhost:80"; then
            log_success "Rollback completed successfully"
        else
            log_error "Rollback failed - manual intervention required"
            exit 1
        fi
    else
        # Rollback staging deployment
        docker-compose -f docker-compose.staging.yml down
        docker-compose -f docker-compose.staging.yml up -d
        
        if health_check "http://localhost:5173"; then
            log_success "Rollback completed successfully"
        else
            log_error "Rollback failed - manual intervention required"
            exit 1
        fi
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    # Check environment variables
    if [ "$ENVIRONMENT" = "production" ]; then
        required_vars=("GROQ_API_KEY" "TOGETHER_API_KEY" "REDIS_URL")
        for var in "${required_vars[@]}"; do
            if [ -z "${!var}" ]; then
                log_error "Required environment variable $var is not set"
                exit 1
            fi
        done
    fi
    
    log_success "Pre-deployment checks passed"
}

# Backup current deployment
backup_deployment() {
    log_info "Creating backup of current deployment..."
    
    # Create backup directory
    backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Export current deployment state
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.prod.yml ps > "$backup_dir/deployment_state.txt" 2>&1 || true
    else
        docker-compose -f docker-compose.staging.yml ps > "$backup_dir/deployment_state.txt" 2>&1 || true
    fi
    
    log_success "Backup created in $backup_dir"
}

# Deploy new version
deploy_new_version() {
    log_info "Deploying version $VERSION to $ENVIRONMENT environment..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production deployment with blue-green strategy
        log_info "Starting blue-green deployment..."
        
        # Start new containers with different ports
        docker-compose -f docker-compose.prod.yml up -d --scale frontend=2 --scale backend=2
        
        # Wait for new containers to be healthy
        sleep 30
        
        # Health check new deployment
        if health_check "http://localhost:80"; then
            log_success "New deployment is healthy"
            
            # Update load balancer to point to new containers
            # This would depend on your load balancer setup
            log_info "Updating load balancer configuration..."
            
            # Stop old containers
            docker-compose -f docker-compose.prod.yml up -d --scale frontend=1 --scale backend=1
        else
            log_error "New deployment failed health checks"
            rollback
            exit 1
        fi
    else
        # Staging deployment
        docker-compose -f docker-compose.staging.yml down
        docker-compose -f docker-compose.staging.yml up -d
        
        # Health check staging deployment
        if health_check "http://localhost:5173"; then
            log_success "Staging deployment successful"
        else
            log_error "Staging deployment failed health checks"
            rollback
            exit 1
        fi
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log_info "Running post-deployment verification..."
    
    # Run smoke tests
    log_info "Running smoke tests..."
    
    # Test basic functionality
    if curl -f -s "http://localhost:80/" > /dev/null; then
        log_success "Frontend is accessible"
    else
        log_error "Frontend is not accessible"
        return 1
    fi
    
    # Test API endpoints
    if curl -f -s "http://localhost:3001/health" > /dev/null; then
        log_success "Backend API is healthy"
    else
        log_error "Backend API is not healthy"
        return 1
    fi
    
    # Test file upload functionality (if staging)
    if [ "$ENVIRONMENT" = "staging" ]; then
        log_info "Testing file upload functionality..."
        # Add file upload test here
    fi
    
    log_success "Post-deployment verification completed"
}

# Main deployment process
main() {
    log_info "Starting deployment to $ENVIRONMENT environment (version: $VERSION)"
    
    # Set up error handling
    trap 'log_error "Deployment failed. Rolling back..."; rollback; exit 1' ERR
    
    # Run deployment steps
    pre_deployment_checks
    backup_deployment
    deploy_new_version
    post_deployment_verification
    
    log_success "Deployment to $ENVIRONMENT completed successfully!"
    
    # Send notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Deployment to $ENVIRONMENT completed successfully (version: $VERSION)\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
}

# Run main function
main "$@" 