import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { getStats } from "../controllers/dashboard.controller";

const router = Router();

router.use(requireAuth);
router.get("/stats", getStats);

export default router;
