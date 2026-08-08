import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { checkEntrepriseActive } from "../middlewares/platform";
import { getStats } from "../controllers/dashboard.controller";

const router = Router();

router.use(requireAuth, checkEntrepriseActive);
router.get("/stats", getStats);

export default router;
