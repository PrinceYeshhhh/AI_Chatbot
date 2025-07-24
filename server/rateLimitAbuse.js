const rateLimit = require('express-rate-limit');
const axios = require('axios');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per user/IP
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: async (req, res) => {
    // Log abuse to Supabase
    try {
      await axios.post(process.env.SUPABASE_ABUSE_LOG_URL, {
        user_id: req.user?.id || null,
        ip: req.ip,
        reason: 'Rate limit exceeded',
      }, {
        headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY }
      });
    } catch (e) {}
    res.status(429).json({ message: 'Too many requests, please slow down.' });
  }
});

module.exports = limiter; 