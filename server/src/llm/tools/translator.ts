// Translator tool
import fetch from 'node-fetch';

const GOOGLE_TRANSLATE_API_KEY = process.env['GOOGLE_TRANSLATE_API_KEY'] || '';
const LANG_LAYER_API_KEY = process.env['LANG_LAYER_API_KEY'] || '';

export async function detectLanguage(text: string): Promise<string> {
  // Use languagelayer API for language detection
  if (!LANG_LAYER_API_KEY) return 'en';
  const res = await fetch(`https://api.languagelayer.com/detect?access_key=${LANG_LAYER_API_KEY}&query=${encodeURIComponent(text)}`);
  const data = await res.json() as any;
  return data?.results?.[0]?.language_code || 'en';
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  // Detect source language
  const sourceLang = await detectLanguage(text);
  if (sourceLang === targetLang) return text;
  if (GOOGLE_TRANSLATE_API_KEY) {
    // Use Google Translate API if key is set
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target: targetLang, source: sourceLang })
    });
    const data = await res.json() as any;
    return data?.data?.translations?.[0]?.translatedText || text;
  }
  // Use Groq for translation if Google API key is not set
  try {
    const prompt = `Translate the following text to ${targetLang} (from ${sourceLang}):\n${text}`;
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env['GROQ_API_KEY']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: 'You are a translation assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }
    
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || text;
  } catch (e) {
    // Fallback: return original text if Groq fails
    return text;
  }
}
// Add your API keys to the environment for production use. 