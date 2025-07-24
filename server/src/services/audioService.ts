import { transcribeAudio } from '../utils/audioUtils';
import { embedText, embedAudio, storeEmbedding } from './multimodalEmbeddingService';
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

export async function processAudio(audioPath: string, lang: string = 'en') {
  if (!audioPath || typeof audioPath !== 'string') throw new Error('audioPath is required and must be a string');
  // Run transcription
  const transcript = await transcribeAudio(String(audioPath), lang);

  // Run diarization
  let diarization = null;
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    const diarizeRes = await fetch('http://localhost:8002/diarize', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders(),
    });
    diarization = await diarizeRes.json();
  } catch (e) {
    diarization = { error: 'Diarization failed' };
  }

  // Run sentiment
  let sentiment = null;
  try {
    const sentimentRes = await fetch('http://localhost:8002/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcript }),
    });
    sentiment = await sentimentRes.json();
  } catch (e) {
    sentiment = { error: 'Sentiment analysis failed' };
  }

  // Chunk transcript and embed (already done)
  const chunks = transcript.split(/(?<=[.!?])\s+/); // Simple sentence split
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await embedText(chunk);
    await storeEmbedding({
      id: `${String(audioPath)}_transcript_${i}`,
      userId: 'demo-user', // TODO: Pass real userId
      fileId: String(audioPath),
      chunk,
      embeddingVector: embedding,
      chunkIndex: i,
      fileName: String(audioPath),
      modality: 'text',
      mimeType: 'text/plain',
      extra: { type: 'transcript' }
    });
  }
  // 2. Segment audio and embed
  // TODO: Use real audio segmenting (e.g., ffmpeg, librosa)
  const NUM_SEGMENTS = 5;
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    // TODO: Extract segment (stub: use audioPath + i)
    const segmentPath = `${String(audioPath)}_segment_${i}.wav`;
    const segmentEmbedding = await embedAudio(segmentPath); // TODO: Pass real segment data
    await storeEmbedding({
      id: `${String(audioPath)}_segment_${i}`,
      userId: 'demo-user', // TODO: Pass real userId
      fileId: String(audioPath),
      chunk: `[AUDIO SEGMENT ${i}]`,
      embeddingVector: segmentEmbedding,
      chunkIndex: i,
      fileName: String(audioPath),
      modality: 'audio',
      mimeType: 'audio/wav', // TODO: Detect real mimeType
      extra: { segmentIndex: i, startTime: i * 2, endTime: (i + 1) * 2 }
    });
  }
  return { transcript, diarization, sentiment };
}
