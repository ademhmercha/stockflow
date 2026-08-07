import { z } from "zod";
import { TYPES_MOUVEMENT } from "../models/MouvementStock";

export const createMouvementSchema = z.object({
  produitId: z.string().min(1),
  type: z.enum(TYPES_MOUVEMENT),
  quantite: z.number().int().min(1),
  motif: z.string().optional(),
});

export type CreateMouvementInput = z.infer<typeof createMouvementSchema>;
