import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, AppError } from "../utils/apiResponse";
import { violationService } from "../services/violation.service";
import { captchaService } from "../services/captcha/captcha.service";

export const violationController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const result = await violationService.search(req.body);
    return sendSuccess(res, result, 200);
  }),

  // Step 1 — user-assisted CAPTCHA: returns cached result OR a CAPTCHA challenge.
  captchaStart: asyncHandler(async (req: Request, res: Response) => {
    const result = await captchaService.start(req.body);
    return sendSuccess(res, result, 200);
  }),

  // Step 2 — verify the typed CAPTCHA and return the parsed violations.
  captchaSubmit: asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, captchaCode } = req.body;
    const result = await captchaService.submit(sessionId, captchaCode);
    return sendSuccess(res, result, 200);
  }),

  getByReference: asyncHandler(async (req: Request, res: Response) => {
    const result = await violationService.getByReference(
      req.params.referenceId,
    );
    if (!result) throw new AppError("Inquiry reference not found", 404);
    return sendSuccess(res, result, 200);
  }),
};
