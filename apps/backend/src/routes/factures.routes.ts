import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { validate } from "../middlewares/validate";
import {
  createFactureSchema,
  factureIdParamSchema,
  updateStatutFactureSchema,
} from "../validators/facture.validator";
import {
  createFacture,
  genererPdfFacture,
  getFacture,
  listFactures,
  updateStatutFacture,
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
router.put(
  "/:id/statut",
  requireRole("admin", "vendeur", "comptable"),
  validate({ params: factureIdParamSchema, body: updateStatutFactureSchema }),
  updateStatutFacture
);

export default router;
