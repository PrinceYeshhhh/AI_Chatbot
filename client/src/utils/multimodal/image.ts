/**
 * Image Text Extraction Utility
 * 
 * This module provides functionality to extract text from images using OCR.
 * Currently implemented as a stub that will be replaced with real OCR functionality.
 */

export interface ImageExtractionResult {
  success: boolean;
  extractedText?: string;
  error?: string;
  confidence?: number;
}

/**
 * Extract text from an image file
 * 
 * @param fileId - The ID of the uploaded image file
 * @returns Promise<ImageExtractionResult> - The extraction result
 */
export async function extractImageText(fileId: string): Promise<ImageExtractionResult> {
  try {
    // Implement real OCR using Google Cloud Vision API
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error('Google Cloud Vision API key not set in VITE_GOOGLE_CLOUD_API_KEY');
    }
    // Fetch the image file URL from your backend or storage (assume a helper exists)
    const imageUrl = await getImageUrlById(fileId); // You must implement this helper
    const visionEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const requestBody = {
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'TEXT_DETECTION' }]
        }
      ]
    };
    const response = await fetch(visionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    if (data.responses && data.responses[0].textAnnotations && data.responses[0].textAnnotations.length > 0) {
      return {
        success: true,
        extractedText: data.responses[0].textAnnotations[0].description,
        confidence: 1.0 // Google Vision does not provide confidence for full text
      };
    } else {
      return { success: false, error: 'No text found in image.' };
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during image text extraction'
    };
  }
}

/**
 * Validate if a file is a supported image format
 * 
 * @param file - The file to validate
 * @returns boolean - True if the file is a supported image format
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
  
  return supportedTypes.includes(file.type) || 
         supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Get image file metadata
 * 
 * @param file - The image file
 * @returns object - Image metadata
 */
export function getImageMetadata(file: File) {
  return {
    type: 'image',
    mimeType: file.type,
    size: file.size,
    name: file.name,
    lastModified: file.lastModified
  };
} 

/**
 * Helper to get the public URL for an image file by its ID
 * Assumes backend exposes /api/files/:fileId/url returning { url: string }
 */
export async function getImageUrlById(fileId: string): Promise<string> {
  const response = await fetch(`/api/files/${fileId}/url`);
  if (!response.ok) {
    throw new Error('Failed to fetch image URL');
  }
  const data = await response.json();
  if (!data.url) {
    throw new Error('No URL returned for image');
  }
  return data.url;
} 