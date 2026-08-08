import request from "supertest";
import { Express } from "express";
import { Role, User } from "../../src/models/User";

export interface RegisteredUser {
  accessToken: string;
  refreshToken: string;
  userId: string;
  entrepriseId: string;
  email: string;
}

let compteur = 0;

/** Inscrit un nouvel utilisateur (et sa propre entreprise) et retourne ses tokens. */
export async function registerAndLogin(
  app: Express,
  opts: { role?: Role; email?: string; entrepriseNom?: string } = {}
): Promise<RegisteredUser> {
  compteur += 1;
  const email = opts.email ?? `user${compteur}-${Date.now()}@pme.tn`;

  const res = await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password: "motdepasse123",
      nom: "Test User",
      role: opts.role ?? "admin",
      entreprise: {
        nom: opts.entrepriseNom ?? `PME Test ${compteur}`,
        matriculeFiscal: `MF${compteur}${Date.now()}`,
      },
    });

  if (res.status !== 201) {
    throw new Error(`Échec de l'inscription de test : ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    userId: res.body.user.id,
    entrepriseId: res.body.user.entrepriseId,
    email,
  };
}

export function authHeader(user: RegisteredUser) {
  return { Authorization: `Bearer ${user.accessToken}` };
}

/**
 * Promeut un utilisateur déjà inscrit en propriétaire de plateforme, en
 * contournant l'API (comme le ferait le script de bootstrap réel) — ce
 * privilège n'est jamais accordable via une route HTTP publique.
 */
export async function promoteToPlatformOwner(user: RegisteredUser): Promise<void> {
  await User.findByIdAndUpdate(user.userId, { isPlatformOwner: true });
}
