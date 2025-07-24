import { Plugin } from '../types/plugin';

const plugins: Plugin[] = [
  {
    name: 'Embed PDF',
    description: 'Embed and index a PDF document for search.',
    inputs: [
      { name: 'file', type: 'file', required: true, description: 'PDF file to embed' },
    ],
    outputFormat: 'JSON',
    endpoint: '/api/plugins/embed-pdf',
  },
  {
    name: 'Translate Video',
    description: 'Transcribe and translate a video file.',
    inputs: [
      { name: 'file', type: 'file', required: true, description: 'Video file to translate' },
      { name: 'targetLanguage', type: 'string', required: true },
    ],
    outputFormat: 'JSON',
    endpoint: '/api/plugins/translate-video',
  },
];

export function getRegisteredPlugins(): Plugin[] {
  // TODO: Dynamically load from plugins/ dir
  return plugins;
} 