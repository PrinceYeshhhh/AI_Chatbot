import express from 'express';
import { getRegisteredPlugins } from '../services/pluginRegistry';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(getRegisteredPlugins());
});

export default router; 