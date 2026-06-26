import { NextFunction, Request, Response, RequestHandler } from "express";

/** Wraps an async route so rejected promises flow to the error middleware. */
export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
