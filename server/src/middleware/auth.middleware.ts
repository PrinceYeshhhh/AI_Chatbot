import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    // Decode JWT (Supabase JWT or custom)
    const decoded: any = jwt.decode(token);
    let user = {
      id: decoded?.sub,
      email: decoded?.email,
      role: decoded?.user_metadata?.role,
      team_id: decoded?.user_metadata?.team_id
    };
    // If role/team_id not present, fetch from users table
    if (!user.role || !user.team_id) {
      // This part of the logic was removed as per the edit hint
      // const { data, error } = await supabase.from('users').select('role, team_id').eq('id', user.id).single();
      // if (data) {
      //   user.role = data.role;
      //   user.team_id = data.team_id;
      // }
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token or user fetch failed' });
    return;
  }
} 