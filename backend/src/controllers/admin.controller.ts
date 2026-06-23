import { Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, AppError } from '../utils/apiResponse';
import { signToken } from '../utils/adminToken';
import { env } from '../config/env';
import { paymentDao } from '../dao/payment.dao';
import { violationDao } from '../dao/violation.dao';

/** Constant-time string compare to avoid timing attacks on credentials. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function parsePagination(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  return { page, limit, search: search || undefined };
}

export const adminController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new AppError('Username and password are required', 400);
    }

    const ok = safeEqual(username, env.admin.username) && safeEqual(password, env.admin.password);
    if (!ok) throw new AppError('Invalid credentials', 401);

    const token = signToken(username);
    return sendSuccess(res, { token, username, expiresIn: env.admin.tokenTtlMs }, 200, 'Logged in');
  }),

  listPayments: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search } = parsePagination(req);
    const { items, total, totalAmount } = await paymentDao.list({ page, limit, search });
    return sendSuccess(res, { items, total, totalAmount, page, limit }, 200);
  }),

  listViolations: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search } = parsePagination(req);
    const { items, total, totalAmount, totalViolations } = await violationDao.list({ page, limit, search });
    return sendSuccess(res, { items, total, totalAmount, totalViolations, page, limit }, 200);
  }),
};
