import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Protège contre le brute-force sur les identifiants : 10 tentatives par IP
// toutes les 15 minutes sur les routes d'authentification sensibles.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { error: "Trop de tentatives, réessayez dans quelques minutes." },
});
