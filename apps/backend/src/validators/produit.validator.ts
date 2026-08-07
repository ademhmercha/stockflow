import { z } from "zod";

const tauxTVA = z.union([z.literal(19), z.literal(13), z.literal(7), z.literal(0)]);

export const createProduitSchema = z.object({
  nom: z.string().min(1),
  sku: z.string().min(1),
  categorie: z.string().optional(),
  prixAchat: z.number().min(0),
  prixVente: z.number().min(0),
  tauxTVA,
  stockActuel: z.number().min(0).default(0),
  seuilAlerte: z.number().min(0).default(5),
});

export const updateProduitSchema = createProduitSchema.partial();

export const produitIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateProduitInput = z.infer<typeof createProduitSchema>;
export type UpdateProduitInput = z.infer<typeof updateProduitSchema>;
