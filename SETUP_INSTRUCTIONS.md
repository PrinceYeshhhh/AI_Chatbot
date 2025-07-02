# AI Chatbot Setup Instructions

## Current Status ✅
- **Frontend**: Working (React + TypeScript)
- **Backend**: Working (Node.js + Express)
- **Integration**: Complete between frontend and backend
- **File Upload**: Working
- **Training Data**: Working
- **Vector Store**: Working (in-memory with fallback)

## What You Need to Do

### 1. Add Your OpenAI API Key (Optional but Recommended)
To enable full AI/ML/NLP features, add your OpenAI API key:

1. Go to https://platform.openai.com/account/api-keys
2. Create a new API key
3. Edit `project/server/.env` file
4. Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 2. Start the Application

#### Option A: Start Both Frontend and Backend Together
```bash
cd project
npm run dev
```
This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

#### Option B: Start Separately
```bash
# Terminal 1 - Frontend
cd project
npm run dev:frontend

# Terminal 2 - Backend  
cd project/server
npm run dev
```

### 3. Test the Application

1. **Open your browser** to http://localhost:5173
2. **You should see** the intro animation, then the chat interface
3. **Test features**:
   - Send a chat message
   - Upload a file (PDF, TXT, CSV, etc.)
   - Open Training Modal (brain icon)
   - Add training examples
   - Export training data

## What Works Without OpenAI API Key

✅ **All UI features** (chat interface, file upload, training modal)
✅ **File upload and processing** (PDF, TXT, CSV, JSON, DOCX)
✅ **Training data management** (add, delete, export)
✅ **Vector store** (simple text matching fallback)
✅ **All backend endpoints** (status, health checks)

## What Requires OpenAI API Key

❌ **AI chat responses** (will show "AI service unavailable" message)
❌ **Advanced vector embeddings** (uses simple text matching instead)
❌ **Context-aware responses** (limited functionality)

## Troubleshooting

### If Backend Won't Start
- Check that Node.js version is 18+ (`node --version`)
- Make sure all dependencies are installed (`npm install` in both project and project/server)
- Check the logs for specific error messages

### If Frontend Shows Errors
- Make sure backend is running on port 3001
- Check browser console for specific error messages
- Try refreshing the page

### If File Upload Doesn't Work
- Check that the `uploads` directory exists in `project/server/`
- Make sure backend is running and accessible

## Next Steps

Once you have the basic application running:

1. **Add your OpenAI API key** for full AI functionality
2. **Test all features** thoroughly
3. **Customize the UI** as needed
4. **Deploy to production** when ready

## Support

If you encounter any issues:
1. Check the browser console for frontend errors
2. Check the terminal for backend errors
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

The application is now **fully functional** and ready for use! 🚀 