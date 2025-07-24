# 🧠 Smart Brain AI Chatbot - Feature Reference Guide

## 📋 Overview

This guide provides detailed documentation for all major features of the Smart Brain AI Chatbot system, including how they work, expected inputs/outputs, and configuration options.

---

## 💬 Smart Chat

### Description
The core chat functionality powered by Groq's Llama3-70b-8192 model with context-aware responses and streaming support.

### How It Works
1. **Message Processing**: User messages are processed through the Smart Brain service
2. **Context Retrieval**: Relevant documents are retrieved from the vector database
3. **Response Generation**: Groq generates responses with retrieved context
4. **Streaming**: Responses are streamed back to the client in real-time

### API Endpoints
- `POST /api/chat` - Main chat endpoint
- `POST /api/chat/smart` - Smart Brain chat with streaming
- `POST /api/chat/dev` - Development endpoint (no auth)

### Request Format
```json
{
  "message": "What is machine learning?",
  "sessionId": "optional_session_id",
  "mode": "auto",
  "fileFilter": "optional_file_filter",
  "workspace_id": "optional_workspace_id"
}
```

### Response Format
```json
{
  "response": "Machine learning is a subset of artificial intelligence...",
  "context": {
    "retrievedDocuments": [...],
    "mode": "auto",
    "tokensUsed": 1500
  },
  "metadata": {
    "modelUsed": "llama3-70b-8192",
    "responseTime": 2500,
    "confidence": 0.85
  }
}
```

### Configuration Options
```env
GROQ_MODEL=llama3-70b-8192
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=1000
MEMORY_LIMIT_TOKENS=8000
```

### Features
- ✅ Streaming responses
- ✅ Context-aware responses
- ✅ Session management
- ✅ File filtering
- ✅ Multiple conversation modes
- ✅ Response evaluation

---

## 📁 File Upload & Processing

### Description
Multi-modal file upload system supporting documents, images, and audio files with automatic processing and embedding generation.

### Supported File Types
- **Documents**: PDF, DOCX, TXT, CSV, XLS, XLSX
- **Images**: JPG, JPEG, PNG, WebP, HEIC, HEIF
- **Audio**: MP3, WAV, M4A, AAC, OGG, WebM

### How It Works
1. **File Upload**: Files uploaded to Cloudinary
2. **Text Extraction**: OCR for images, parsing for documents
3. **Chunking**: Text split into manageable chunks
4. **Embedding Generation**: Together AI creates embeddings
5. **Vector Storage**: Embeddings stored in Qdrant
6. **Metadata Storage**: File info stored in Neon database

### API Endpoints
- `POST /api/upload` - Upload files
- `DELETE /api/files/:fileId` - Delete file
- `POST /api/parse-file` - Parse file content

### Request Format
```javascript
// Multipart form data
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('sessionId', 'session_123');
formData.append('workspace_id', 'workspace_456');
```

### Response Format
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
  }
}
```

### Configuration Options
```env
MAX_FILE_SIZE=10485760
MAX_FILES=5
UPLOAD_DIR=./uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
```

### Features
- ✅ Multi-modal file support
- ✅ Automatic text extraction
- ✅ OCR for images
- ✅ Audio transcription
- ✅ Chunking and embedding
- ✅ Cloud storage
- ✅ Progress tracking

---

## 🔄 Workflow Execution

### Description
Advanced workflow engine that can execute complex multi-step processes involving multiple AI tools and services.

### How It Works
1. **Workflow Definition**: JSON-based workflow configuration
2. **Step Execution**: Sequential or parallel step processing
3. **Tool Integration**: Integration with various AI tools
4. **Error Handling**: Robust error handling and retry logic
5. **Result Aggregation**: Combining results from multiple steps

### Workflow Types
- **Document Analysis**: Extract, summarize, and analyze documents
- **Data Processing**: Transform and analyze data
- **Content Generation**: Create content from various sources
- **Research Workflows**: Gather and synthesize information

### API Endpoints
- `POST /api/workflows/execute` - Execute workflow
- `GET /api/workflows/templates` - Get workflow templates
- `POST /api/workflows/save` - Save custom workflow

### Request Format
```json
{
  "workflowId": "document_analysis",
  "inputs": {
    "document": "file_id_123",
    "analysisType": "summary"
  },
  "parameters": {
    "maxLength": 500,
    "includeKeyPoints": true
  }
}
```

### Response Format
```json
{
  "success": true,
  "workflowId": "document_analysis",
  "status": "completed",
  "results": {
    "summary": "Document summary...",
    "keyPoints": ["Point 1", "Point 2"],
    "metadata": {
      "executionTime": 5000,
      "stepsCompleted": 3
    }
  }
}
```

### Features
- ✅ Multi-step workflows
- ✅ Tool integration
- ✅ Error handling
- ✅ Progress tracking
- ✅ Result caching
- ✅ Template system

---

## 👑 Admin Controls

### Description
Administrative interface for managing users, monitoring system health, and configuring application settings.

### Admin Features

#### User Management
- **User List**: View all registered users
- **Role Management**: Assign user roles (admin, user, moderator)
- **User Analytics**: View user activity and usage statistics
- **Account Management**: Enable/disable user accounts

#### System Monitoring
- **Health Dashboard**: Real-time system health monitoring
- **Performance Metrics**: API response times, error rates
- **Resource Usage**: CPU, memory, database usage
- **Service Status**: Groq, Together AI, Cloudinary status

#### Configuration Management
- **Environment Variables**: Update system configuration
- **Feature Flags**: Enable/disable features
- **Rate Limiting**: Configure rate limits
- **Security Settings**: Update security policies

### API Endpoints
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/metrics` - System metrics
- `GET /api/admin/health` - Detailed health check
- `POST /api/admin/config` - Update configuration

### Admin Dashboard Features
- ✅ Real-time monitoring
- ✅ User management
- ✅ System configuration
- ✅ Analytics dashboard
- ✅ Log viewing
- ✅ Backup management

---

## 📊 Analytics System

### Description
Comprehensive analytics system for tracking user behavior, system performance, and business metrics.

### Analytics Features

#### User Analytics
- **User Activity**: Login frequency, session duration
- **Feature Usage**: Most used features, popular workflows
- **Performance Metrics**: Response times, error rates
- **User Retention**: User engagement over time

#### System Analytics
- **API Performance**: Response times, throughput
- **Resource Usage**: CPU, memory, storage usage
- **Error Tracking**: Error rates, error types
- **Service Health**: Third-party service status

#### Business Analytics
- **Usage Patterns**: Peak usage times, popular features
- **Cost Analysis**: API usage costs, resource costs
- **Growth Metrics**: User growth, feature adoption
- **ROI Tracking**: Return on investment metrics

### API Endpoints
- `POST /api/analytics/event` - Log analytics event
- `GET /api/analytics/stats` - Get analytics statistics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/system` - System analytics

### Event Types
```javascript
// Chat events
{
  event_type: 'chat_message',
  metadata: {
    message_length: 150,
    model: 'llama3-70b-8192',
    response_time: 2500
  }
}

// File upload events
{
  event_type: 'file_upload',
  metadata: {
    file_type: 'pdf',
    file_size: 1024000,
    processing_time: 5000
  }
}

// Workflow events
{
  event_type: 'workflow_executed',
  metadata: {
    workflow_id: 'document_analysis',
    execution_time: 10000,
    steps_completed: 5
  }
}
```

### Features
- ✅ Real-time tracking
- ✅ Custom events
- ✅ Performance monitoring
- ✅ Cost tracking
- ✅ Export capabilities
- ✅ Dashboard integration

---

## 🛠️ Agent Tools

### Description
Modular agent system with specialized tools for different tasks like summarization, translation, search, and more.

### Available Agents

#### Document Summarizer
- **Purpose**: Summarize long documents
- **Tools**: Text extraction, summarization, key point extraction
- **Input**: Document file or text
- **Output**: Summary, key points, metadata

#### Research Assistant
- **Purpose**: Research and gather information
- **Tools**: Web search, content analysis, fact checking
- **Input**: Research query
- **Output**: Research findings, sources, analysis

#### Translation Agent
- **Purpose**: Translate content between languages
- **Tools**: Language detection, translation, quality check
- **Input**: Text in source language
- **Output**: Translated text, confidence score

#### Data Analyst
- **Purpose**: Analyze data and generate insights
- **Tools**: Data parsing, statistical analysis, visualization
- **Input**: Data file or dataset
- **Output**: Analysis report, charts, insights

### API Endpoints
- `POST /api/agent-tools/execute` - Execute agent tools
- `GET /api/agent-tools/agents` - List available agents
- `GET /api/agent-tools/tools` - List available tools
- `GET /api/agent-tools/agents/:agentId` - Get agent details

### Request Format
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

### Response Format
```json
{
  "success": true,
  "data": {
    "result": "Document summary...",
    "toolsUsed": ["summarize", "extract_key_points"],
    "executionTime": 1500,
    "confidence": 0.85
  }
}
```

### Features
- ✅ Modular agent system
- ✅ Specialized tools
- ✅ Context awareness
- ✅ Quality assessment
- ✅ Extensible architecture
- ✅ Performance optimization

---

## 🎤 Speech-to-Text

### Description
Advanced speech-to-text functionality supporting multiple providers and audio formats.

### Supported Providers
- **AssemblyAI**: High-quality transcription with speaker detection
- **Whisper.cpp**: Local transcription for privacy

### Supported Audio Formats
- MP3, WAV, M4A, AAC, OGG, WebM

### API Endpoints
- `POST /api/whisper/whisper` - Transcribe audio

### Request Format
```javascript
// Multipart form data
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('provider', 'assemblyai'); // or 'whispercpp'
```

### Response Format
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

### Features
- ✅ Multiple providers
- ✅ Speaker detection
- ✅ Word-level timestamps
- ✅ Language detection
- ✅ Confidence scoring
- ✅ Privacy options

---

## 🔐 Authentication & Security

### Description
Comprehensive authentication system using Clerk.dev with role-based access control and security features.

### Authentication Features

#### User Authentication
- **Sign Up**: Email/password registration
- **Sign In**: Email/password login
- **Social Login**: Google, GitHub, etc.
- **Multi-factor Authentication**: SMS, email, authenticator apps

#### Role-Based Access Control
- **Admin**: Full system access
- **User**: Standard user access
- **Moderator**: Content moderation access

#### Security Features
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse
- **Input Validation**: XSS and injection protection
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers

### API Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/verify` - Token verification
- `GET /api/me` - Current user info

### Features
- ✅ Secure authentication
- ✅ Role-based access
- ✅ Multi-factor auth
- ✅ Session management
- ✅ Security headers
- ✅ Rate limiting

---

## 📈 Performance & Optimization

### Description
Performance optimization features for fast response times and efficient resource usage.

### Optimization Features

#### Caching
- **Response Caching**: Cache API responses
- **Embedding Caching**: Cache vector embeddings
- **Session Caching**: Cache user sessions
- **CDN Integration**: Content delivery network

#### Compression
- **Response Compression**: Gzip compression
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Frontend code splitting
- **Lazy Loading**: On-demand resource loading

#### Monitoring
- **Performance Metrics**: Response times, throughput
- **Resource Monitoring**: CPU, memory usage
- **Error Tracking**: Error rates and types
- **Health Checks**: Service health monitoring

### Configuration Options
```env
ENABLE_COMPRESSION=true
CACHE_TTL_SECONDS=3600
MAX_CACHE_SIZE=1000
ENABLE_MEMORY_CACHE=true
```

### Features
- ✅ Response caching
- ✅ Compression
- ✅ CDN integration
- ✅ Performance monitoring
- ✅ Resource optimization
- ✅ Health checks

---

## 🔧 Configuration Options

### Environment Variables

#### AI/ML Services
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=1000

TOGETHER_API_KEY=your_together_api_key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base
```

#### Database & Storage
```env
NEON_DATABASE_URL=your_neon_database_url
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

#### Security & Performance
```env
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL_SECONDS=3600
```

### Frontend Configuration
```javascript
// API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_GROQ_MODEL=llama3-70b-8192

// Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key

// File Storage
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### Feature Flags
```javascript
// Enable/disable features
ENABLE_STREAMING=true
ENABLE_FILE_UPLOAD=true
ENABLE_WORKFLOWS=true
ENABLE_ANALYTICS=true
ENABLE_ADMIN_PANEL=true
```

---

## 📚 Additional Resources

### Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)

### External Documentation
- [Groq API Documentation](https://console.groq.com/docs)
- [Together AI Documentation](https://docs.together.ai/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Neon Documentation](https://neon.tech/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Clerk Documentation](https://clerk.com/docs)

---

*This feature reference guide documents all major features of the Smart Brain AI Chatbot system using modern AI/ML providers and cloud services.* 