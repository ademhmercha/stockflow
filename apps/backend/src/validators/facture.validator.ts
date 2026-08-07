import { z } from "zod";

const tauxTVA = z.union([z.literal(19), z.literal(13), z.literal(7), z.literal(0)]);

const ligneSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().int().min(1),
  // prixUnitaire et tauxTVA sont optionnels en entrée : si absents, ils sont
  // repris du produit en base au moment de la création (voir factures.controller).
  prixUnitaire: z.number().min(0).optional(),
  tauxTVA: tauxTVA.optional(),
});

export const createFactureSchema = z.object({
  clientId: z.string().min(1),
  lignes: z.array(ligneSchema).min(1, "Au moins une ligne est requise"),
});

export const factureIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateFactureInput = z.infer<typeof createFactureSchema>;
