import { QdrantService } from './qdrantService';
import fetch from 'node-fetch';
import fs from 'fs';

const qdrant = new QdrantService();

function randomVector(dim = 768) {
  return Array.from({ length: dim }, () => Math.random() - 0.5);
}

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

export async function embedText(text: string): Promise<number[]> {
  // TODO: REMOVE after replacement
  // TODO: Plug in real text embedding model (e.g., Google AI Studio Gemini, Together)
  return randomVector();
}

export async function embedImage(imagePath: string): Promise<number[]> {
  // Real implementation using CLIP/BLIP2 via Python microservice
  const fileBuffer = fs.readFileSync(imagePath);
  const response = await fetch('http://localhost:8000/image-embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': imagePath },
    body: fileBuffer
  });
  if (!response.ok) {
    throw new Error(`Image embedding failed: ${response.status} ${await response.text()}`);
  }
  const data: any = await response.json();
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('No embedding returned from image-embed endpoint');
  }
  return normalizeVector(data.embedding);
}

export async function embedAudio(audioPath: string): Promise<number[]> {
  // Real implementation using Wav2Vec2/Whisper via Python microservice
  const fileBuffer = fs.readFileSync(audioPath);
  const response = await fetch('http://localhost:8000/audio-embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': audioPath },
    body: fileBuffer
  });
  if (!response.ok) {
    throw new Error(`Audio embedding failed: ${response.status} ${await response.text()}`);
  }
  const data: any = await response.json();
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('No embedding returned from audio-embed endpoint');
  }
  return normalizeVector(data.embedding);
}

export async function embedVideo(videoPath: string): Promise<number[]> {
  // Stub: extract frames, embed each frame, extract transcript, embed transcript, merge all
  // TODO: REMOVE after replacement
  const embeddings: number[][] = [];
  const { framePaths, transcript } = await extractFramesAndTranscript(videoPath);
  for (const framePath of framePaths) {
    const frameEmbedding = await embedImage(framePath);
    embeddings.push(frameEmbedding);
  }
  if (transcript) {
    const textEmbedding = await embedText(transcript);
    embeddings.push(textEmbedding);
  }
  // Merge: simple average
  if (embeddings.length === 0) throw new Error('No embeddings generated for video');
  const dim = embeddings[0].length;
  const merged = Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) merged[i] += emb[i];
  }
  for (let i = 0; i < dim; i++) merged[i] /= embeddings.length;
  return normalizeVector(merged);
}

// Helper: extract frames and transcript from video
async function extractFramesAndTranscript(videoPath: string): Promise<{ framePaths: string[]; transcript: string }> {
  // Use ffmpeg to extract frames (1 per second)
  const path = await import('path');
  const fs = await import('fs');
  const { spawn } = await import('child_process');
  const frameDir = videoPath + '_frames';
  if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
  const framePattern = `${frameDir}/frame_%04d.jpg`;
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-i', videoPath, '-vf', 'fps=1', '-q:v', '2', framePattern]);
    ffmpeg.on('close', (code) => (code === 0 ? resolve(null) : reject(new Error('ffmpeg frame extraction failed'))));
  });
  const framePaths = fs.readdirSync(frameDir)
    .filter(f => f.endsWith('.jpg'))
    .map(f => path.join(frameDir, f));
  // Extract audio and transcript
  const audioPath = videoPath.replace(path.extname(videoPath), '.wav');
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-i', videoPath, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', audioPath]);
    ffmpeg.on('close', (code) => (code === 0 ? resolve(null) : reject(new Error('ffmpeg audio extraction failed'))));
  });
  // Call Python microservice for transcript
  const fetch = (await import('node-fetch')).default;
  const fsRead = fs.readFileSync(audioPath);
  const response = await fetch('http://localhost:8000/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': audioPath },
    body: fsRead
  });
  let transcript = '';
  if (response.ok) {
    const data: any = await response.json();
    transcript = data.text || '';
  }
  return { framePaths, transcript };
}

export async function storeEmbedding({
  id,
  userId,
  fileId,
  chunk,
  embeddingVector,
  chunkIndex,
  fileName,
  modality,
  mimeType,
  extra = {}
}: {
  id: string;
  userId: string;
  fileId: string;
  chunk: string;
  embeddingVector: number[];
  chunkIndex: number;
  fileName: string;
  modality: 'text' | 'image' | 'audio' | 'video';
  mimeType?: string;
  extra?: Record<string, any>;
}) {
  // Ensure required metadata fields
  const now = Date.now();
  extra = extra || {};
  const source_type = extra['source_type'] || modality;
  const timestamp = extra['timestamp'] !== undefined ? extra['timestamp'] : now;
  const is_temporary = extra['is_temporary'] !== undefined ? extra['is_temporary'] : false;
  await qdrant.storeEmbedding(id, {
    userId,
    fileId,
    chunk,
    embeddingVector,
    chunkIndex,
    fileName,
    modality,
    mimeType,
    source_type,
    timestamp,
    is_temporary,
    ...extra
  });
} 