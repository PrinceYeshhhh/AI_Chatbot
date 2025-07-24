# 📚 Smart Brain AI Chatbot - Complete Documentation

## 🎯 Overview

Welcome to the comprehensive documentation for the **Smart Brain AI Chatbot** system. This documentation covers everything you need to know about setting up, developing, deploying, and maintaining the system.

The Smart Brain AI Chatbot uses modern AI/ML providers including **Groq** for chat completions, **Together AI** for embeddings, **Cloudinary** for file storage, and **Neon** for the database.

---

## 📖 Documentation Index

### 🚀 Getting Started
- **[Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md)** - Complete guide to set up the project locally
- **[API Documentation](./API_DOCUMENTATION.md)** - Comprehensive API reference with examples
- **[Configuration Reference](./CONFIGURATION_REFERENCE.md)** - All configurable values and settings

### 🏗️ Development & Deployment
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Feature Reference](./FEATURE_REFERENCE.md)** - Detailed documentation of all features
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

### 📋 Quick Start

#### 1. Prerequisites
- Node.js v18.0.0 or higher
- npm or pnpm package manager
- Git for version control
- Accounts for: Groq, Together AI, Cloudinary, Neon, Qdrant, Clerk

#### 2. Quick Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd AI_Chatbot_2/project

# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit .env files with your API keys

# Start development servers
cd server && npm run dev
cd ../client && npm run dev
```

#### 3. Test the System
```bash
# Test health check
curl http://localhost:3001/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/test-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

---

## 🏗️ System Architecture

### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React/Vite)  │◄──►│  (Express.js)   │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (Neon)        │
                       └─────────────────┘
```

### Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **AI/ML**: Groq (Llama3-70b-8192), Together AI (embeddings)
- **Database**: Neon PostgreSQL
- **Vector Database**: Qdrant Cloud
- **File Storage**: Cloudinary
- **Authentication**: Clerk.dev
- **Deployment**: Railway, Vercel, Docker

---

## 🔧 Key Features

### 🤖 Smart Chat
- Context-aware responses using Groq's Llama3-70b-8192
- Streaming responses for real-time interaction
- File-aware conversations
- Session management and history

### 📁 File Processing
- Multi-modal file support (PDF, DOCX, images, audio)
- Automatic text extraction and OCR
- Vector embedding generation
- Cloud storage with Cloudinary

### 🛠️ Agent Tools
- Modular agent system
- Specialized tools for different tasks
- Document summarization
- Research and translation capabilities

### 📊 Analytics
- User behavior tracking
- System performance monitoring
- Cost analysis and optimization
- Real-time metrics

### 🔐 Security
- JWT-based authentication
- Role-based access control
- Rate limiting and protection
- Input validation and sanitization

---

## 🚀 Quick Deployment

### Railway (Backend)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd server
railway login
railway up
```

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd client
vercel --prod
```

### Docker
```bash
# Build and run with Docker Compose
docker-compose up -d
```

---

## 📊 API Endpoints

### Core Endpoints
- `POST /api/chat` - Main chat endpoint
- `POST /api/upload` - File upload and processing
- `GET /api/status` - System health and status
- `POST /api/auth/login` - User authentication

### Development Endpoints
- `POST /api/test-chat` - Test chat (no auth required)
- `GET /api/docs` - Interactive API documentation
- `GET /health` - Simple health check

### Admin Endpoints
- `GET /api/admin/users` - User management
- `GET /api/admin/metrics` - System metrics
- `POST /api/admin/config` - Configuration management

---

## 🔧 Configuration

### Required Environment Variables
```env
# AI/ML Services
GROQ_API_KEY=gsk-your-groq-api-key
TOGETHER_API_KEY=your_together_api_key

# Database
NEON_DATABASE_URL=postgresql://username:password@host:port/database

# Vector Database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
JWT_SECRET=your_jwt_secret_key
```

### Frontend Configuration
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

---

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd client
npm test
npm run test:coverage
```

### API Testing
```bash
# Test health check
curl http://localhost:3001/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/test-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

---

## 📈 Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /api/status` - Detailed system status
- `GET /api/metrics` - Performance metrics

### Logging
- Structured logging with Pino
- Request/response logging
- Error tracking and monitoring
- Performance monitoring

### Analytics
- User behavior tracking
- System performance metrics
- Cost analysis
- Error rate monitoring

---

## 🔒 Security

### Authentication
- JWT-based token authentication
- Clerk.dev integration
- Role-based access control
- Multi-factor authentication support

### Protection
- Rate limiting (100 requests/15min)
- CORS configuration
- Input validation and sanitization
- XSS and injection protection
- Security headers with Helmet

---

## 🚨 Troubleshooting

### Common Issues
1. **"GROQ_API_KEY not found"** - Check environment variables
2. **"Database connection failed"** - Verify Neon database URL
3. **"File upload failed"** - Check Cloudinary credentials
4. **"Authentication failed"** - Verify Clerk configuration

### Debug Mode
```env
VERBOSE_LOGGING=true
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=debug
```

### Getting Help
- Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- Review server logs: `tail -f server/logs/combined.log`
- Test individual services
- Check API documentation at `/api/docs`

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
- [Documentation Site](https://your-docs.com)

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Quality
```bash
# Backend
cd server
npm run lint
npm run type-check
npm test

# Frontend
cd client
npm run lint
npm run type-check
npm test
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** for fast LLM inference
- **Together AI** for embeddings
- **Cloudinary** for file storage
- **Neon** for PostgreSQL database
- **Qdrant** for vector database
- **Clerk** for authentication

---

*This documentation reflects the current system architecture using modern AI/ML providers (Groq, Gemini, Together) and cloud services instead of OpenAI.*

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 