import express from 'express';
import { getUserConfig, updateUserConfig } from '../services/userConfigService';

const router = express.Router();

// For demo, use a hardcoded userId
const DEMO_USER_ID = 'demo-user';

router.get('/', async (_req, res) => {
  try {
    const config = await getUserConfig(DEMO_USER_ID);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const config = await updateUserConfig(DEMO_USER_ID, req.body);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 