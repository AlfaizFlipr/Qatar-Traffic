import { Router } from 'express';
import violationRoutes from './violation.routes';
import paymentRoutes from './payment.routes';
import { isTelegramConfigured } from '../config/env';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      telegram: isTelegramConfigured ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/violations', violationRoutes);
router.use('/payments', paymentRoutes);

export default router;
