import request from "supertest";
import { createApp } from "../src/app";
import { registerAndLogin, authHeader } from "./helpers/auth";
import { creerProduit, produitPayload, creerClient, creerProduitDirect } from "./helpers/fixtures";

const app = createApp();

describe("RBAC — produits (réservé admin/vendeur, comptable en lecture seule)", () => {
  it("un comptable ne peut pas créer de produit", async () => {
    const comptable = await registerAndLogin(app, { role: "comptable" });

    const res = await request(app)
      .post("/api/produits")
      .set(authHeader(comptable))
      .send(produitPayload());

    expect(res.status).toBe(403);
  });

  it("un comptable ne peut pas modifier un produit", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin);
    // Un comptable d'une AUTRE entreprise n'a de toute façon pas accès à ce produit ;
    // on vérifie ici le rejet par rôle, indépendamment de l'appartenance.
    const comptable = await registerAndLogin(app, { role: "comptable" });

    const res = await request(app)
      .put(`/api/produits/${produit._id}`)
      .set(authHeader(comptable))
      .send({ prixVente: 99 });

    expect(res.status).toBe(403);
  });

  it("un comptable ne peut pas supprimer un produit", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin);
    const comptable = await registerAndLogin(app, { role: "comptable" });

    const res = await request(app).delete(`/api/produits/${produit._id}`).set(authHeader(comptable));
    expect(res.status).toBe(403);
  });

  it("un comptable peut lister les produits (lecture seule)", async () => {
    const comptable = await registerAndLogin(app, { role: "comptable" });
    const res = await request(app).get("/api/produits").set(authHeader(comptable));
    expect(res.status).toBe(200);
  });

  it("un vendeur peut créer un produit", async () => {
    const vendeur = await registerAndLogin(app, { role: "vendeur" });
    const res = await request(app)
      .post("/api/produits")
      .set(authHeader(vendeur))
      .send(produitPayload());
    expect(res.status).toBe(201);
  });

  it("un admin peut créer, modifier et supprimer un produit", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin);

    const update = await request(app)
      .put(`/api/produits/${produit._id}`)
      .set(authHeader(admin))
      .send({ prixVente: 20 });
    expect(update.status).toBe(200);

    const del = await request(app).delete(`/api/produits/${produit._id}`).set(authHeader(admin));
    expect(del.status).toBe(204);
  });
});

describe("RBAC — mouvements de stock (réservé admin/vendeur)", () => {
  it("un comptable ne peut pas créer de mouvement de stock", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin, { stockActuel: 10 });
    const comptable = await registerAndLogin(app, { role: "comptable" });

    const res = await request(app)
      .post("/api/stock/mouvements")
      .set(authHeader(comptable))
      .send({ produitId: produit._id, type: "entree", quantite: 5 });

    expect(res.status).toBe(403);
  });

  it("un vendeur peut créer un mouvement de stock", async () => {
    const vendeur = await registerAndLogin(app, { role: "vendeur" });
    const produitVendeur = await creerProduit(app, vendeur, { stockActuel: 10 });

    const res = await request(app)
      .post("/api/stock/mouvements")
      .set(authHeader(vendeur))
      .send({ produitId: produitVendeur._id, type: "entree", quantite: 5 });

    expect(res.status).toBe(201);
  });
});

describe("RBAC — clients et factures (ouvert à admin/vendeur/comptable)", () => {
  it("un comptable peut créer un client", async () => {
    const comptable = await registerAndLogin(app, { role: "comptable" });
    const res = await request(app)
      .post("/api/clients")
      .set(authHeader(comptable))
      .send({ nom: "Client du comptable" });
    expect(res.status).toBe(201);
  });

  it("un comptable peut créer une facture", async () => {
    const comptable = await registerAndLogin(app, { role: "comptable" });
    // Créé directement via le modèle : un comptable ne peut pas créer de produit
    // lui-même (voir la suite RBAC produits ci-dessus), ce n'est pas ce qu'on teste ici.
    const produit = await creerProduitDirect(comptable, { stockActuel: 10 });
    const client = await creerClient(app, comptable);

    const res = await request(app)
      .post("/api/factures")
      .set(authHeader(comptable))
      .send({ clientId: client._id, lignes: [{ produitId: produit._id, quantite: 2 }] });

    expect(res.status).toBe(201);
  });

  it("un comptable peut changer le statut d'une facture", async () => {
    const comptable = await registerAndLogin(app, { role: "comptable" });
    const produit = await creerProduitDirect(comptable, { stockActuel: 10 });
    const client = await creerClient(app, comptable);
    const facture = await request(app)
      .post("/api/factures")
      .set(authHeader(comptable))
      .send({ clientId: client._id, lignes: [{ produitId: produit._id, quantite: 1 }] });

    const res = await request(app)
      .put(`/api/factures/${facture.body._id}/statut`)
      .set(authHeader(comptable))
      .send({ statut: "payee" });

    expect(res.status).toBe(200);
    expect(res.body.statut).toBe("payee");
  });
});
