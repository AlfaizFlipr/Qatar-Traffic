import { Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';

export function notFound(req: Request, res: Response) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
