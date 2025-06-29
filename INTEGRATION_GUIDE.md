# AI Chatbot Frontend-Backend Integration Guide

## Overview

This guide explains how to integrate the React frontend with the Node.js backend that includes AI/ML/NLP capabilities. The integration has been completed and the system is ready for testing.

## What's Been Integrated

### ✅ Frontend Changes Made

1. **Updated `chatService.ts`**:
   - Replaced mock responses with actual API calls to backend
   - Implemented streaming chat responses
   - Added proper error handling and fallbacks
   - Connected training data management to backend APIs

2. **Updated `TrainingModal.tsx`**:
   - Fixed property names to match `TrainingData` interface
   - Connected to actual `chatService.addTrainingData()` method
   - Updated display to show correct training data properties

3. **Environment Configuration**:
   - Created `env.example` for frontend configuration
   - Updated API endpoints to use environment variables
   - Added proper CORS configuration

### ✅ Backend Features Available

1. **Chat API** (`/api/chat`):
   - Streaming responses with OpenAI integration
   - Vector similarity search for context
   - Conversation history support
   - Caching and rate limiting

2. **Training API** (`/api/training`):
   - Add single training examples
   - Bulk training data import
   - Training statistics
   - Export training data

3. **Upload API** (`/api/upload`):
   - Document processing (PDF, CSV, DOCX, etc.)
   - Vector embeddings generation
   - File validation and security

4. **Status API** (`/api/status`):
   - System health monitoring
   - Performance metrics
   - Service status

## Quick Start

### 1. Environment Setup

```bash
# Copy environment templates
cp env.example .env
cp server/env.example server/.env

# Edit the files with your configuration
# - Add your OpenAI API key
# - Adjust server ports if needed
# - Configure CORS origins
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 3. Start Development Servers

**Option A: Use the startup script (recommended)**
```bash
# On Windows
start-dev.bat

# On Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

**Option B: Manual start**
```bash
# Start both servers concurrently
npm run dev

# Or start separately
npm run dev:frontend  # Frontend on :5173
npm run dev:backend   # Backend on :3001
```

### 4. Verify Integration

1. **Frontend**: http://localhost:5173
2. **Backend Health**: http://localhost:3001/health
3. **API Documentation**: Check the backend routes for available endpoints

## Configuration

### Frontend Environment Variables (`.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_ENABLE_STREAMING=true
VITE_ENABLE_CACHING=true
VITE_ENABLE_ERROR_TRACKING=true
```

### Backend Environment Variables (`server/.env`)

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_RETRIEVAL_RESULTS=5
```

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Main chat endpoint with streaming
- `POST /api/chat/simple` - Non-streaming chat endpoint

### Training Endpoints
- `POST /api/training` - Add single training example
- `POST /api/training/bulk` - Add multiple training examples
- `GET /api/training/stats` - Get training statistics
- `DELETE /api/training/clear` - Clear all training data

### Upload Endpoints
- `POST /api/upload` - Upload and process documents
- `GET /api/upload/files` - List uploaded files

### Status Endpoints
- `GET /health` - System health check
- `GET /api/status` - Detailed system status

## Testing the Integration

### 1. Test Chat Functionality
1. Open the frontend at http://localhost:5173
2. Send a message in the chat
3. Verify you get a response from the backend
4. Check that streaming works (if enabled)

### 2. Test Training Functionality
1. Open the Training Modal
2. Add a training example
3. Verify it appears in the training data list
4. Check that it's stored in the backend

### 3. Test File Upload
1. Upload a document (PDF, TXT, etc.)
2. Verify it's processed and added to the vector store
3. Ask questions about the uploaded content

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check `CORS_ORIGIN` in backend `.env`
   - Ensure frontend URL matches the CORS configuration

2. **API Connection Failed**:
   - Verify backend is running on port 3001
   - Check `VITE_API_BASE_URL` in frontend `.env`
   - Test backend health endpoint

3. **OpenAI API Errors**:
   - Verify API key is set correctly
   - Check API key has sufficient credits
   - Ensure the model specified is available

4. **Training Data Not Saving**:
   - Check backend training endpoints are working
   - Verify database/vector store is initialized
   - Check console for error messages

### Debug Mode

Enable debug logging by setting:
```env
VITE_LOG_LEVEL=debug
LOG_LEVEL=debug
```

## Next Steps

After successful integration, you can:

1. **Add Authentication**: Implement user authentication and authorization
2. **Enhance AI Features**: Add more sophisticated NLP capabilities
3. **Improve UI/UX**: Add more interactive features and better error handling
4. **Add Monitoring**: Implement comprehensive logging and monitoring
5. **Deploy**: Set up production deployment with proper security

## Support

If you encounter issues:
1. Check the console logs in both frontend and backend
2. Verify all environment variables are set correctly
3. Test individual API endpoints using tools like Postman
4. Check the backend logs in the `server/logs/` directory 