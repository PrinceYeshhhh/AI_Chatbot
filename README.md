# AI Chatbot Platform – Universal File Intelligence

## Overview
This project is a modern, cost-effective, **multimodal AI chatbot platform**. It now supports:
- **Local LLMs (Ollama: Mistral, LLaMA2, etc.)** for chat completions and RAG
- **Local Embeddings (SentenceTransformers: all-MiniLM-L6-v2)**
- **Qdrant** (or FAISS/Supabase) for vector database
- **Python microservice** for all multimodal extraction (PDF, OCR, Whisper, tables)
- **No paid APIs required** – 100% open-source stack

## Supported File Types
- **Documents**: PDF, DOCX, TXT, CSV, XLSX
- **Images**: JPG, JPEG, PNG, WebP, HEIC, HEIF
- **Audio**: MP3, WAV, M4A, AAC, OGG, WebM
- **Video**: MP4 (audio extracted and transcribed)

## How it Works
1. **Upload**: User uploads any supported file
2. **Detection**: File type is detected (MIME/ext)
3. **Processing**: Routed to correct open-source processor:
   - PDF: pdfplumber
   - DOCX: python-docx
   - TXT: plain read
   - CSV/XLSX: pandas
   - Image: pytesseract/easyocr
   - Audio: Whisper (local)
   - Video: ffmpeg (audio extraction) + Whisper
4. **Extraction**: Text/content and metadata are extracted
5. **Chunking & Embedding**: Content is chunked (modality-aware) and embedded (SentenceTransformers)
6. **Vector Storage**: Embeddings + metadata stored in Qdrant (or FAISS/Supabase)
7. **RAG Answering**: User queries fetch only their file vectors, context is assembled, and local LLM (Ollama) answers
8. **Deletion**: File, embeddings, and DB refs are all removed on delete

## Local AI Stack
- **Ollama** (Mistral, LLaMA2, etc.) for LLM
- **SentenceTransformers** for embeddings
- **pdfplumber, pandas, pytesseract, easyocr, Whisper, ffmpeg** for extraction
- **Qdrant** (or FAISS/Supabase) for vector DB
- **FastAPI Python microservice** for all multimodal extraction

## Setup Instructions
1. Clone the repository
2. Install dependencies (Node.js, Python, Ollama, Qdrant, etc.)
3. Set up your environment variables (see `.env.example`)
4. Start the backend, frontend, and Python microservice

## Environment Variables
(see `.env.example` for details)

## Migration Status
- All OpenAI, Together.ai, and paid API dependencies have been removed.
- The platform now uses only open-source, local providers.
- All documentation, code, and tests are up to date.

## Support
For issues or questions, please open an issue or contact the maintainers.

## User Onboarding Guide

### 1. Uploading Files
- Click the **Upload** button on the main page.
- Select any supported file (PDF, DOCX, TXT, CSV, XLSX, image, audio, video).
- Wait for the status: **Uploading → Processing → Ready**.

### 2. Previewing Files
- Images: Thumbnail preview shown.
- Audio: Built-in player appears.
- Text/Docs: File name and icon shown.

### 3. Asking Questions
- Type your question in the chat input (e.g., "Summarize this PDF").
- The AI will answer using only your uploaded files.

### 4. Deleting Files
- Click the **Delete** button next to any file.
- File, embeddings, and all references are removed.

### 5. Best Practices
- Use clear file names (e.g., `invoice_march2024.pdf`).
- Keep files under 50MB for best performance.
- For large docs, split into logical sections/files.

### 6. Troubleshooting
- If upload fails: check file type/size, try again.
- If preview/answer is missing: file may be corrupt or unsupported.
- For persistent issues, contact support or check logs.

### 7. Video Walkthrough
- [Video script and link coming soon]

### 8. Example Screenshots
- ![Upload Example](./docs/screenshots/upload.png)
- ![Preview Example](./docs/screenshots/preview.png)
- ![Chat Example](./docs/screenshots/chat.png)