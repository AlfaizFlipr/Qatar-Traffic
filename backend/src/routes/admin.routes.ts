import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/login', adminController.login);

// Everything below requires a valid admin session.
router.use(adminAuth);
router.get('/payments', adminController.listPayments);
router.get('/violations', adminController.listViolations);

export default router;
