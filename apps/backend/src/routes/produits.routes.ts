import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { checkEntrepriseActive } from "../middlewares/platform";
import { validate } from "../middlewares/validate";
import {
  createProduitSchema,
  produitIdParamSchema,
  updateProduitSchema,
} from "../validators/produit.validator";
import { paginationQuerySchema } from "../validators/pagination.validator";
import {
  createProduit,
  deleteProduit,
  getProduit,
  listProduits,
  updateProduit,
} from "../controllers/produits.controller";

const router = Router();

router.use(requireAuth, checkEntrepriseActive);

router.get("/", validate({ query: paginationQuerySchema }), listProduits);
router.get("/:id", validate({ params: produitIdParamSchema }), getProduit);

// La gestion du catalogue (création/édition/suppression) est réservée à
// l'admin et au vendeur ; le comptable reste en lecture seule sur les produits.
router.post("/", requireRole("admin", "vendeur"), validate({ body: createProduitSchema }), createProduit);
router.put(
  "/:id",
  requireRole("admin", "vendeur"),
  validate({ params: produitIdParamSchema, body: updateProduitSchema }),
  updateProduit
);
router.delete(
  "/:id",
  requireRole("admin", "vendeur"),
  validate({ params: produitIdParamSchema }),
  deleteProduit
);

export default router;
