import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';
import { verifyToken } from '../utils/adminToken';

/** Guards admin-only routes: requires a valid Bearer token. */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) return sendError(res, 'Authentication required', 401);

  const payload = verifyToken(token);
  if (!payload) return sendError(res, 'Invalid or expired session', 401);

  next();
}
