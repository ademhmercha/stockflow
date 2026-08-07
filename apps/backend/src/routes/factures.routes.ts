import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { validate } from "../middlewares/validate";
import { createFactureSchema, factureIdParamSchema } from "../validators/facture.validator";
import {
  createFacture,
  genererPdfFacture,
  getFacture,
  listFactures,
} from "../controllers/factures.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listFactures);
router.get("/:id", validate({ params: factureIdParamSchema }), getFacture);
router.get("/:id/pdf", validate({ params: factureIdParamSchema }), genererPdfFacture);
router.post(
  "/",
  requireRole("admin", "vendeur", "comptable"),
  validate({ body: createFactureSchema }),
  createFacture
);

export default router;
