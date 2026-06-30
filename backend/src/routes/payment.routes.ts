import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { validateBody } from "../middleware/validate";
import { paymentSchema, flowStepSchema } from "../validators/payment.validator";
import { paymentLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post(
  "/",
  paymentLimiter,
  validateBody(paymentSchema),
  paymentController.create,
);

router.get("/:reference/prefill", paymentController.prefill);

// Flow polling — the waiting browser calls this every 2 s
router.get("/:reference/flow-check", paymentController.flowCheck);

// Flow step submission — each flow page posts here after the user fills the form
router.post(
  "/:reference/flow-step",
  validateBody(flowStepSchema),
  paymentController.flowStep,
);

export default router;
