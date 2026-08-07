import { z } from "zod";

export const createClientSchema = z.object({
  nom: z.string().min(1),
  matriculeFiscal: z.string().optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
