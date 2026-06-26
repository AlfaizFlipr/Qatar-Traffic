import { Response } from "express";

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown,
) {
  return res.status(statusCode).json({ success: false, message, details });
}
