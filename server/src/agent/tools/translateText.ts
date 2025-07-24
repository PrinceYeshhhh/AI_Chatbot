// Text Translation Tool
import { Tool, ToolArgs, ToolResult } from '../types';

export const translateText: Tool = {
  name: 'translateText',
  description: 'Translates text between different languages',
  category: 'utility',
  schema: {
    name: 'translateText',
    description: 'Translates text between different languages',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to translate'
        },
        sourceLanguage: {
          type: 'string',
          description: 'Source language code (e.g., en, es, fr)'
        },
        targetLanguage: {
          type: 'string',
          description: 'Target language code (e.g., en, es, fr)'
        },
        userId: {
          type: 'string',
          description: 'ID of the user requesting translation'
        }
      },
      required: ['text', 'targetLanguage', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    try {
      const { text, sourceLanguage, targetLanguage, userId } = args;
      // Use LibreTranslate public API (or your backend proxy)
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage || 'auto',
          target: targetLanguage,
          format: 'text'
        })
      });
      const data = await response.json();
      return {
        success: true,
        data: {
          translatedText: data.translatedText,
          sourceLanguage: data.detectedSourceLanguage || sourceLanguage || 'auto',
          targetLanguage,
          confidence: 1.0
        },
        metadata: {}
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error during translation'
      };
    }
  }
}; 