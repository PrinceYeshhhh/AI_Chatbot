# ⚙️ Smart Brain AI Chatbot - Configuration Reference

## 📋 Overview

This guide provides a complete reference for all configurable values in the Smart Brain AI Chatbot system, including environment variables, frontend flags, and system settings.

---

## 🔧 Environment Variables

### Server Configuration

#### Basic Server Settings
```env
# Server Configuration
PORT=3001                                    # Server port (default: 3001)
NODE_ENV=production                          # Environment (development/production)
CORS_ORIGIN=https://your-frontend.vercel.app # Allowed CORS origin
ALLOWED_ORIGINS=https://your-frontend.vercel.app # Multiple CORS origins
FRONTEND_URL=https://your-frontend.vercel.app   # Frontend URL
API_BASE_URL=https://your-backend.onrender.com  # Backend API URL
LOG_LEVEL=info                               # Logging level (debug/info/warn/error)
```

#### Security Settings
```env
# Security Configuration
HELMET_ENABLED=true                         # Enable security headers
COMPRESSION_ENABLED=true                    # Enable response compression
REQUEST_LOGGING_ENABLED=true               # Enable request logging
ENCRYPTION_KEY=your_32_byte_encryption_key # 32-byte encryption key
JWT_SECRET=your_jwt_secret_key_here        # JWT signing secret
JWT_EXPIRES_IN=24h                         # JWT token expiration
```

#### Rate Limiting
```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000                # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100                # Max requests per window
SLOW_DOWN_DELAY_MS=500                     # Slow down delay after limit
```

---

### AI/ML Services Configuration

#### Groq (Chat Completions)
```env
# Groq Configuration
GROQ_API_KEY=gsk-your-groq-api-key-here    # Groq API key
GROQ_MODEL=llama3-70b-8192                 # Default model
GROQ_TEMPERATURE=0.7                       # Response randomness (0-1)
GROQ_MAX_TOKENS=1000                       # Max tokens per response
GROQ_TOP_P=0.9                             # Nucleus sampling parameter
GROQ_FREQUENCY_PENALTY=0.0                 # Frequency penalty
GROQ_PRESENCE_PENALTY=0.0                  # Presence penalty
```

#### Together AI (Embeddings)
```env
# Together AI Configuration
TOGETHER_API_KEY=your_together_api_key      # Together AI API key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base # Embedding model
TOGETHER_BASE_URL=https://api.together.xyz  # API base URL
TOGETHER_TIMEOUT=30000                      # Request timeout (ms)
```

#### OpenRouter (Response Evaluation)
```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key # OpenRouter API key
OPENROUTER_MODEL=anthropic/claude-3-5-sonnet # Evaluation model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1 # API base URL
```

#### LibreTranslate (Translation)
```env
# LibreTranslate Configuration
LIBRETRANSLATE_API_KEY=your_libretranslate_api_key # API key
LIBRETRANSLATE_URL=https://libretranslate.com # Service URL
LIBRETRANSLATE_BASE_URL=https://libretranslate.com # Base URL
```

---

### Database Configuration

#### Neon PostgreSQL
```env
# Neon Database Configuration
NEON_DATABASE_URL=postgresql://username:password@host:port/database # Connection string
NEON_HOST=your-neon-host.neon.tech         # Database host
NEON_DATABASE=your_database_name            # Database name
NEON_USERNAME=your_username                 # Database username
NEON_PASSWORD=your_password                 # Database password
NEON_PORT=5432                             # Database port
NEON_SSL=true                              # Enable SSL
```

#### Qdrant Vector Database
```env
# Qdrant Configuration
QDRANT_URL=https://your-cluster-id.us-east-1-0.aws.cloud.qdrant.io:6333 # Cluster URL
QDRANT_API_KEY=your_qdrant_api_key         # API key
QDRANT_COLLECTION=smart_brain_embeddings   # Collection name
QDRANT_COLLECTION_NAME=smart_brain_embeddings # Collection name (alias)
VECTOR_SIMILARITY_THRESHOLD=0.7            # Similarity threshold (0-1)
MAX_RETRIEVAL_RESULTS=5                    # Max results to retrieve
VECTOR_DIMENSION=768                       # Embedding dimension
```

---

### File Storage Configuration

#### Cloudinary
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name # Cloud name
CLOUDINARY_API_KEY=your_cloudinary_api_key # API key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret # API secret
CLOUDINARY_UPLOAD_PRESET=your_preset       # Upload preset (optional)
CLOUDINARY_FOLDER=users                     # Default folder
```

#### File Upload Settings
```env
# File Upload Configuration
UPLOAD_DIR=./uploads                        # Upload directory
MAX_FILE_SIZE=10485760                     # Max file size (10MB)
MAX_FILES=5                                # Max files per upload
UPLOAD_PATH=./uploads                      # Upload path
ALLOWED_FILE_TYPES=.txt,.md,.csv,.pdf,.json # Allowed file types
```

---

### Authentication Configuration

#### Clerk.dev
```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key # Secret key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key # Publishable key
CLERK_JWT_ISSUER=https://clerk.your-domain.com # JWT issuer
CLERK_JWT_AUDIENCE=your_audience           # JWT audience
CLERK_WEBHOOK_SECRET=your_webhook_secret  # Webhook secret
```

---

### Analytics Configuration

#### Umami Analytics
```env
# Umami Configuration
UMAMI_WEBSITE_ID=your_umami_website_id     # Website ID
UMAMI_URL=https://your-umami-instance.com  # Umami URL
UMAMI_API_KEY=your_umami_api_key           # API key
UMAMI_BASE_URL=https://umami.is            # Base URL
```

---

### Payment Configuration

#### Stripe
```env
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key   # Secret key
STRIPE_WEBHOOK_SECRET=your_webhook_secret # Webhook secret
STRIPE_PRICE_PRO_MONTHLY=your_price_id    # Pro monthly price ID
STRIPE_PRICE_ENTERPRISE=your_price_id     # Enterprise price ID
STRIPE_PUBLISHABLE_KEY=your_publishable_key # Publishable key
```

---

### Cache Configuration

#### Redis
```env
# Redis Configuration
REDIS_URL=your_redis_url_here              # Redis connection URL
CACHE_PREFIX=chatbot:                       # Cache key prefix
CACHE_TTL_SECONDS=3600                     # Cache TTL (seconds)
MAX_CACHE_SIZE=1000                        # Max cache entries
ENABLE_MEMORY_CACHE=true                   # Enable in-memory cache
```

---

## 🎛️ Frontend Configuration

### API Configuration
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001    # Backend API URL
VITE_GROQ_MODEL=llama3-70b-8192           # Default Groq model
VITE_TOGETHER_MODEL=togethercomputer/m2-bert-80M-8k-base # Default embedding model
VITE_API_TIMEOUT=30000                     # API timeout (ms)
VITE_MAX_RETRIES=3                         # Max API retries
```

### Authentication Configuration
```env
# Clerk Frontend Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key # Publishable key
VITE_CLERK_SIGN_IN_URL=/sign-in            # Sign-in URL
VITE_CLERK_SIGN_UP_URL=/sign-up            # Sign-up URL
VITE_CLERK_AFTER_SIGN_IN_URL=/             # After sign-in redirect
VITE_CLERK_AFTER_SIGN_UP_URL=/             # After sign-up redirect
```

### File Storage Configuration
```env
# Cloudinary Frontend Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name # Cloud name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key # API key
VITE_CLOUDINARY_API_SECRET=your_cloudinary_api_secret # API secret
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset # Upload preset
```

### Analytics Configuration
```env
# Analytics Configuration
VITE_UMAMI_WEBSITE_ID=your_umami_website_id # Umami website ID
VITE_UMAMI_URL=https://your-umami-instance.com # Umami URL
VITE_GOOGLE_ANALYTICS_ID=your_ga_id        # Google Analytics ID
```

### Development Configuration
```env
# Development Settings
VITE_DEV_MODE=true                         # Enable development mode
VITE_ENABLE_DEBUG=true                     # Enable debug logging
VITE_ENABLE_MOCK_DATA=false                # Enable mock data
VITE_LOG_LEVEL=info                        # Log level
```

---

## 🔧 System Configuration

### AI Model Configuration
```env
# AI Model Settings
MEMORY_LIMIT_TOKENS=8000                   # Memory limit for context
FALLBACK_MODEL_ID=llama3-8b-8192          # Fallback model
PROMPT_TEMPLATE=You are a helpful assistant. Answer concisely and clearly. # Default prompt
MAX_CONTEXT_LENGTH=4000                    # Max context length
TEMPERATURE_DEFAULT=0.7                    # Default temperature
MAX_TOKENS_DEFAULT=1000                    # Default max tokens
```

### Vector Search Configuration
```env
# Vector Search Settings
VECTOR_SIMILARITY_THRESHOLD=0.7            # Similarity threshold
MAX_RETRIEVAL_RESULTS=5                    # Max results to retrieve
MIN_SIMILARITY_SCORE=0.5                   # Minimum similarity score
EMBEDDING_BATCH_SIZE=10                    # Batch size for embeddings
VECTOR_CACHE_TTL=3600                      # Vector cache TTL
```

### File Processing Configuration
```env
# File Processing Settings
CHUNK_SIZE=1000                            # Text chunk size
CHUNK_OVERLAP=200                          # Chunk overlap
MAX_FILE_SIZE_MB=10                        # Max file size in MB
ALLOWED_MIME_TYPES=application/pdf,text/plain # Allowed MIME types
OCR_ENABLED=true                           # Enable OCR
AUDIO_TRANSCRIPTION_ENABLED=true           # Enable audio transcription
```

### Security Configuration
```env
# Security Settings
ENABLE_RATE_LIMITING=true                  # Enable rate limiting
ENABLE_CORS=true                           # Enable CORS
ENABLE_HELMET=true                         # Enable security headers
ENABLE_COMPRESSION=true                    # Enable compression
MAX_REQUEST_SIZE=10mb                      # Max request size
SESSION_SECRET=your_session_secret         # Session secret
```

### Performance Configuration
```env
# Performance Settings
ENABLE_CACHING=true                        # Enable caching
CACHE_TTL_SECONDS=3600                     # Cache TTL
MAX_CACHE_SIZE=1000                        # Max cache size
ENABLE_COMPRESSION=true                    # Enable compression
WORKER_THREADS=4                           # Number of worker threads
CLUSTER_MODE=false                         # Enable cluster mode
```

---

## 🚀 Feature Flags

### Core Features
```env
# Feature Flags
ENABLE_STREAMING=true                      # Enable streaming responses
ENABLE_FILE_UPLOAD=true                    # Enable file uploads
ENABLE_WORKFLOWS=true                      # Enable workflow execution
ENABLE_ANALYTICS=true                      # Enable analytics
ENABLE_ADMIN_PANEL=true                    # Enable admin panel
ENABLE_AGENT_TOOLS=true                    # Enable agent tools
ENABLE_SPEECH_TO_TEXT=true                 # Enable speech-to-text
ENABLE_TRANSLATION=true                    # Enable translation
```

### Advanced Features
```env
# Advanced Features
ENABLE_AUTO_EVALUATION=true               # Enable response evaluation
ENABLE_MEMORY=true                         # Enable user memory
ENABLE_FINE_TUNING=true                    # Enable model fine-tuning
ENABLE_BATCH_PROCESSING=true               # Enable batch processing
ENABLE_WEBHOOKS=true                       # Enable webhooks
ENABLE_API_DOCS=true                       # Enable API documentation
```

---

## 📊 Monitoring Configuration

### Logging Configuration
```env
# Logging Settings
LOG_LEVEL=info                             # Log level
LOG_FORMAT=json                            # Log format
LOG_FILE=logs/app.log                      # Log file path
LOG_MAX_SIZE=10m                           # Max log file size
LOG_MAX_FILES=5                            # Max log files
ENABLE_REQUEST_LOGGING=true                # Enable request logging
ENABLE_ERROR_LOGGING=true                  # Enable error logging
```

### Health Check Configuration
```env
# Health Check Settings
HEALTH_CHECK_INTERVAL=30s                  # Health check interval
HEALTH_CHECK_TIMEOUT=10s                   # Health check timeout
HEALTH_CHECK_RETRIES=3                     # Health check retries
ENABLE_DETAILED_HEALTH=true                # Enable detailed health checks
```

### Metrics Configuration
```env
# Metrics Settings
ENABLE_METRICS=true                        # Enable metrics collection
METRICS_PORT=9090                          # Metrics port
METRICS_PATH=/metrics                      # Metrics path
ENABLE_PROMETHEUS=true                     # Enable Prometheus metrics
```

---

## 🔧 Development Configuration

### Development Settings
```env
# Development Configuration
NODE_ENV=development                       # Environment
VERBOSE_LOGGING=true                       # Enable verbose logging
ENABLE_HOT_RELOAD=true                     # Enable hot reload
ENABLE_DEBUG_MODE=true                     # Enable debug mode
ENABLE_MOCK_SERVICES=false                 # Enable mock services
```

### Testing Configuration
```env
# Testing Settings
TEST_DATABASE_URL=your_test_db_url         # Test database URL
TEST_API_KEY=your_test_api_key             # Test API key
ENABLE_TEST_MODE=true                      # Enable test mode
TEST_TIMEOUT=10000                         # Test timeout
```

---

## 📋 Configuration Validation

### Required Variables
The following variables are **required** and will cause the application to fail if missing:

```env
# Critical Required Variables
GROQ_API_KEY                               # Groq API key
TOGETHER_API_KEY                           # Together AI API key
NEON_DATABASE_URL                          # Database URL
QDRANT_URL                                 # Qdrant URL
QDRANT_API_KEY                             # Qdrant API key
CLOUDINARY_CLOUD_NAME                      # Cloudinary cloud name
CLOUDINARY_API_KEY                         # Cloudinary API key
CLOUDINARY_API_SECRET                      # Cloudinary API secret
CLERK_SECRET_KEY                           # Clerk secret key
JWT_SECRET                                 # JWT secret
ENCRYPTION_KEY                             # Encryption key
```

### Optional Variables
The following variables are **optional** but recommended:

```env
# Optional but Recommended
REDIS_URL                                  # Redis URL for caching
STRIPE_SECRET_KEY                          # Stripe for payments
UMAMI_API_KEY                              # Umami for analytics
GOOGLE_API_KEY                             # Google AI Studio (Gemini) as backup
```

---

## 🔧 Configuration Management

### Environment File Structure
```
project/
├── server/
│   ├── .env.example                       # Backend environment template
│   └── .env                               # Backend environment (gitignored)
└── client/
    ├── .env.example                       # Frontend environment template
    └── .env                               # Frontend environment (gitignored)
```

### Configuration Validation
```javascript
// Configuration validation function
function validateEnv() {
  const required = [
    'GROQ_API_KEY',
    'TOGETHER_API_KEY',
    'NEON_DATABASE_URL',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLERK_SECRET_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### Configuration Updates
```bash
# Update environment variables
railway variables set GROQ_API_KEY=new_key
vercel env add VITE_API_BASE_URL

# Reload configuration
npm run restart
```

---

## 📚 Configuration Examples

### Development Environment
```env
# Development Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
VERBOSE_LOGGING=true
ENABLE_REQUEST_LOGGING=true
```

### Production Environment
```env
# Production Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
LOG_LEVEL=info
ENABLE_COMPRESSION=true
ENABLE_HELMET=true
ENABLE_RATE_LIMITING=true
```

### Testing Environment
```env
# Testing Configuration
NODE_ENV=test
PORT=3002
LOG_LEVEL=error
ENABLE_MOCK_SERVICES=true
TEST_DATABASE_URL=your_test_db_url
```

---

*This configuration reference provides a complete guide to all configurable values in the Smart Brain AI Chatbot system.* 