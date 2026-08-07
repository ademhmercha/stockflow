import { Router } from "express";
import authRoutes from "./auth.routes";
import produitsRoutes from "./produits.routes";
import stockRoutes from "./stock.routes";
import clientsRoutes from "./clients.routes";
import facturesRoutes from "./factures.routes";
import dashboardRoutes from "./dashboard.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/produits", produitsRoutes);
router.use("/stock", stockRoutes);
router.use("/clients", clientsRoutes);
router.use("/factures", facturesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/health", healthRoutes);

export default router;
