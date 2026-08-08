import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";
import { Entreprise } from "../models/Entreprise";

/**
 * Réservé au propriétaire de la plateforme (opère au-dessus de toutes les
 * entreprises). Volontairement vérifié en base à chaque requête plutôt que
 * via un claim JWT mis en cache : cette frontière est sensible, on préfère
 * une révocation immédiate à une micro-optimisation de perf.
 */
export async function requirePlatformOwner(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());

  const user = await User.findById(req.user.userId).select("isPlatformOwner actif");
  if (!user || !user.actif || !user.isPlatformOwner) {
    return next(ApiError.forbidden("Accès réservé au propriétaire de la plateforme"));
  }

  return next();
}

/**
 * Bloque tout accès à l'API pour les utilisateurs d'une entreprise suspendue
 * par le propriétaire de la plateforme. Les données ne sont pas supprimées :
 * la suspension est réversible. À appliquer après requireAuth sur les routes
 * métier (pas sur /api/admin, qui opère au-dessus de ce mécanisme).
 */
export async function checkEntrepriseActive(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());

  const entreprise = await Entreprise.findById(req.user.entrepriseId).select("statut nom");
  if (!entreprise) return next(ApiError.unauthorized("Entreprise introuvable"));

  if (entreprise.statut === "suspendu") {
    return next(
      ApiError.forbidden(
        `Le compte de "${entreprise.nom}" est suspendu. Contactez le support pour le réactiver.`,
        "ENTREPRISE_SUSPENDUE"
      )
    );
  }

  return next();
}
