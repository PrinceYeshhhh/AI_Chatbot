# Rate Limiter Module

## Features
- Per-user and per-IP rate limits (chat, uploads, tokens)
- Store rate events in DB
- Temporarily block abusers and notify admins
- Use Redis or Supabase RLS for fast enforcement

## DB Schema
See `rate_limits` table in migrations.

## Usage
- Use `rateLimiterMiddleware` in Express app
- Extend with DB/Redis logic for enforcement and event logging 