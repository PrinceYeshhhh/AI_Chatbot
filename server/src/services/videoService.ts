import path from 'path';
import fs from 'fs';
import { embedText, embedVideo, storeEmbedding } from './multimodalEmbeddingService';
import { spawn } from 'child_process';
import { runOCR, runObjectSceneDetection } from '../utils/visionUtils';
import { transcribeAudio } from '../utils/audioUtils';
import { LLMService } from './llmService';
import { embedImage, embedAudio, storeEmbedding as storeEmbeddingMultimodal } from './multimodalEmbeddingService';
// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

// In-memory store for processed videos and embeddings
const videoDataStore: Record<string, any> = {};
const videoChunkEmbeddings: Record<string, Array<{ chunk: string; embedding: number[]; jobId: string }>> = {};

function fakeEmbed(text: string): number[] {
  // Stub: returns a vector of text length
  return [text.length % 100, text.length % 97, text.length % 89];
}

function cosineSim(a: number[], b: number[]): number {
  // Simple cosine similarity stub
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB + 1e-8);
}

function chunkText(text: string, maxTokens = 500): string[] {
  // Simple split by sentences, not real token count
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).split(' ').length > maxTokens) {
      chunks.push(current.trim());
      current = '';
    }
    current += s + ' ';
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function keywordOverlap(chunk: string, query: string): number {
  const chunkWords = new Set(chunk.toLowerCase().split(/\W+/));
  const queryWords = new Set(query.toLowerCase().split(/\W+/));
  let overlap = 0;
  for (const w of queryWords) if (chunkWords.has(w)) overlap++;
  return overlap / (queryWords.size || 1);
}

interface VideoJob {
  payload: {
    filePath: string;
    originalName: string;
    userId: string;
    workspaceId?: string;
  };
  id: string;
}

/**
 * Extract frames from a video at a given interval (in seconds) using ffmpeg.
 * Returns an array of frame file paths.
 */
async function extractFramesAtInterval(filePath: string, intervalSec: number, maxFrames = 100): Promise<string[]> {
  const frameDir = filePath + '_frames';
  if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
  // ffmpeg -i input.mp4 -vf fps=1 output_%04d.jpg
  const framePattern = `${frameDir}/frame_%04d.jpg`;
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-i', filePath, '-vf', `fps=1/${intervalSec}`, '-q:v', '2', framePattern]);
    ffmpeg.on('close', (code) => (code === 0 ? resolve(null) : reject(new Error('ffmpeg frame extraction failed'))));
  });
  // Collect frame paths
  const frames = fs.readdirSync(frameDir)
    .filter(f => f.endsWith('.jpg'))
    .slice(0, maxFrames)
    .map(f => path.join(frameDir, f));
  return frames;
}

/**
 * Full SmartBrain video understanding pipeline
 * @param file Video file (path or File object with .path)
 * @param userId User ID
 */
export async function processVideoFile(file: { path?: string; id?: string; name?: string } | string, userId: string) {
  const filePath = typeof file === 'string' ? file : file.path ?? '';
  const fileId = typeof file === 'string' ? file : file.id ?? filePath ?? '';
  const fileName = typeof file === 'string' ? file : file.name ?? (filePath ? (filePath.split(/[\\/]/).pop() ?? '') : '');
  const frameDir = `${filePath}_frames`;
  const frameEmbeddings: number[][] = [];
  const transcriptEmbeddings: number[][] = [];
  const audioEmbeddings: number[][] = [];
  // 1. Frame Extraction
  try {
    if (filePath && !fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
    if (filePath) {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
          .outputOptions(['-vf', 'fps=1', '-q:v 2'])
          .output(`${frameDir}/frame_%04d.jpg`)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      const frameFiles: string[] = fs.readdirSync(frameDir).filter(f => f.endsWith('.jpg'));
      for (let i = 0; i < frameFiles.length; i++) {
        const framePath = path.join(frameDir, frameFiles[i] ?? '');
        try {
          const embedding = await embedImage(framePath);
          await storeEmbeddingMultimodal({
            id: `${fileId}_frame_${i}`,
            userId,
            fileId,
            chunk: '[FRAME]',
            embeddingVector: embedding,
            chunkIndex: i,
            fileName,
            modality: 'image',
            mimeType: 'image/jpeg',
            extra: { source_type: 'video-frame', timestamp: i, is_temporary: false }
          });
          frameEmbeddings.push(embedding);
        } catch (err) {
          console.error('Frame embedding failed:', err);
        }
      }
    }
  } catch (err) {
    console.error('Frame extraction/embedding failed:', err);
  }
  // 2. Audio Extraction & Transcription
  let audioPath = filePath ? filePath.replace(/\.[^.]+$/, '.wav') : '';
  try {
    if (filePath) {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
          .noVideo()
          .audioChannels(1)
          .audioFrequency(16000)
          .audioCodec('pcm_s16le')
          .output(audioPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      // Transcribe audio (Whisper)
      const fetch = (await import('node-fetch')).default;
      const audioBuffer = fs.readFileSync(audioPath);
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': audioPath },
        body: audioBuffer
      });
      let transcript = '';
      if (response.ok) {
        const data = await response.json() as any;
        transcript = data && typeof data.text === 'string' ? data.text : '';
      }
      // Chunk transcript and embed
      const chunks: string[] = transcript.split(/(?<=[.!?])\s+/).filter(Boolean);
      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunkText = chunks[i] ?? '';
          const embedding = await embedText(chunkText);
          await storeEmbeddingMultimodal({
            id: `${fileId}_transcript_${i}`,
            userId,
            fileId,
            chunk: chunkText,
            embeddingVector: embedding,
            chunkIndex: i,
            fileName,
            modality: 'text',
            mimeType: 'text/plain',
            extra: { source_type: 'transcript', timestamp: i, is_temporary: false }
          });
          transcriptEmbeddings.push(embedding);
        } catch (err) {
          console.error('Transcript embedding failed:', err);
        }
      }
      // Optionally embed raw audio
      try {
        const audioEmbedding = await embedAudio(audioPath ?? '');
        await storeEmbeddingMultimodal({
          id: `${fileId}_audio`,
          userId,
          fileId,
          chunk: '[AUDIO]',
          embeddingVector: audioEmbedding,
          chunkIndex: 0,
          fileName,
          modality: 'audio',
          mimeType: 'audio/wav',
          extra: { source_type: 'audio', timestamp: 0, is_temporary: false }
        });
        audioEmbeddings.push(audioEmbedding);
      } catch (err) {
        console.error('Audio embedding failed:', err);
      }
    }
  } catch (err) {
    console.error('Audio extraction/transcription/embedding failed:', err);
  }
  return {
    frameEmbeddings,
    transcriptEmbeddings,
    audioEmbeddings
  };
}

export async function processVideoJob(job: VideoJob, lang: string = 'en', frameIntervalSec: number = 1) {
  if (!job.payload) throw new Error('Missing job payload');
  const { filePath, originalName, userId } = job.payload;
  const llmService = new LLMService();
  // 1. Extract audio using ffmpeg
  const audioPath = filePath.replace(path.extname(filePath), '.wav');
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-i', filePath, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', audioPath]);
    ffmpeg.on('close', (code) => (code === 0 ? resolve(null) : reject(new Error('ffmpeg failed'))));
  });
  // 2. Transcribe audio (Whisper)
  const transcript = await transcribeAudio(audioPath, lang);
  // 2b. NLP: Extract entities, topics, semantic meaning
  const [entities, topics, semanticMeaning] = await Promise.all([
    llmService.extractEntities(transcript),
    llmService.extractTopics(transcript),
    llmService.extractSemanticMeaning(transcript)
  ]);
  // Embed entities
  if (Array.isArray(entities) && entities.length > 0) {
    const entityEmbedding = await embedText(entities.join(', '));
    await storeEmbedding({
      id: `${job.id}_entities`,
      userId,
      fileId: job.id,
      chunk: `[ENTITIES] ${entities.join(', ')}`,
      embeddingVector: entityEmbedding,
      chunkIndex: 0,
      fileName: originalName,
      modality: 'text',
      mimeType: 'text/plain',
      extra: { type: 'entities', workspaceId: job.payload?.workspaceId || null }
    });
  }
  // Embed topics
  if (Array.isArray(topics) && topics.length > 0) {
    const topicEmbedding = await embedText(topics.join(', '));
    await storeEmbedding({
      id: `${job.id}_topics`,
      userId,
      fileId: job.id,
      chunk: `[TOPICS] ${topics.join(', ')}`,
      embeddingVector: topicEmbedding,
      chunkIndex: 0,
      fileName: originalName,
      modality: 'text',
      mimeType: 'text/plain',
      extra: { type: 'topics', workspaceId: job.payload?.workspaceId || null }
    });
  }
  // Embed semantic meaning
  if (semanticMeaning && typeof semanticMeaning === 'string') {
    const semEmbedding = await embedText(semanticMeaning);
    await storeEmbedding({
      id: `${job.id}_semantic`,
      userId,
      fileId: job.id,
      chunk: `[SEMANTIC] ${semanticMeaning}`,
      embeddingVector: semEmbedding,
      chunkIndex: 0,
      fileName: originalName,
      modality: 'text',
      mimeType: 'text/plain',
      extra: { type: 'semantic', workspaceId: job.payload?.workspaceId || null }
    });
  }
  // 3. Sample frames using configurable interval
  const framePaths = await extractFramesAtInterval(filePath, frameIntervalSec, 100);
  // 4. Run OCR and object/scene detection on frames
  let ocrTexts: string[] = [];
  let frameObjects: string[][] = [];
  let frameScenes: string[][] = [];
  for (const framePath of framePaths) {
    const ocrText = await runOCR(framePath, lang);
    ocrTexts.push(ocrText);
    // Object & scene detection
    const { objects, scenes } = await runObjectSceneDetection(framePath);
    frameObjects.push(objects);
    frameScenes.push(scenes);
    // Embed detected objects
    if (objects.length > 0) {
      const objEmbedding = await embedText(objects.join(', '));
      await storeEmbedding({
        id: `${job.id}_frameobj_${framePath}`,
        userId,
        fileId: job.id,
        chunk: `[OBJECTS] ${objects.join(', ')}`,
        embeddingVector: objEmbedding,
        chunkIndex: 0,
        fileName: originalName,
        modality: 'video',
        mimeType: 'video/mp4',
        extra: { framePath, type: 'objects', workspaceId: job.payload?.workspaceId || null }
      });
    }
    // Embed detected scenes
    if (scenes.length > 0) {
      const sceneEmbedding = await embedText(scenes.join(', '));
      await storeEmbedding({
        id: `${job.id}_framescene_${framePath}`,
        userId,
        fileId: job.id,
        chunk: `[SCENES] ${scenes.join(', ')}`,
        embeddingVector: sceneEmbedding,
        chunkIndex: 0,
        fileName: originalName,
        modality: 'video',
        mimeType: 'video/mp4',
        extra: { framePath, type: 'scenes', workspaceId: job.payload?.workspaceId || null }
      });
    }
  }
  // 5. Summarize transcript and OCR text
  const transcriptSummary = (await llmService.summarize(transcript, 300)).content;
  const ocrSummary = (await llmService.summarize(ocrTexts.join(' '), 200)).content;
  const summary = `Audio Summary: ${transcriptSummary}\nFrame OCR Summary: ${ocrSummary}`;
  // 6. Chunk transcript and embed
  const chunks = chunkText(transcript || '', 500);
  let idx = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i] || '';
    const startIdx = idx;
    const endIdx = idx + chunk.length;
    idx = endIdx;
    const embedding = await embedText(chunk);
    await storeEmbedding({
      id: `${job.id}_text_${i}`,
      userId,
      fileId: job.id,
      chunk,
      embeddingVector: embedding,
      chunkIndex: i,
      fileName: originalName,
      modality: 'text',
      mimeType: 'text/plain',
      extra: { startIdx, endIdx, workspaceId: job.payload?.workspaceId || null }
    });
  }
  // 7. Embed frames (raw image embedding)
  for (let i = 0; i < framePaths.length; i++) {
    const frameEmbedding = await embedVideo(framePaths[i] || '');
    await storeEmbedding({
      id: `${job.id}_frame_${i}`,
      userId,
      fileId: job.id,
      chunk: `[FRAME ${i}]`,
      embeddingVector: frameEmbedding,
      chunkIndex: i,
      fileName: originalName,
      modality: 'video',
      mimeType: 'video/mp4',
      extra: { frameNumber: i, timestamp: i * frameIntervalSec, workspaceId: job.payload?.workspaceId || null }
    });
  }
  // 8. Store transcript/summary and visual context
  videoDataStore[job.id] = {
    userId,
    filePath,
    transcript,
    summary,
    frameObjects,
    frameScenes,
    status: 'done',
    processedAt: new Date().toISOString(),
    workspaceId: job.payload.workspaceId || null,
  };
  return true;
}

export function getVideoData(jobId: string) {
  return videoDataStore[jobId];
}

export function getAllVideoDataForUser(userId: string) {
  return Object.values(videoDataStore).filter((v: any) => v.userId === userId && v.status === 'done');
}

export function getRelevantVideoChunks(userId: string, query: string, maxChunks = 5) {
  const allChunks = videoChunkEmbeddings[userId] || [];
  if (!allChunks.length) return [];
  const queryEmbedding = fakeEmbed(query);
  const alpha = 0.7;
  return allChunks
    .map(c => {
      const vectorScore = cosineSim(c.embedding, queryEmbedding);
      const keywordScore = keywordOverlap(c.chunk, query);
      return { ...c, score: alpha * vectorScore + (1 - alpha) * keywordScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);
} 