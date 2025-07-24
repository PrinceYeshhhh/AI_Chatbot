# 🚀 Smart Brain AI Chatbot - Developer Setup Guide

## 📋 Overview

This guide will help you set up the Smart Brain AI Chatbot project locally for development. The system uses **Groq** for chat completions, **Together AI** for embeddings, **Cloudinary** for file storage, and **Neon** for the database.

---

## 🛠️ Prerequisites

### Required Tools
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**: Package manager
- **Git**: Version control
- **Docker** (optional): For containerized development
- **PostgreSQL**: Neon database (cloud-hosted)

### Required Accounts
- **Groq**: For LLM chat completions
- **Together AI**: For embeddings
- **Cloudinary**: For file storage
- **Neon**: For PostgreSQL database
- **Qdrant**: For vector database
- **Clerk**: For authentication

---

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd AI_Chatbot_2/project
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd server
npm install
```

#### Frontend Dependencies
```bash
cd ../client
npm install
```

### 3. Environment Configuration

#### Backend Environment (.env)
Create `project/server/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug

# AI/ML Services
GROQ_API_KEY=gsk-your-groq-api-key-here
GROQ_MODEL=llama3-70b-8192
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=1000

TOGETHER_API_KEY=your_together_api_key_here
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
TOGETHER_BASE_URL=https://api.together.xyz

# Database (Neon)
NEON_DATABASE_URL=postgresql://username:password@host:port/database
NEON_HOST=your-neon-host.neon.tech
NEON_DATABASE=your_database_name
NEON_USERNAME=your_username
NEON_PASSWORD=your_password
NEON_PORT=5432
NEON_SSL=true

# Vector Database (Qdrant)
QDRANT_URL=https://your-cluster-id.us-east-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=smart_brain_embeddings
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVAL_RESULTS=5

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_JWT_ISSUER=https://clerk.your-domain.com
CLERK_JWT_AUDIENCE=your_audience

# JWT & Security
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=your_32_byte_encryption_key_here_make_it_random

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SLOW_DOWN_DELAY_MS=500

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_FILES=5

# Development Settings
VERBOSE_LOGGING=true
ENABLE_REQUEST_LOGGING=true
```

#### Frontend Environment (.env)
Create `project/client/.env`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_GROQ_MODEL=llama3-70b-8192
VITE_TOGETHER_MODEL=togethercomputer/m2-bert-80M-8k-base

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/
VITE_CLERK_AFTER_SIGN_UP_URL=/

# File Storage (Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
VITE_CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Analytics (Optional)
VITE_UMAMI_WEBSITE_ID=your_umami_website_id
VITE_UMAMI_URL=https://your-umami-instance.com

# Development
VITE_DEV_MODE=true
VITE_ENABLE_DEBUG=true
```

### 4. Database Setup

#### Create Database Tables
Run the database migrations:

```bash
cd server
npm run migrate:data
```

Or manually create the required tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'processing',
  cloudinary_url TEXT,
  cloudinary_public_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  message TEXT NOT NULL,
  response TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  session_id VARCHAR(255),
  workspace_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Start Development Servers

#### Backend Development
```bash
cd server
npm run dev
```

The backend will start on `http://localhost:3001`

#### Frontend Development
```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
npm run test:coverage
```

### Run Frontend Tests
```bash
cd client
npm test
npm run test:coverage
```

### Run E2E Tests
```bash
cd server
npm run test:e2e
```

---

## 🔍 API Testing

### Test Chat Endpoint
```bash
curl -X POST http://localhost:3001/api/test-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### Test Health Check
```bash
curl http://localhost:3001/health
```

### Test Authentication
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## 📊 Monitoring & Debugging

### View Logs
```bash
# Backend logs
cd server
tail -f logs/combined.log

# Frontend logs (in browser console)
```

### API Documentation
Visit `http://localhost:3001/api/docs` for interactive Swagger UI.

### Health Dashboard
Visit `http://localhost:3001/api/status` for system health information.

---

## 🐳 Docker Development

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - ./server:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./client
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3001
    volumes:
      - ./client:/app
      - /app/node_modules

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chatbot
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 🔧 Development Workflow

### 1. Code Quality
```bash
# Backend linting
cd server
npm run lint
npm run lint:fix

# Frontend linting
cd client
npm run lint
npm run lint:fix
```

### 2. Type Checking
```bash
# Backend
cd server
npm run type-check

# Frontend
cd client
npm run type-check
```

### 3. Building for Production
```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "GROQ_API_KEY not found"
- Ensure you have a valid Groq API key
- Check that the environment variable is set correctly
- Verify the key has sufficient credits

#### 2. "TOGETHER_API_KEY not found"
- Ensure you have a valid Together AI API key
- Check that the environment variable is set correctly
- Verify the key has sufficient credits

#### 3. "Database connection failed"
- Check your Neon database URL
- Ensure the database is accessible
- Verify SSL settings

#### 4. "Qdrant connection failed"
- Check your Qdrant URL and API key
- Ensure the cluster is running
- Verify the collection exists

#### 5. "Cloudinary upload failed"
- Check your Cloudinary credentials
- Ensure the cloud name is correct
- Verify API key permissions

#### 6. "Clerk authentication failed"
- Check your Clerk secret key
- Ensure the domain is configured
- Verify JWT settings

### Debug Mode
Enable verbose logging:

```env
VERBOSE_LOGGING=true
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=debug
```

### Performance Monitoring
```bash
# Monitor memory usage
node --inspect server/src/index.ts

# Monitor API performance
curl http://localhost:3001/api/metrics
```

---

## 📚 Additional Resources

### Documentation
- [Groq API Documentation](https://console.groq.com/docs)
- [Together AI Documentation](https://docs.together.ai/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Neon Documentation](https://neon.tech/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Clerk Documentation](https://clerk.com/docs)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)

---

## ✅ Setup Checklist

- [ ] Node.js v18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (backend & frontend)
- [ ] Environment variables configured
- [ ] Database tables created
- [ ] API keys obtained (Groq, Together AI, Cloudinary, etc.)
- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 5173
- [ ] Health check passing
- [ ] Test chat working
- [ ] File upload working
- [ ] Authentication working

---

*This setup guide reflects the current system architecture using modern AI/ML providers (Groq, Gemini, Together) instead of OpenAI.* 