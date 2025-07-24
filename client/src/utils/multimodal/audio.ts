/**
 * Audio Transcription Utility
 * 
 * This module provides functionality to transcribe audio files.
 * Currently implemented as a stub that will be replaced with real transcription functionality.
 */

export interface AudioTranscriptionResult {
  success: boolean;
  transcript?: string;
  error?: string;
  confidence?: number;
  duration?: number;
  language?: string;
}

/**
 * Transcribe audio from an audio file
 * 
 * @param fileId - The ID of the uploaded audio file
 * @returns Promise<AudioTranscriptionResult> - The transcription result
 */
export async function transcribeAudio(fileId: string): Promise<AudioTranscriptionResult> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error('Google Cloud Speech-to-Text API key not set in VITE_GOOGLE_CLOUD_API_KEY');
    }
    // Fetch the audio file URL from your backend or storage (assume a helper exists)
    const audioUrl = await getAudioUrlById(fileId); // You must implement this helper
    const speechEndpoint = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
    // Download audio and convert to base64 (Google API expects base64-encoded audio)
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();
    const base64Audio = await blobToBase64(audioBlob); // You must implement this helper
    const requestBody = {
      config: {
        encoding: 'LINEAR16', // or 'MP3', 'OGG_OPUS', etc. depending on your audio
        languageCode: 'en-US'
      },
      audio: {
        content: base64Audio
      }
    };
    const response = await fetch(speechEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        success: true,
        transcript: data.results.map((r: any) => r.alternatives[0].transcript).join(' '),
        confidence: data.results[0].alternatives[0].confidence || 1.0,
        duration: 0, // Google API does not return duration
        language: 'en'
      };
    } else {
      return { success: false, error: 'No transcription found.' };
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during audio transcription'
    };
  }
}

/**
 * Validate if a file is a supported audio format
 * 
 * @param file - The file to validate
 * @returns boolean - True if the file is a supported audio format
 */
export function isSupportedAudioFormat(file: File): boolean {
  const supportedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
    'audio/ogg',
    'audio/webm'
  ];
  
  const supportedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm'];
  
  return supportedTypes.includes(file.type) || 
         supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Get audio file metadata
 * 
 * @param file - The audio file
 * @returns object - Audio metadata
 */
export function getAudioMetadata(file: File) {
  return {
    type: 'audio',
    mimeType: file.type,
    size: file.size,
    name: file.name,
    lastModified: file.lastModified
  };
}

/**
 * Get audio duration (placeholder for future implementation)
 * 
 * @param file - The audio file
 * @returns Promise<number> - Duration in seconds
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    // TODO: Implement real audio duration detection
    // This could use the Web Audio API or a library like audio-duration
    console.log(`[STUB] Getting duration for audio file: ${file.name}`);
    resolve(0); // Placeholder duration
  });
} 

/**
 * Helper to get the public URL for an audio file by its ID
 * Assumes backend exposes /api/files/:fileId/url returning { url: string }
 */
export async function getAudioUrlById(fileId: string): Promise<string> {
  const response = await fetch(`/api/files/${fileId}/url`);
  if (!response.ok) {
    throw new Error('Failed to fetch audio URL');
  }
  const data = await response.json();
  if (!data.url) {
    throw new Error('No URL returned for audio');
  }
  return data.url;
}

/**
 * Helper to convert a Blob to a base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      if (typeof base64data === 'string') {
        // Remove the data:...;base64, prefix if present
        const base64 = base64data.split(',')[1] || base64data;
        resolve(base64);
      } else {
        reject('Failed to convert blob to base64');
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 