import express, { Request, Response } from 'express';
import { translateText, detectLanguage } from '../llm/tools/translator';
import { z } from 'zod';
import xss from 'xss';

const router = express.Router();

const translateSchema = z.object({
  text: z.string().min(1).max(2000),
  targetLang: z.string().min(1).max(10),
  _sourceLang: z.string().optional()
});
const detectLangSchema = z.object({
  text: z.string().min(1).max(2000)
});
function validateBody(schema: z.ZodSchema<any>) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.errors });
      return;
    }
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
    next();
  };
}

// POST /api/translate
router.post('/translate', validateBody(translateSchema), async (req: Request, res: Response) => {
  const { text, targetLang, _sourceLang } = req.body;
  if (!text || !targetLang) {
    res.status(400).json({ error: 'Missing text or targetLang' });
    return;
  }
  try {
    const translated = await translateText(text, targetLang);
    res.json({ translated });
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Translation failed' });
    return;
  }
});

// POST /api/detect-language
router.post('/detect-language', validateBody(detectLangSchema), async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Missing text' });
    return;
  }
  try {
    const language = await detectLanguage(text);
    res.json({ language });
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Language detection failed' });
    return;
  }
});

export default router; 