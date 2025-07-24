# Cloud Environment Variables Setup Guide

This guide provides step-by-step instructions for setting up environment variables for your AI chatbot deployment on Vercel (frontend) and Render (backend).

## 📋 Overview

Your application now uses the following services:
- **Frontend (Vercel)**: React app with Clerk auth, Cloudinary storage, Umami analytics
- **Backend (Render)**: Node.js API with Groq, Together.ai, Qdrant, Neon database

## 🚀 Frontend Setup (Vercel)

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your project dashboard
3. Go to **Settings** > **Environment Variables**

### Step 2: Add Environment Variables

#### API Configuration
```
VITE_API_BASE_URL=https://your-backend-name.onrender.com
VITE_API_URL=https://your-backend-name.onrender.com
```

#### Authentication (Clerk.dev)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/dashboard
VITE_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### Database (Neon.tech)
```
VITE_NEON_DATABASE_URL=postgresql://username:password@host:port/database
VITE_NEON_HOST=your-neon-host.neon.tech
VITE_NEON_DATABASE=your_database_name
VITE_NEON_USERNAME=your_username
VITE_NEON_PASSWORD=your_password
```

#### Vector Database (Qdrant Cloud)
```
VITE_QDRANT_URL=https://your-cluster-id.us-east-1-0.aws.cloud.qdrant.io:6333
VITE_QDRANT_API_KEY=your_qdrant_api_key
VITE_QDRANT_COLLECTION_NAME=smart_brain_embeddings
```

#### File Storage (Cloudinary)
```
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

#### Analytics (Umami)
```
VITE_UMAMI_WEBSITE_ID=your_umami_website_id
VITE_UMAMI_URL=https://your-umami-instance.com
```

#### AI/ML Services
```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GROQ_MODEL=llama3-70b-8192
VITE_TOGETHER_API_KEY=your_together_api_key
VITE_TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENROUTER_MODEL=anthropic/claude-3-5-sonnet
VITE_LIBRETRANSLATE_API_KEY=your_libretranslate_api_key
VITE_LIBRETRANSLATE_URL=https://libretranslate.com
```

#### Feature Flags
```
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_IMAGE_ANALYSIS=true
VITE_ENABLE_TRANSLATION=true
VITE_ENABLE_SMART_BRAIN=true
VITE_ENABLE_AGENTS=true
```

#### Development Settings
```
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
VITE_JWT_SECRET=your_jwt_secret_key
VITE_JWT_EXPIRES_IN=24h
```

### Step 3: Deploy
1. Set all environment variables to **Production** environment
2. Click **Save**
3. Redeploy your application

## 🖥️ Backend Setup (Render)

### Step 1: Access Render Dashboard
1. Go to [render.com](https://render.com)
2. Navigate to your service dashboard
3. Go to **Environment** tab

### Step 2: Add Environment Variables

#### Server Configuration
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-name.vercel.app
ALLOWED_ORIGINS=https://your-frontend-name.vercel.app
FRONTEND_URL=https://your-frontend-name.vercel.app
API_BASE_URL=https://your-backend-name.onrender.com
```

#### Authentication (Clerk.dev)
```
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_JWT_ISSUER=https://clerk.your-domain.com
CLERK_JWT_AUDIENCE=your_audience
```

#### Database (Neon.tech)
```
NEON_DATABASE_URL=postgresql://username:password@host:port/database
NEON_HOST=your-neon-host.neon.tech
NEON_DATABASE=your_database_name
NEON_USERNAME=your_username
NEON_PASSWORD=your_password
NEON_SSL=true
```

#### Vector Database (Qdrant Cloud)
```
QDRANT_URL=https://your-cluster-id.us-east-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=smart_brain_embeddings
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVAL_RESULTS=5
```

#### File Storage (Cloudinary)
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Analytics (Umami)
```
UMAMI_WEBSITE_ID=your_umami_website_id
UMAMI_URL=https://your-umami-instance.com
UMAMI_API_KEY=your_umami_api_key
```

#### AI/ML Services
```
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=1000
TOGETHER_API_KEY=your_together_api_key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
TOGETHER_BASE_URL=https://api.together.xyz
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3-5-sonnet
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LIBRETRANSLATE_API_KEY=your_libretranslate_api_key
LIBRETRANSLATE_URL=https://libretranslate.com
LIBRETRANSLATE_BASE_URL=https://libretranslate.com
```

#### Security & Performance
```
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
REQUEST_LOGGING_ENABLED=true
REDIS_URL=your_redis_url_here
CACHE_PREFIX=chatbot:
CACHE_TTL_SECONDS=3600
MAX_CACHE_SIZE=1000
ENABLE_MEMORY_CACHE=true
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SLOW_DOWN_DELAY_MS=500
```

#### File Upload & AI Configuration
```
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_FILES=5
UPLOAD_PATH=./uploads
MEMORY_LIMIT_TOKENS=8000
FALLBACK_MODEL_ID=llama3-8b-8192
PROMPT_TEMPLATE=You are a helpful assistant. Answer concisely and clearly.
VERBOSE_LOGGING=false
```

### Step 3: Deploy
1. Click **Save Changes**
2. Your service will automatically redeploy

## 🔑 API Key Setup Guide

### 1. Clerk.dev (Authentication)
1. Go to [clerk.dev](https://clerk.dev)
2. Create a new application
3. Get your publishable and secret keys from the dashboard
4. Configure your sign-in/sign-up URLs

### 2. Neon.tech (Database)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Get your connection string from the dashboard
4. Run database migrations

### 3. Qdrant Cloud (Vector Database)
1. Go to [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a new cluster
3. Get your API key and cluster URL
4. Create collection: `smart_brain_embeddings`

### 4. Cloudinary (File Storage)
1. Go to [cloudinary.com](https://cloudinary.com)
2. Create a free account
3. Get your Cloud Name, API Key, and API Secret
4. Set up upload presets (optional)
5. Configure CORS settings

### 5. Umami (Analytics)
1. Go to [umami.is](https://umami.is)
2. Create a new website
3. Get your website ID and tracking code

### 6. Groq API (Chat Completions)
1. Go to [console.groq.com](https://console.groq.com)
2. Create an account
3. Get your API key
4. Use model: `llama3-70b-8192`

### 7. Together.ai (Embeddings)
1. Go to [together.ai](https://together.ai)
2. Create an account
3. Get your API key
4. Use model: `togethercomputer/m2-bert-80M-8k-base`

### 8. OpenRouter.ai (Response Evaluation)
1. Go to [openrouter.ai](https://openrouter.ai)
2. Create an account
3. Get your API key
4. Use model: `anthropic/claude-3-5-sonnet`

### 9. LibreTranslate (Translation)
1. Go to [libretranslate.com](https://libretranslate.com)
2. Get your API key (if required)
3. Use the public API or self-host

## 🚨 Important Security Notes

1. **Never commit API keys to git**
2. **Use different keys for development and production**
3. **Rotate keys regularly**
4. **Keep Firebase private key properly formatted**
5. **Use strong JWT secrets**
6. **Enable SSL for database connections**

## 🔄 Migration Steps

1. **Set up all services** (Clerk, Neon, Qdrant, Cloudinary, etc.)
2. **Configure environment variables** in Vercel and Render
3. **Deploy frontend** to Vercel
4. **Deploy backend** to Render
5. **Test all functionality**
6. **Monitor performance and costs**

## 💰 Cost Optimization

- **Groq**: ~$0.05/1M tokens (Gemini: free tier available)
- **Together.ai**: ~$0.10/1M embeddings (Gemini: free tier available)
- **Qdrant Cloud**: ~$25/month (vs Supabase $25/month)
- **Neon**: ~$5/month (vs Supabase $25/month)
- **Clerk**: Free tier available
- **Cloudinary**: Free tier available
- **Umami**: Free tier available

**Total estimated savings: ~86% reduction in costs**

## 🆘 Troubleshooting

### Common Issues:
1. **CORS errors**: Check `CORS_ORIGIN` and `ALLOWED_ORIGINS`
2. **Database connection**: Verify `NEON_DATABASE_URL`
3. **Authentication**: Check Clerk keys and URLs
4. **File upload**: Verify Cloudinary configuration
5. **Vector search**: Check Qdrant connection and collection

### Support:
- Check service-specific documentation
- Monitor application logs in Vercel/Render
- Test endpoints individually
- Verify API key permissions

---

**Your AI chatbot is now ready for production deployment with significant cost savings! 🚀** 