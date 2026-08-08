import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { checkEntrepriseActive } from "../middlewares/platform";
import { validate } from "../middlewares/validate";
import { createMouvementSchema } from "../validators/mouvement.validator";
import { alertesStock, creerMouvement, listMouvements } from "../controllers/stock.controller";

const router = Router();

router.use(requireAuth, checkEntrepriseActive);

router.get("/alertes", alertesStock);
router.get("/mouvements", listMouvements);
router.post(
  "/mouvements",
  requireRole("admin", "vendeur"),
  validate({ body: createMouvementSchema }),
  creerMouvement
);

export default router;
