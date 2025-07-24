# 🚀 Cloud Deployment Guide

This guide will help you deploy your AI Chatbot to the cloud using either Vercel + Render or Render for both frontend and backend.

## 📋 Prerequisites

Before deploying, make sure you have:

1. **GitHub Repository**: Your code pushed to GitHub
2. **Clerk.dev Account**: Authentication set up
3. **Groq API Key**: For AI chat completions
4. **Together.ai API Key**: For embeddings
4. **Cloud Accounts**: Vercel and/or Render accounts

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) - Recommended

**Frontend on Vercel:**
- Fast, global CDN
- Automatic deployments
- Great for React/Vite apps

**Backend on Render:**
- Reliable hosting
- Good for Node.js APIs
- Free tier available

### Option 2: Render (Full-Stack)

**Both frontend and backend on Render:**
- Single platform
- Easy management
- Good for full-stack apps

## 🚀 Option 1: Vercel + Render Deployment

### Step 1: Deploy Backend to Render

1. **Go to Render**: https://render.com/
2. **Sign up/Login** with GitHub
3. **Create New Service** → **Web Service**
4. **Connect your repository**
5. **Configure the service**:
   ```
   Name: ai-chatbot-backend
   Root Directory: project/server
   Build Command: npm ci --only=production
   Start Command: npm start
   ```

6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   GROQ_API_KEY=your_groq_api_key
   TOGETHER_API_KEY=your_together_api_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEON_DATABASE_URL=your_neon_database_url
   QDRANT_URL=your_qdrant_url
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   JWT_SECRET=your_jwt_secret
   CORS_ORIGIN=https://your-frontend-name.vercel.app
   ALLOWED_ORIGINS=https://your-frontend-name.vercel.app
   ```

7. **Deploy**: Click "Create Web Service"

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel**: https://vercel.com/
2. **Sign up/Login** with GitHub
3. **Import Project** → Select your repository
4. **Configure the project**:
   ```
   Framework Preset: Vite
   Root Directory: project
   Build Command: npm run build
   Output Directory: dist
   ```

5. **Add Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-name.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_UMAMI_WEBSITE_ID=your_umami_website_id
   ```

6. **Deploy**: Click "Deploy"

### Step 3: Update URLs

After deployment, update your environment variables with the actual URLs:

**Backend (Render):**
```
CORS_ORIGIN=https://your-frontend-name.vercel.app
ALLOWED_ORIGINS=https://your-frontend-name.vercel.app
```

**Frontend (Vercel):**
```
VITE_API_BASE_URL=https://your-backend-name.onrender.com
```

## 🚀 Option 2: Render Full-Stack Deployment

### Using render.yaml (Recommended)

Your project already has a `render.yaml` file configured for full-stack deployment.

1. **Go to Render**: https://render.com/
2. **Create New** → **Blueprint**
3. **Connect your repository**
4. **Deploy**: Render will automatically create both services

### Manual Deployment

If you prefer manual setup:

1. **Deploy Backend** (same as Option 1)
2. **Deploy Frontend**:
   - Create new Web Service
   - Root Directory: `project`
   - Build Command: `npm run build`
   - Start Command: `npx serve -s dist -l 3000`

## 🔧 Environment Variables Setup

### Backend Environment Variables

Create these in your cloud platform dashboard:

```bash
# Required
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-url.com
ALLOWED_ORIGINS=https://your-frontend-url.com

# Authentication (Clerk.dev)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Database (Neon.tech)
NEON_DATABASE_URL=postgresql://username:password@host:port/database
NEON_HOST=your-neon-host.neon.tech
NEON_DATABASE=your_database_name
NEON_USERNAME=your_username
NEON_PASSWORD=your_password

# Vector Database (Qdrant Cloud)
QDRANT_URL=https://your-cluster-id.us-east-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=smart_brain_embeddings

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI/ML Services
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
TOGETHER_API_KEY=your_together_api_key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
OPENROUTER_API_KEY=your_openrouter_api_key

# Analytics (Umami)
UMAMI_WEBSITE_ID=your_umami_website_id
UMAMI_URL=https://your-umami-instance.com
UMAMI_API_KEY=your_umami_api_key

# Security & Performance
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
ENCRYPTION_KEY=your_32_byte_encryption_key_here_make_it_random
LOG_LEVEL=info
```

### Frontend Environment Variables

```bash
# Required
VITE_API_BASE_URL=https://your-backend-url.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_UMAMI_WEBSITE_ID=your_umami_website_id

# Optional
VITE_ENABLE_STREAMING=true
VITE_ENABLE_CACHING=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

## 🔍 Testing Your Deployment

### Health Checks

1. **Backend Health**: `https://your-backend-url.com/api/status/health`
2. **Frontend**: `https://your-frontend-url.com`

### Common Issues

1. **CORS Errors**: Make sure CORS_ORIGIN matches your frontend URL
2. **API 404**: Check if VITE_API_BASE_URL is correct
3. **Authentication Issues**: Verify Clerk keys are correct
4. **File Upload Issues**: Check Cloudinary configuration

## 📊 Monitoring

### Render Dashboard
- View logs and metrics
- Monitor resource usage
- Set up alerts

### Vercel Dashboard
- View deployment status
- Monitor performance
- Check analytics

## 🔄 Continuous Deployment

Both platforms support automatic deployments:
- **Vercel**: Deploys on every push to main branch
- **Render**: Deploys on every push to main branch

## 🛠️ Custom Domains

### Vercel
1. Go to your project settings
2. Add custom domain
3. Update DNS records

### Render
1. Go to your service settings
2. Add custom domain
3. Update DNS records

## 📝 Next Steps

After deployment:

1. **Test all features**: Chat, authentication, file upload
2. **Monitor performance**: Check response times
3. **Set up monitoring**: Add error tracking
4. **Optimize**: Enable caching, CDN
5. **Scale**: Upgrade plans as needed

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**:
   - Check environment variables
   - Verify API keys are correct
   - Check CORS settings

3. **Performance Issues**:
   - Enable caching
   - Optimize images
   - Use CDN

### Getting Help

- Check the logs in your cloud platform dashboard
- Review the `PRODUCTION_DEPLOYMENT.md` file
- Check the `README.md` for additional setup instructions 