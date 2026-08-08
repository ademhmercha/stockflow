import { z } from "zod";
import { STATUTS_ENTREPRISE } from "../models/Entreprise";

export const updateStatutEntrepriseSchema = z.object({
  statut: z.enum(STATUTS_ENTREPRISE),
});

export const entrepriseIdParamSchema = z.object({
  id: z.string().min(1),
});

export type UpdateStatutEntrepriseInput = z.infer<typeof updateStatutEntrepriseSchema>;
