import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

router.post("/login", adminController.login);

router.use(adminAuth);

// Dashboard stats
router.get("/stats", adminController.getStats);

// Payments list + detail + mutations
router.get("/payments", adminController.listPayments);
router.get("/payments/:id", adminController.getPayment);
router.patch("/payments/:id", adminController.updatePayment);
router.delete("/payments/:id", adminController.deletePayment);
router.put("/payments/:id/flow-action", adminController.setFlowAction);

// Searches list
router.get("/violations", adminController.listViolations);

export default router;
