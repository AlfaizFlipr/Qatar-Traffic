import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { sendError } from "../utils/apiResponse";

/** Validates req.body against a zod schema and replaces it with the parsed value. */
export const validateBody =
  (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return sendError(res, "Validation failed", 422, details);
    }
    req.body = result.data;
    next();
  };
