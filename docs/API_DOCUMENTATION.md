# 🤖 Smart Brain AI Chatbot - Complete API Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Smart Brain AI Chatbot system, which uses **Groq** for chat completions, **Together AI** for embeddings, and **Cloudinary** for file storage.

---

## 🔧 Current System Architecture

### AI/ML Providers
- **Chat Completions**: Groq (Llama3-70b-8192)
- **Embeddings**: Together AI (m2-bert-80M-8k-base)
- **File Storage**: Cloudinary
- **Database**: Neon PostgreSQL
- **Vector Database**: Qdrant Cloud
- **Authentication**: Clerk.dev

---

## 📚 API Endpoints

### 🔐 Authentication Endpoints

#### `POST /api/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt_token_here",
  "message": "User registered successfully"
}
```

#### `POST /api/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clerk_user_id",
    "email": "user@example.com",
    "name": "Clerk User"
  },
  "token": "clerk_token",
  "message": "Login successful"
}
```

#### `POST /api/verify`
Verify JWT token validity.

**Request Body:**
```json
{
  "token": "jwt_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `GET /api/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### 💬 Chat Endpoints

#### `POST /api/chat`
Main chat endpoint with Smart Brain integration.

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What is machine learning?",
  "sessionId": "optional_session_id",
  "mode": "auto",
  "fileFilter": "optional_file_filter",
  "workspace_id": "optional_workspace_id"
}
```

**Response (Streaming):**
```
data: {"type":"response","content":"Machine learning is...","context":{...},"metadata":{...}}

data: [DONE]
```

#### `POST /api/chat/smart`
Smart Brain chat with streaming support.

**Request Body:**
```json
{
  "message": "Explain quantum computing",
  "sessionId": "session_123",
  "mode": "auto",
  "fileFilter": "recent"
}
```

#### `POST /api/chat/dev`
Development endpoint (no auth required).

**Request Body:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Development response to: \"Hello, how are you?\"",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userId": "dev-user"
}
```

---

### 📁 File Upload Endpoints

#### `POST /api/upload`
Upload files for processing and embedding.

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: Array of files (PDF, DOCX, TXT, CSV, XLSX, images, audio)
- `sessionId`: Optional session ID
- `workspace_id`: Optional workspace ID

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded and processed successfully",
  "files": [
    {
      "originalName": "document.pdf",
      "filename": "document-1234567890.pdf",
      "size": 1024000,
      "mimetype": "application/pdf",
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "users/user123/files/document-1234567890",
      "chunks": 15,
      "status": "processed"
    }
  ],
  "processingResults": [...],
  "vectorStats": {
    "totalDocuments": 150,
    "totalChunks": 2500,
    "collectionSize": "2.5MB"
  },
  "count": 1,
  "sessionId": "session_123"
}
```

#### `DELETE /api/files/:fileId`
Delete a file and its embeddings.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "File and embeddings deleted successfully"
}
```

---

### 🧠 Training Endpoints

#### `GET /api/training/data`
Get training data with pagination.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "input": "What is AI?",
      "expectedOutput": "AI is artificial intelligence...",
      "intent": "definition",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "userId": "user123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `POST /api/training/data`
Add training data.

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "input": "What is machine learning?",
  "expectedOutput": "Machine learning is a subset of AI...",
  "intent": "definition"
}
```

#### `POST /api/training/data/bulk`
Bulk add training data.

**Request Body:**
```json
{
  "data": [
    {
      "input": "Hello",
      "expectedOutput": "Hi there!",
      "intent": "greeting"
    },
    {
      "input": "Goodbye",
      "expectedOutput": "See you later!",
      "intent": "farewell"
    }
  ]
}
```

#### `DELETE /api/training/data/:id`
Delete specific training data.

#### `GET /api/training/stats`
Get training statistics.

**Response:**
```json
{
  "success": true,
  "total": 50,
  "byIntent": {
    "definition": 20,
    "greeting": 15,
    "farewell": 10,
    "other": 5
  },
  "recent": [...]
}
```

#### `GET /api/training/export`
Export training data.

**Query Parameters:**
- `format`: Export format (`json` or `csv`)

---

### 📊 Status & Health Endpoints

#### `GET /api/status`
Get overall system status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 10485760,
    "external": 1048576
  },
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "vector": {
      "status": "healthy",
      "documents": 150,
      "chunks": 2500
    },
    "cache": {
      "status": "healthy",
      "keys": 100,
      "hits": 85
    },
    "database": {
      "status": "configured"
    }
  }
}
```

#### `GET /api/status/health`
Simple health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0"
}
```

#### `GET /api/status/config`
Get configuration information.

**Response:**
```json
{
  "success": true,
  "nodeEnv": "production",
  "port": 3001,
  "corsOrigin": "https://your-frontend.vercel.app",
  "llmModel": "llama3-70b-8192",
  "embeddingModel": "togethercomputer/m2-bert-80M-8k-base",
  "vectorCollection": "smart_brain_embeddings",
  "hasNeon": true,
  "hasQdrant": true,
  "hasRedis": true,
  "version": "1.0.0"
}
```

---

### 🎤 Speech-to-Text Endpoints

#### `POST /api/whisper/whisper`
Transcribe audio to text.

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `audio`: Audio file (MP3, WAV, M4A, etc.)
- `provider`: Transcription provider (`assemblyai` or `whispercpp`)

**Response:**
```json
{
  "transcription": "Hello, this is a test transcription.",
  "words": [
    {
      "text": "Hello",
      "start": 0.0,
      "end": 0.5,
      "confidence": 0.95
    }
  ],
  "utterances": [
    {
      "speaker": "A",
      "start": 0.0,
      "end": 2.5,
      "text": "Hello, this is a test transcription."
    }
  ],
  "metadata": {
    "language": "en",
    "confidence": 0.92
  }
}
```

---

### 🛠️ Agent Tools Endpoints

#### `POST /api/agent-tools/execute`
Execute agent tools based on user prompt.

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Summarize this document",
  "context": {
    "workspaceId": "workspace_123",
    "sessionId": "session_456",
    "userPreferences": {},
    "conversationHistory": []
  },
  "agentId": "summarizer",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": "Document summary...",
    "toolsUsed": ["summarize", "extract_key_points"],
    "executionTime": 1500
  }
}
```

#### `GET /api/agent-tools/agents`
Get all available agents.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "summarizer",
      "name": "Document Summarizer",
      "description": "Summarizes long documents",
      "tools": ["summarize", "extract_key_points"]
    }
  ]
}
```

#### `GET /api/agent-tools/tools`
Get all available tools.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "summarize",
      "description": "Summarize text content",
      "parameters": {
        "text": "string",
        "maxLength": "number"
      }
    }
  ]
}
```

---

### 📈 Analytics Endpoints

#### `POST /api/analytics/event`
Log analytics event.

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_type": "chat_message",
  "metadata": {
    "message_length": 150,
    "model": "llama3-70b-8192",
    "response_time": 2500
  },
  "session_id": "session_123",
  "workspace_id": "workspace_456"
}
```

#### `GET /api/analytics/stats`
Get analytics statistics.

**Query Parameters:**
- `period`: Time period (`day`, `week`, `month`)
- `user_id`: Filter by user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 1250,
    "totalFiles": 85,
    "activeUsers": 45,
    "averageResponseTime": 1800,
    "popularModels": {
      "llama3-70b-8192": 800,
      "gpt-4o": 450
    }
  }
}
```

---

## 🔒 Authentication & Security

### JWT Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required Headers
- `Authorization`: Bearer token for protected endpoints
- `Content-Type`: `application/json` for JSON requests
- `Content-Type`: `multipart/form-data` for file uploads

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 🚀 Rate Limiting

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Slow Down**: 500ms delay after 50 requests
- **Whisper Endpoint**: 10 requests per minute per IP

---

## 📝 Environment Variables

### Required Variables
```env
# AI/ML Services
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
TOGETHER_API_KEY=your_together_api_key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base

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
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_SECRET=your_jwt_secret

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 🔧 Testing

### Test Chat Endpoint
```bash
curl -X POST http://localhost:3001/api/test-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### Health Check
```bash
curl http://localhost:3001/health
```

### API Documentation
Visit `http://localhost:3001/api/docs` for interactive Swagger UI.

---

## 📊 Monitoring

### Metrics Endpoint
```bash
curl http://localhost:3001/api/metrics
```

### Health Status
```bash
curl http://localhost:3001/api/status
```

---

*This documentation reflects the current system architecture using Groq, Together AI, Google AI Studio (Gemini), Cloudinary, and other modern providers instead of OpenAI.* 