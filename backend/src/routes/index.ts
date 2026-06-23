import { Router } from 'express';
import violationRoutes from './violation.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';
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
router.use('/admin', adminRoutes);

export default router;
