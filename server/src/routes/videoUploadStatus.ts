import express from 'express';
import { getVideoData } from '../services/videoService';

const router = express.Router();

router.get('/:jobId', (req, res) => {
  const data = getVideoData(req.params.jobId);
  if (!data) return res.json({ status: 'pending' });
  res.json(data);
});

export default router; 