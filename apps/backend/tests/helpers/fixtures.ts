import request from "supertest";
import { Express } from "express";
import { authHeader, RegisteredUser } from "./auth";
import { Produit } from "../../src/models/Produit";

export function produitPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nom: "Produit Test",
    sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    categorie: "Général",
    prixAchat: 5,
    prixVente: 9.9,
    tauxTVA: 19,
    stockActuel: 10,
    seuilAlerte: 3,
    ...overrides,
  };
}

export async function creerProduit(app: Express, user: RegisteredUser, overrides = {}) {
  const res = await request(app)
    .post("/api/produits")
    .set(authHeader(user))
    .send(produitPayload(overrides));
  if (res.status !== 201) {
    throw new Error(`Échec de création du produit de test : ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

/**
 * Insère un produit directement via le modèle, en contournant l'API — utile
 * pour préparer des données appartenant à un rôle (ex: comptable) qui n'a pas
 * le droit de créer de produit lui-même via l'API.
 */
export async function creerProduitDirect(user: RegisteredUser, overrides = {}) {
  const produit = await Produit.create({
    ...produitPayload(overrides),
    entrepriseId: user.entrepriseId,
  });
  return produit.toObject();
}

export function clientPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nom: "Client Test",
    email: "client@test.tn",
    ...overrides,
  };
}

export async function creerClient(app: Express, user: RegisteredUser, overrides = {}) {
  const res = await request(app)
    .post("/api/clients")
    .set(authHeader(user))
    .send(clientPayload(overrides));
  if (res.status !== 201) {
    throw new Error(`Échec de création du client de test : ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}
