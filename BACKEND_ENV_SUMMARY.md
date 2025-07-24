# Backend Environment Variables Summary

## ✅ Complete Backend Environment Configuration

This document provides a comprehensive overview of all environment variables required for the Smart Brain AI Chatbot backend.

---

## 📋 Environment Variables by Category

### 🔧 **Server Configuration**
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-name.vercel.app
ALLOWED_ORIGINS=https://your-frontend-name.vercel.app
FRONTEND_URL=https://your-frontend-name.vercel.app
API_BASE_URL=https://your-backend-name.onrender.com
LOG_LEVEL=info
```

### 🔐 **Authentication (Clerk.dev)**
```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_JWT_ISSUER=https://clerk.your-domain.com
CLERK_JWT_AUDIENCE=your_audience
```

### 🗄️ **Database (Neon.tech)**
```env
NEON_DATABASE_URL=postgresql://username:password@host:port/database
NEON_HOST=your-neon-host.neon.tech
NEON_DATABASE=your_database_name
NEON_USERNAME=your_username
NEON_PASSWORD=your_password
NEON_PORT=5432
NEON_SSL=true
```

### 🔍 **Vector Database (Qdrant Cloud)**
```env
QDRANT_URL=https://your-cluster-id.us-east-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=smart_brain_embeddings
QDRANT_COLLECTION_NAME=smart_brain_embeddings
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVAL_RESULTS=5
```

### ☁️ **File Storage (Cloudinary)**
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 📊 **Analytics (Umami)**
```env
UMAMI_WEBSITE_ID=your_umami_website_id
UMAMI_URL=https://your-umami-instance.com
UMAMI_API_KEY=your_umami_api_key
UMAMI_BASE_URL=https://umami.is
```

### 🤖 **AI/ML Services**

#### Google AI Studio (Gemini API)
```env
GOOGLE_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-pro
```

#### Groq API (Chat Completions)
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=1000
```

#### Together.ai (Embeddings)
```env
TOGETHER_API_KEY=your_together_api_key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
TOGETHER_BASE_URL=https://api.together.xyz
```

#### OpenRouter.ai (Response Evaluation)
```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3-5-sonnet
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

#### LibreTranslate (Translation)
```env
LIBRETRANSLATE_API_KEY=your_libretranslate_api_key
LIBRETRANSLATE_URL=https://libretranslate.com
LIBRETRANSLATE_BASE_URL=https://libretranslate.com
```

### 🔒 **JWT & Security**
```env
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
REQUEST_LOGGING_ENABLED=true
ENCRYPTION_KEY=your_32_byte_encryption_key_here_make_it_random
```

### ⚡ **Cache & Performance**
```env
REDIS_URL=your_redis_url_here
CACHE_PREFIX=chatbot:
CACHE_TTL_SECONDS=3600
MAX_CACHE_SIZE=1000
ENABLE_MEMORY_CACHE=true
```

### 🚦 **Rate Limiting**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SLOW_DOWN_DELAY_MS=500
```

### 📁 **File Upload Configuration**
```env
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_FILES=5
UPLOAD_PATH=./uploads
```

### 💳 **Stripe Configuration (Optional)**
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_PRO_MONTHLY=your_stripe_price_id_pro
STRIPE_PRICE_ENTERPRISE=your_stripe_price_id_enterprise
```

### 🤖 **AI Model Configuration**
```env
MEMORY_LIMIT_TOKENS=8000
FALLBACK_MODEL_ID=llama3-8b-8192
PROMPT_TEMPLATE=You are a helpful assistant. Answer concisely and clearly.
```

### 🔧 **Development Settings**
```env
VERBOSE_LOGGING=false
```

---

## ✅ Required Variables (Validation)

The following variables are **required** and will cause the application to fail if missing:

### 🔴 **Critical Required Variables**
```env
GROQ_API_KEY
TOGETHER_API_KEY
QDRANT_URL
QDRANT_API_KEY
CLERK_SECRET_KEY
NEON_HOST
NEON_DATABASE
NEON_USER
NEON_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
JWT_SECRET
ENCRYPTION_KEY
```

### 🟡 **Optional but Recommended Variables**
```env
OPENAI_API_KEY (backup LLM)
REDIS_URL (for caching)
STRIPE_SECRET_KEY (for payments)
UMAMI_API_KEY (for analytics)
```

---

## 🔍 Validation Status

### ✅ **Configuration Validation**
- All required variables are defined in `config/index.ts`
- Environment validation function checks for missing variables
- Default values provided where appropriate

### ✅ **Service Integration**
- **Authentication**: Clerk.dev integration complete
- **Database**: Neon PostgreSQL integration complete
- **Vector Database**: Qdrant integration complete
- **File Storage**: Cloudinary integration complete
- **AI Services**: Groq, Together.ai, OpenRouter integration complete
- **Analytics**: Umami integration complete
- **Security**: JWT and encryption complete

### ✅ **Missing Variables Check**
All environment variables used in the codebase are now included in the `env.example` file.

---

## 🚀 Deployment Checklist

### ✅ **Required for Production**
1. Set all critical required variables
2. Configure CORS origins for your domain
3. Set up Cloudinary account and credentials
4. Configure Neon database connection
5. Set up Qdrant vector database
6. Configure Clerk authentication
7. Set up AI service API keys

### ✅ **Optional for Production**
1. Configure Redis for caching (recommended)
2. Set up Stripe for payments (if needed)
3. Configure Umami for analytics
4. Set up monitoring and logging

---

## 📝 Notes

- **Security**: Never commit actual API keys to git
- **Development**: Use different keys for development and production
- **Rotation**: Rotate keys regularly for security
- **Backup**: Keep backup API keys for critical services
- **Monitoring**: Monitor usage and costs for all services

---

**Status**: ✅ Complete  
**Last Updated**: December 2024  
**Next Steps**: Deploy with all required variables configured 