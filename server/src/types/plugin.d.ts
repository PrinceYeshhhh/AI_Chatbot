export interface Plugin {
  name: string;
  description: string;
  inputs: Array<{ name: string; type: string; required: boolean; description?: string }>;
  outputFormat: string;
  endpoint?: string;
  handler?: (...args: any[]) => Promise<any>;
}

// Add enums for file processing
export enum SourceType {
  PDF = 'pdf',
  DOCX = 'docx',
  CSV = 'csv',
  TXT = 'txt',
  XLSX = 'xlsx',
  SVG_OCR = 'svg_ocr',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx',
  CSV = 'csv',
  TXT = 'txt',
  XLSX = 'xlsx',
  SVG = 'svg',
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  HEIC = 'heic',
  HEIF = 'heif',
  MP3 = 'mp3',
  WAV = 'wav',
  M4A = 'm4a',
  AAC = 'aac',
  OGG = 'ogg',
  WEBM = 'webm',
  MP4 = 'mp4',
} 