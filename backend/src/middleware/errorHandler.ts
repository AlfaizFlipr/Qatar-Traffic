import { NextFunction, Request, Response } from "express";
import { AppError, sendError } from "../utils/apiResponse";
import { logger } from "../utils/logger";
import { isProd } from "../config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  logger.error("Unhandled error", err);
  const message = isProd
    ? "Internal server error"
    : ((err as Error)?.message ?? "Internal server error");
  return sendError(res, message, 500);
}
