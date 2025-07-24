import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

export async function runOCR(imagePath: string, lang: string = 'eng'): Promise<string> {
  // TODO: Integrate Tesseract or external OCR API with language support
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Example: pytesseract.image_to_string(imagePath, lang=lang)
      // Simulate possible failure for demonstration
      if (Math.random() < 0.5 && attempt === 1) throw new Error('Simulated OCR failure');
      return `Sample OCR text from ${imagePath} in language ${lang}`;
    } catch (err) {
      lastError = err;
      if (attempt === 2) {
        // Log error or alert user
        throw new Error(`OCR failed after retry: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  throw lastError || new Error('Unknown OCR error');
}

export async function runImageCaptioning(imagePath: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  const res = await fetch('http://localhost:8001/caption', {
    method: 'POST',
    body: formData as any,
    headers: formData.getHeaders(),
  });
  const data: any = await res.json();
  return data.caption || '';
}

/**
 * Run object and scene detection on an image using an external API (e.g., YOLOv5/CLIP).
 * Returns detected objects and scene labels.
 */
export async function runObjectSceneDetection(imagePath: string): Promise<{ objects: string[]; scenes: string[] }> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  const res = await fetch('http://localhost:8001/detect', {
    method: 'POST',
    body: formData as any,
    headers: formData.getHeaders(),
  });
  const data: any = await res.json();
  return {
    objects: data.objects || [],
    scenes: data.scenes || []
  };
} 