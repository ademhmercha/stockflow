import { z } from "zod";
import { ROLES } from "../models/User";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "8 caractères minimum"),
  nom: z.string().min(1).optional(),
  role: z.enum(ROLES).default("vendeur"),
  entreprise: z.object({
    nom: z.string().min(1),
    matriculeFiscal: z.string().min(1),
    adresse: z.string().optional(),
    tauxTVAParDefaut: z.number().optional(),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
