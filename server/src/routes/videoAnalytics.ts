import express from 'express';
import { getAnalytics } from '../services/videoAnalyticsService';

const router = express.Router();

router.get('/', (req, res) => {
  const { userId, sessionId } = req.query;
  const analytics = getAnalytics({ userId, sessionId });
  res.json(analytics);
});

export default router; 