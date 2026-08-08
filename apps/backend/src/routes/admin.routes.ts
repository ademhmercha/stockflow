import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requirePlatformOwner } from "../middlewares/platform";
import { validate } from "../middlewares/validate";
import { paginationQuerySchema } from "../validators/pagination.validator";
import { entrepriseIdParamSchema, updateStatutEntrepriseSchema } from "../validators/admin.validator";
import { getPlatformStats, listEntreprises, updateStatutEntreprise } from "../controllers/admin.controller";

const router = Router();

// Volontairement PAS de checkEntrepriseActive ici : le propriétaire de la
// plateforme opère au-dessus du mécanisme de suspension par tenant.
router.use(requireAuth, requirePlatformOwner);

router.get("/stats", getPlatformStats);
router.get("/entreprises", validate({ query: paginationQuerySchema }), listEntreprises);
router.put(
  "/entreprises/:id/statut",
  validate({ params: entrepriseIdParamSchema, body: updateStatutEntrepriseSchema }),
  updateStatutEntreprise
);

export default router;
