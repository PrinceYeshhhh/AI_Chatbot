# 🤖 AI Chatbot Backend

Advanced AI/ML backend service for the chatbot application with vector embeddings, document processing, and intelligent chat capabilities.

## 🚀 Features

### Core AI/ML Capabilities
- **Vector Embeddings**: ChromaDB + Together AI or Gemini embeddings for semantic search
- **Document Processing**: Support for TXT, PDF, CSV, MD, JSON, DOCX files
- **Intelligent Chat**: Context-aware responses with streaming support
- **Auto-Training**: Instant model updates from uploaded documents

### Backend Infrastructure
- **Express.js**: Fast, unopinionated web framework
- **LangChain**: Advanced AI/ML orchestration
- **Rate Limiting**: Protection against abuse
- **Caching**: In-memory caching for performance
- **Logging**: Comprehensive logging with Winston
- **Validation**: Request validation with Joi

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev
```

## 🔧 Configuration

### Required Environment Variables

```bash
# AI/ML Services Configuration
GROQ_API_KEY=gsk-your-groq-api-key-here
GROQ_MODEL=llama3-70b-8192
TOGETHER_API_KEY=your-together-api-key-here
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Vector Database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=smart_brain_embeddings

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=.txt,.md,.csv,.pdf,.json
```

## 🛠 API Endpoints

### Chat API
```bash
# Stream chat response
POST /api/chat
{
  "message": "What is machine learning?",
  "conversationHistory": [...],
  "useContext": true
}

# Simple chat response
POST /api/chat/simple
{
  "message": "Hello",
  "useContext": false
}

# Get context for query
GET /api/chat/context/machine%20learning?limit=5
```

### Upload API
```bash
# Upload files
POST /api/upload
Content-Type: multipart/form-data
files: [file1.pdf, file2.txt, ...]

# Upload text content
POST /api/upload/text
{
  "content": "Your text content here",
  "filename": "example.txt"
}

# Get upload status
GET /api/upload/status

# Clear all uploads
DELETE /api/upload/clear
```

### Training API
```bash
# Add training example
POST /api/training
{
  "input": "What is AI?",
  "expectedOutput": "AI is artificial intelligence...",
  "intent": "definition",
  "confidence": 0.95
}

# Bulk training
POST /api/training/bulk
[
  {
    "input": "Hello",
    "expectedOutput": "Hi there!",
    "intent": "greeting"
  },
  ...
]

# Get training stats
GET /api/training/stats

# Clear training data
DELETE /api/training/clear
```

### Status API
```bash
# System status
GET /api/status

# Health check
GET /api/status/health

# Configuration info
GET /api/status/config

# Recent logs (dev only)
GET /api/status/logs?lines=100
```

## 🐳 Docker Deployment

### Single Container
```bash
# Build image
docker build -t ai-chatbot-backend .

# Run container
docker run -p 3001:3001 \
  -e GROQ_API_KEY=your-key \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/vector_store:/app/vector_store \
  ai-chatbot-backend
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ai-chatbot-backend

# Stop services
docker-compose down
```

## 🔄 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Check logs
tail -f logs/combined.log
```

### File Processing Pipeline
1. **Upload**: Files uploaded via `/api/upload`
2. **Processing**: Documents parsed and chunked
3. **Embedding**: Text converted to vectors using Together AI or Gemini
4. **Storage**: Vectors stored in ChromaDB
5. **Retrieval**: Similarity search during chat

### Chat Flow
1. **Query**: User sends message to `/api/chat`
2. **Context**: Relevant documents retrieved from vector store
3. **Prompt**: Context + query formatted for LLM
4. **Response**: Streamed response from Groq or Gemini
5. **Cache**: Response cached for performance

## 📊 Monitoring

### Health Checks
```bash
# Basic health
curl http://localhost:3001/health

# Detailed status
curl http://localhost:3001/api/status

# Vector store stats
curl http://localhost:3001/api/training/stats
```

### Logs
```bash
# Application logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Docker logs
docker-compose logs -f ai-chatbot-backend
```

## 🔒 Security

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable via environment variables
- Automatic slowdown for high-frequency requests

### Input Validation
- All requests validated with Joi schemas
- File type and size restrictions
- Content sanitization

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Request logging and monitoring

## 🚀 Performance

### Caching
- In-memory cache for frequent queries
- Configurable TTL and size limits
- Automatic cleanup of expired entries

### Vector Search
- Optimized similarity search with ChromaDB
- Configurable similarity thresholds
- Efficient embedding storage

### File Processing
- Streaming file uploads
- Chunked document processing
- Parallel processing for multiple files

## 🐛 Troubleshooting

### Common Issues

**Gemini API Errors**
```bash
# Check API key
curl -H "Authorization: Bearer $GROQ_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models

# Verify environment variables
npm run config
```

**Vector Store Issues**
```bash
# Check ChromaDB status
curl http://localhost:3001/api/status

# Clear and reinitialize
curl -X DELETE http://localhost:3001/api/upload/clear
```

**File Upload Problems**
```bash
# Check upload directory permissions
ls -la uploads/

# Verify file size limits
curl http://localhost:3001/api/upload/status
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# View detailed logs
tail -f logs/combined.log | grep DEBUG
```

## 📈 Scaling

### Horizontal Scaling
- Stateless design for easy scaling
- Shared vector store across instances
- Load balancer configuration included

### Performance Optimization
- Connection pooling for databases
- Efficient memory management
- Optimized embedding operations

### Production Deployment
- Docker multi-stage builds
- Health checks and monitoring
- Graceful shutdown handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🧪 Backend Endpoint Testing

- All backend endpoints should have automated tests (e.g., using supertest or similar).
- **TODO:** Add or update tests for the following endpoints:
  - [ ] /api/chat (chat.js)
  - [ ] /api/upload (upload.js)
  - [ ] /api/status (status.js)
  - [ ] /api/training (training.js)
- Ensure tests cover success, error, and edge cases for each endpoint.
- See `server/src/routes/` for endpoint implementations.

## ⚠️ TODOs & Further Review
- [ ] Review all API endpoints for up-to-date documentation (see /api/chat, /api/upload, /api/status, /api/training).
- [ ] Ensure all new features (rate limiting, input validation, Gemini usage logging, etc.) are reflected in docs.
- [ ] Add/expand OpenAPI/Swagger docs as needed.
- [ ] Review and update this README after major changes.