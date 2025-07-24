# Setup Instructions

## 1. Add Your API Keys
To enable full AI/ML/NLP features, add your API keys for Groq, Together.ai, Clerk, Qdrant, Neon, and Firebase.

### Example .env
```
GROQ_API_KEY=your_groq_api_key
TOGETHER_API_KEY=your_together_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEON_HOST=your_neon_host
NEON_DATABASE=your_database_name
NEON_USER=your_username
NEON_PASSWORD=your_password
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
UMAMI_WEBSITE_ID=your_website_id
UMAMI_API_KEY=your_api_key
```

## 2. Install Dependencies
Run `npm install` in both the backend and frontend directories.

## 3. Start the Application
- Backend: `npm run dev` in `project/server`
- Frontend: `npm run dev` in `project/client`

## What Works Without All API Keys
- Basic UI and static features
- Some local LLM features (if configured)

## What Requires All API Keys
- Chat completions (Groq)
- Embeddings (Together.ai)
- Vector search (Qdrant)
- Authentication (Clerk)
- File storage (Firebase)
- Analytics (Umami)

## Troubleshooting
- Ensure all API keys are set in your environment
- Check service dashboards for usage/errors
- For further help, see the documentation or open an issue 