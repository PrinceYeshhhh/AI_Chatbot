import { runOCR, runImageCaptioning } from '../utils/visionUtils';
import { embedText, embedImage, storeEmbedding } from './multimodalEmbeddingService';

export async function processImage(imagePath: string, lang: string = 'eng') {
  // Run OCR
  const ocrText = await runOCR(imagePath, lang);
  // Run image captioning
  const caption = await runImageCaptioning(imagePath);
  // Embed OCR text
  const ocrEmbedding = await embedText(ocrText);
  await storeEmbedding({
    id: `${imagePath}_ocr`,
    userId: 'demo-user', // TODO: Pass real userId
    fileId: imagePath,
    chunk: ocrText,
    embeddingVector: ocrEmbedding,
    chunkIndex: 0,
    fileName: imagePath,
    modality: 'text',
    mimeType: 'text/plain',
    extra: { type: 'ocr' }
  });
  // Embed image
  const imageEmbedding = await embedImage(imagePath);
  await storeEmbedding({
    id: `${imagePath}_img`,
    userId: 'demo-user', // TODO: Pass real userId
    fileId: imagePath,
    chunk: '[IMAGE]',
    embeddingVector: imageEmbedding,
    chunkIndex: 0,
    fileName: imagePath,
    modality: 'image',
    mimeType: 'image/png', // TODO: Detect real mimeType
    extra: { type: 'image' }
  });
  // TODO: For advanced use, chunk image into patches/regions and embed each
  return { ocrText, caption };
} 