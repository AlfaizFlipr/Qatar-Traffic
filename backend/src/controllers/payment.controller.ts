import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, AppError } from "../utils/apiResponse";
import { paymentService } from "../services/payment.service";

export const paymentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip;
    const ua = req.headers["user-agent"];
    const result = await paymentService.submit(req.body, ip, ua);
    return sendSuccess(res, result, 201, "Your request has been received.");
  }),

  prefill: asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;
    const data = await paymentService.getPrefill(reference);
    if (!data) throw new AppError("Payment not found", 404);
    return sendSuccess(res, data);
  }),

  flowCheck: asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;
    const page =
      typeof req.query.page === "string" ? req.query.page : undefined;
    const result = await paymentService.flowCheck(reference, page);
    if (!result.ok) throw new AppError("Payment not found", 404);
    return sendSuccess(res, result);
  }),

  flowStep: asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip;
    const ua = req.headers["user-agent"];
    const { step, data } = req.body as {
      step: string;
      data: Record<string, unknown>;
    };
    const result = await paymentService.flowStep(reference, step, data, ip, ua);
    if (!result.ok) throw new AppError("Payment not found", 404);
    return sendSuccess(res, result);
  }),
};
