# 🤖 CI/CD Pipeline Setup Guide

This guide will help you set up a complete CI/CD pipeline for your AI Chatbot project using GitHub Actions, Vercel, and Render.

## 📋 Prerequisites

- GitHub repository with your project
- Vercel account (for frontend deployment)
- Render account (for backend deployment)
- Supabase project configured
- OpenAI API key

## 🔧 GitHub Secrets Configuration

### Required Secrets

Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Vercel Deployment Secrets
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

#### Render Deployment Secrets
```
RENDER_SERVICE_ID=your_render_service_id_here
RENDER_API_KEY=your_render_api_key_here
```

#### Optional Notification Secrets
```
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

### How to Get These Secrets

#### Vercel Secrets
1. **VERCEL_TOKEN**: 
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token with full scope
   - Copy the token

2. **VERCEL_ORG_ID**:
   - Go to Vercel Dashboard → Settings → General
   - Copy the "Team ID" (this is your org ID)

3. **VERCEL_PROJECT_ID**:
   - Go to your project in Vercel Dashboard
   - Go to Settings → General
   - Copy the "Project ID"

#### Render Secrets
1. **RENDER_SERVICE_ID**:
   - Go to your service in Render Dashboard
   - Copy the service ID from the URL or settings

2. **RENDER_API_KEY**:
   - Go to Render Dashboard → Account → API Keys
   - Create a new API key
   - Copy the key

## 🌐 Environment Variables Setup

### Vercel Environment Variables

Set these in your Vercel project dashboard (`Settings → Environment Variables`):

#### Frontend Environment Variables
```bash
VITE_API_BASE_URL=https://your-backend-name.onrender.com
VITE_API_URL=https://your-backend-name.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_MAX_TOKENS=1000
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
```

### Render Environment Variables

Set these in your Render service dashboard (`Environment` tab):

#### Backend Environment Variables
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-name.vercel.app
ALLOWED_ORIGINS=https://your-frontend-name.vercel.app
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=your_jwt_secret_here
LOG_LEVEL=info
ENABLE_HELMET=true
ENABLE_COMPRESSION=true
ENABLE_REQUEST_LOGGING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SLOW_DOWN_DELAY_MS=500
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
PROMPT_TEMPLATE=You are a helpful assistant. Answer concisely and clearly.
CHROMA_COLLECTION_NAME=chatbot_embeddings
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVAL_RESULTS=5
FRONTEND_URL=https://your-frontend-name.vercel.app
API_BASE_URL=https://your-backend-name.onrender.com
VERBOSE_LOGGING=false
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 🚀 Deployment Setup

### 1. Vercel Frontend Deployment

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
   - **Root Directory**: `project`

### 2. Render Backend Deployment

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure the service:
   - **Environment**: Docker
   - **Dockerfile Path**: `project/server/Dockerfile`
   - **Build Command**: `npm ci --only=production`
   - **Start Command**: `npm start`
   - **Root Directory**: `project/server`

## 🔄 CI/CD Pipeline Workflow

The pipeline will automatically:

1. **On Push to main/dev**: Run all checks and deploy
2. **On Pull Request**: Run checks only (no deployment)
3. **Checks Include**:
   - Linting (ESLint)
   - Formatting (Prettier)
   - Testing (Jest)
   - Building (TypeScript/Vite)
   - Security audits
   - Docker image validation

### Pipeline Steps

```yaml
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (frontend + backend)
4. Lint code (ESLint)
5. Check formatting (Prettier)
6. Run tests (Jest)
7. Build applications
8. Security audit
9. Docker validation
10. Deploy to Vercel (frontend)
11. Deploy to Render (backend)
12. Notify status
```

## 📊 Monitoring and Notifications

### GitHub PR Comments
The pipeline automatically comments on PRs with:
- ✅ Success status
- ❌ Failure details
- Coverage reports
- Deployment status

### Optional Slack Notifications
Configure `SLACK_WEBHOOK_URL` secret to receive:
- Deployment success/failure notifications
- Direct links to GitHub Actions logs

## 🛠 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

2. **Deployment Failures**:
   - Verify all secrets are correctly set
   - Check environment variables in Vercel/Render
   - Ensure CORS origins are correctly configured

3. **Test Failures**:
   - Run tests locally: `npm run test:ci`
   - Check test configuration in `jest.config.cjs`
   - Verify test environment setup

### Debug Commands

```bash
# Local testing
npm run ci:all

# Individual checks
npm run lint
npm run format:check
npm run test:ci
npm run build

# Backend checks
cd server
npm run ci:all
```

## 📈 Performance Optimization

### Caching
- GitHub Actions uses npm cache for faster builds
- Docker layer caching for image builds
- Vercel and Render have built-in caching

### Parallel Jobs
- Frontend and backend checks run in parallel
- Docker builds run concurrently
- Test coverage uploads are non-blocking

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment variables** for all sensitive data
3. **Regular security audits** with `npm audit`
4. **Keep dependencies updated**
5. **Use HTTPS** for all external communications

## 📝 Next Steps

1. Set up all required secrets in GitHub
2. Configure environment variables in Vercel and Render
3. Push to main branch to trigger first deployment
4. Monitor the pipeline execution
5. Set up optional Slack notifications
6. Configure custom domains if needed

---

**🎉 Your CI/CD pipeline is now ready! Push to main to see it in action.** 