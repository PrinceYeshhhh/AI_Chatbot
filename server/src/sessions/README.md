# Sessions Module

## Features
- Auto-logout inactive users (configurable timeout)
- Track login sessions by IP address and device fingerprint
- Allow users/admins to revoke sessions from dashboard
- Invalidate tokens on logout or password change

## DB Schema
See `active_sessions` table in migrations.

## Usage
- Use `sessionMiddleware` in Express app
- Extend with DB logic for session lookup, update, and revocation 