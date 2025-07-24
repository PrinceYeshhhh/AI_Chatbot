import express from 'express';
import { getRealtimeMetrics } from '../services/analyticsDashboardService';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const metrics = await getRealtimeMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 