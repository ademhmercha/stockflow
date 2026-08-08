import request from "supertest";
import { createApp } from "../src/app";
import { registerAndLogin, authHeader } from "./helpers/auth";
import { creerProduit } from "./helpers/fixtures";

const app = createApp();

describe("Mouvements de stock", () => {
  it("une entrée augmente le stock actuel", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin, { stockActuel: 10 });

    const res = await request(app)
      .post("/api/stock/mouvements")
      .set(authHeader(admin))
      .send({ produitId: produit._id, type: "entree", quantite: 5, motif: "Réception" });

    expect(res.status).toBe(201);

    const check = await request(app).get(`/api/produits/${produit._id}`).set(authHeader(admin));
    expect(check.body.stockActuel).toBe(15);
  });

  it("une sortie diminue le stock actuel", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin, { stockActuel: 10 });

    const res = await request(app)
      .post("/api/stock/mouvements")
      .set(authHeader(admin))
      .send({ produitId: produit._id, type: "sortie", quantite: 4, motif: "Vente" });

    expect(res.status).toBe(201);

    const check = await request(app).get(`/api/produits/${produit._id}`).set(authHeader(admin));
    expect(check.body.stockActuel).toBe(6);
  });

  it("refuse une sortie qui dépasse le stock disponible, sans modifier le stock", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin, { stockActuel: 3 });

    const res = await request(app)
      .post("/api/stock/mouvements")
      .set(authHeader(admin))
      .send({ produitId: produit._id, type: "sortie", quantite: 10, motif: "Vente" });

    expect(res.status).toBe(400);

    const check = await request(app).get(`/api/produits/${produit._id}`).set(authHeader(admin));
    expect(check.body.stockActuel).toBe(3);
  });

  it("liste les produits sous leur seuil d'alerte", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    await creerProduit(app, admin, { nom: "Sous le seuil", sku: "LOW-1", stockActuel: 2, seuilAlerte: 10 });
    await creerProduit(app, admin, { nom: "Au-dessus du seuil", sku: "OK-1", stockActuel: 50, seuilAlerte: 10 });

    const res = await request(app).get("/api/stock/alertes").set(authHeader(admin));

    expect(res.status).toBe(200);
    const noms = res.body.map((p: { nom: string }) => p.nom);
    expect(noms).toContain("Sous le seuil");
    expect(noms).not.toContain("Au-dessus du seuil");
  });
});
