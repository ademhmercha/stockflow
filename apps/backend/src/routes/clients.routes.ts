import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";
import { validate } from "../middlewares/validate";
import {
  clientIdParamSchema,
  createClientSchema,
  updateClientSchema,
} from "../validators/client.validator";
import { createClient, getClient, listClients, updateClient } from "../controllers/clients.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listClients);
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
