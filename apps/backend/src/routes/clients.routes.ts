import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { checkEntrepriseActive } from "../middlewares/platform";
import { validate } from "../middlewares/validate";
import {
  clientIdParamSchema,
  createClientSchema,
  updateClientSchema,
} from "../validators/client.validator";
import { paginationQuerySchema } from "../validators/pagination.validator";
import { createClient, getClient, listClients, updateClient } from "../controllers/clients.controller";

const router = Router();

router.use(requireAuth, checkEntrepriseActive);

router.get("/", validate({ query: paginationQuerySchema }), listClients);
router.get("/:id", validate({ params: clientIdParamSchema }), getClient);
router.post(
  "/",
  requireRole("admin", "vendeur", "comptable"),
  validate({ body: createClientSchema }),
  createClient
);
router.put(
  "/:id",
  requireRole("admin", "vendeur", "comptable"),
  validate({ params: clientIdParamSchema, body: updateClientSchema }),
  updateClient
);

export default router;
