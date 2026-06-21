import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { validateBody } from '../middleware/validate';
import { paymentSchema } from '../validators/payment.validator';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', paymentLimiter, validateBody(paymentSchema), paymentController.create);

export default router;
