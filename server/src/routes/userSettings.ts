import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import xss from 'xss';

const router = Router();

// Middleware to get userId from auth (replace with real auth logic)
function getUserId(req: Request): string {
  // TODO: Replace with real authentication
  return req.headers['x-user-id'] as string || 'demo-user';
}

// Zod schemas for validation
const userSettingsSchema = z.object({
  preferred_language: z.string().min(1).max(10).optional(),
  auto_translate_enabled: z.boolean().optional(),
  voice_gender: z.string().min(1).max(20).optional(),
  voice_rate: z.number().min(0.5).max(2).optional(),
  voice_pitch: z.number().min(0.5).max(2).optional(),
  voice_provider: z.string().min(1).max(20).optional(),
  tts_enabled: z.boolean().optional(),
  accessibility_mode: z.boolean().optional(),
  has_completed_onboarding: z.boolean().optional()
});
const onboardingProgressSchema = z.object({
  has_completed_onboarding: z.boolean().optional(),
  onboarding_progress: z.number().min(0).max(100).optional(),
  last_seen_docs_version: z.string().nullable().optional()
});
const supportTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000)
});

function validateBody(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.errors });
      return;
    }
    // Sanitize all string fields in body
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
    next();
  };
}

// GET /api/user-settings
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    // Add fallback for new fields if missing
    res.json({
      preferred_language: 'en',
      auto_translate_enabled: true,
      voice_gender: 'neutral',
      voice_rate: 1.0,
      voice_pitch: 1.0,
      voice_provider: 'native',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user-settings
router.post('/', validateBody(userSettingsSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const {
      preferred_language = 'en',
      auto_translate_enabled = true,
      voice_gender = 'neutral',
      voice_rate = 1.0,
      voice_pitch = 1.0,
      voice_provider = 'native',
      tts_enabled,
      accessibility_mode,
      has_completed_onboarding
    } = req.body;
    res.json({
      preferred_language,
      auto_translate_enabled,
      voice_gender,
      voice_rate,
      voice_pitch,
      voice_provider,
      tts_enabled,
      accessibility_mode,
      has_completed_onboarding
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user-settings/api-key (generate new API key)
router.post('/api-key', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const apiKey = 'sk-' + uuidv4();
    res.json({ api_key: apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user-settings/onboarding-progress
router.get('/onboarding-progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    res.json({
      has_completed_onboarding: false,
      onboarding_progress: 0,
      last_seen_docs_version: null
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user-settings/onboarding-progress
router.post('/onboarding-progress', validateBody(onboardingProgressSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { has_completed_onboarding = false, onboarding_progress = 0, last_seen_docs_version = null } = req.body;
    res.json({
      has_completed_onboarding,
      onboarding_progress,
      last_seen_docs_version
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/support/ticket
router.post('/support/ticket', validateBody(supportTicketSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { subject, message } = req.body;
    res.json({
      subject,
      message,
      status: 'received'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support/faqs
router.get('/support/faqs', async (_req: Request, res: Response): Promise<void> => {
  // For now, return static FAQs. In production, fetch from DB or markdown.
  res.json({
    faqs: [
      { q: 'How do I upload files?', a: 'Go to the Upload tab and select your files.' },
      { q: 'How do I use Smart Memory?', a: 'Enable Smart Memory in settings and refer to the docs panel.' }
    ]
  });
});

export default router; 