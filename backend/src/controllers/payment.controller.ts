import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { paymentService } from '../services/payment.service';

export const paymentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const result = await paymentService.submit(req.body, ip);
    return sendSuccess(res, result, 201, 'Your request has been received.');
  }),
};
