import request from "supertest";
import { createApp } from "../src/app";
import { registerAndLogin, authHeader } from "./helpers/auth";
import { creerProduit, creerClient } from "./helpers/fixtures";

const app = createApp();

/**
 * Ces tests vérifient qu'une entreprise ne peut jamais lire, modifier, ni même
 * détecter l'existence des données d'une autre entreprise — c'est la garantie
 * fondamentale d'un SaaS multi-tenant. Toute requête cross-tenant doit se
 * comporter comme si la ressource n'existait pas (404), jamais 403 (qui
 * confirmerait son existence).
 */
describe("Isolation multi-tenant", () => {
  it("la liste des produits d'une entreprise n'inclut jamais ceux d'une autre", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    await creerProduit(app, entrepriseA, { nom: "Produit A", sku: "A-001" });
    await creerProduit(app, entrepriseB, { nom: "Produit B", sku: "B-001" });

    const resA = await request(app).get("/api/produits").set(authHeader(entrepriseA));
    const noms = resA.body.data.map((p: { nom: string }) => p.nom);

    expect(noms).toContain("Produit A");
    expect(noms).not.toContain("Produit B");
    expect(resA.body.pagination.total).toBe(1);
  });

  it("un produit d'une autre entreprise renvoie 404, pas 403, en lecture directe", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });
    const produitB = await creerProduit(app, entrepriseB);

    const res = await request(app)
      .get(`/api/produits/${produitB._id}`)
      .set(authHeader(entrepriseA));

    expect(res.status).toBe(404);
  });

  it("impossible de modifier le produit d'une autre entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });
    const produitB = await creerProduit(app, entrepriseB, { prixVente: 10 });

    const res = await request(app)
      .put(`/api/produits/${produitB._id}`)
      .set(authHeader(entrepriseA))
      .send({ prixVente: 999 });

    expect(res.status).toBe(404);

    // Le produit de l'entreprise B ne doit pas avoir bougé.
    const check = await request(app)
      .get(`/api/produits/${produitB._id}`)
      .set(authHeader(entrepriseB));
    expect(check.body.prixVente).toBe(10);
  });

  it("impossible de supprimer le produit d'une autre entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });
    const produitB = await creerProduit(app, entrepriseB);

    const res = await request(app)
      .delete(`/api/produits/${produitB._id}`)
      .set(authHeader(entrepriseA));
    expect(res.status).toBe(404);

    const check = await request(app)
      .get(`/api/produits/${produitB._id}`)
      .set(authHeader(entrepriseB));
    expect(check.body.actif).toBe(true);
  });

  it("les clients sont isolés par entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    await creerClient(app, entrepriseA, { nom: "Client A" });
    const clientB = await creerClient(app, entrepriseB, { nom: "Client B" });

    const listeA = await request(app).get("/api/clients").set(authHeader(entrepriseA));
    expect(listeA.body.data.map((c: { nom: string }) => c.nom)).not.toContain("Client B");

    const getDirect = await request(app)
      .get(`/api/clients/${clientB._id}`)
      .set(authHeader(entrepriseA));
    expect(getDirect.status).toBe(404);
  });

  it("impossible de créer une facture pour le client d'une autre entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    const produitA = await creerProduit(app, entrepriseA, { stockActuel: 10 });
    const clientB = await creerClient(app, entrepriseB);

    const res = await request(app)
      .post("/api/factures")
      .set(authHeader(entrepriseA))
      .send({ clientId: clientB._id, lignes: [{ produitId: produitA._id, quantite: 1 }] });

    expect(res.status).toBe(404);
  });

  it("impossible de créer une facture avec un produit d'une autre entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    const clientA = await creerClient(app, entrepriseA);
    const produitB = await creerProduit(app, entrepriseB, { stockActuel: 10 });

    const res = await request(app)
      .post("/api/factures")
      .set(authHeader(entrepriseA))
      .send({ clientId: clientA._id, lignes: [{ produitId: produitB._id, quantite: 1 }] });

    expect(res.status).toBe(404);
  });

  it("les factures et le chiffre d'affaires du dashboard sont isolés par entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    const produitA = await creerProduit(app, entrepriseA, { stockActuel: 100, prixVente: 100, tauxTVA: 19 });
    const clientA = await creerClient(app, entrepriseA);
    const factureA = await request(app)
      .post("/api/factures")
      .set(authHeader(entrepriseA))
      .send({ clientId: clientA._id, lignes: [{ produitId: produitA._id, quantite: 1 }] });
    await request(app)
      .put(`/api/factures/${factureA.body._id}/statut`)
      .set(authHeader(entrepriseA))
      .send({ statut: "payee" });

    // Entreprise B n'a rien facturé : son CA doit être nul, pas contaminé par A.
    const statsB = await request(app).get("/api/dashboard/stats").set(authHeader(entrepriseB));
    expect(statsB.body.chiffreAffairesMois).toBe(0);
    expect(statsB.body.nombreFacturesMois).toBe(0);

    const facturesB = await request(app).get("/api/factures").set(authHeader(entrepriseB));
    expect(facturesB.body.data).toHaveLength(0);
  });

  it("les mouvements de stock sont isolés par entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    const produitA = await creerProduit(app, entrepriseA, { stockActuel: 10 });
    await request(app)
      .post("/api/stock/mouvements")
      .set(authHeader(entrepriseA))
      .send({ produitId: produitA._id, type: "entree", quantite: 5, motif: "Test A" });

    const mouvementsB = await request(app).get("/api/stock/mouvements").set(authHeader(entrepriseB));
    expect(mouvementsB.body).toHaveLength(0);
  });
});
