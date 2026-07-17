import { Router } from "express";
import { violationController } from "../controllers/violation.controller";
import { validateBody } from "../middleware/validate";
import {
  violationSearchSchema,
  captchaStartSchema,
  captchaSubmitSchema,
} from "../validators/violation.validator";

const router = Router();

router.post(
  "/search",
  validateBody(violationSearchSchema),
  violationController.search,
);

// User-assisted CAPTCHA flow (Option A)
router.post(
  "/captcha/start",
  validateBody(captchaStartSchema),
  violationController.captchaStart,
);
router.post(
  "/captcha/submit",
  validateBody(captchaSubmitSchema),
  violationController.captchaSubmit,
);

router.get("/:referenceId", violationController.getByReference);

export default router;
