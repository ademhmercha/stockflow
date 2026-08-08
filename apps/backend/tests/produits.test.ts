import request from "supertest";
import { createApp } from "../src/app";
import { registerAndLogin } from "./helpers/auth";
import { creerProduit, produitPayload } from "./helpers/fixtures";
import { authHeader } from "./helpers/auth";

const app = createApp();

describe("Produits", () => {
  it("crée un produit et le retrouve dans la liste", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin, { nom: "Huile d'olive 1L", sku: "HUI-001" });

    expect(produit.nom).toBe("Huile d'olive 1L");
    expect(produit.sku).toBe("HUI-001");

    const res = await request(app).get("/api/produits").set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it("refuse un SKU en double au sein de la même entreprise", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    await creerProduit(app, admin, { sku: "DUP-001" });

    const res = await request(app)
      .post("/api/produits")
      .set(authHeader(admin))
      .send(produitPayload({ sku: "DUP-001" }));

    expect(res.status).toBe(409);
  });

  it("permet le même SKU dans deux entreprises différentes", async () => {
    const admin1 = await registerAndLogin(app, { role: "admin" });
    const admin2 = await registerAndLogin(app, { role: "admin" });

    const res1 = await request(app)
      .post("/api/produits")
      .set(authHeader(admin1))
      .send(produitPayload({ sku: "PARTAGE-001" }));
    const res2 = await request(app)
      .post("/api/produits")
      .set(authHeader(admin2))
      .send(produitPayload({ sku: "PARTAGE-001" }));

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });

  it("modifie un produit existant", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin);

    const res = await request(app)
      .put(`/api/produits/${produit._id}`)
      .set(authHeader(admin))
      .send({ prixVente: 15.5 });

    expect(res.status).toBe(200);
    expect(res.body.prixVente).toBe(15.5);
  });

  it("supprime logiquement un produit (soft delete) sans le sortir de la base", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const produit = await creerProduit(app, admin);

    const del = await request(app).delete(`/api/produits/${produit._id}`).set(authHeader(admin));
    expect(del.status).toBe(204);

    // Un produit désactivé ne doit plus apparaître dans la liste...
    const liste = await request(app).get("/api/produits").set(authHeader(admin));
    expect(liste.body.data.find((p: { _id: string }) => p._id === produit._id)).toBeUndefined();

    // ...mais reste accessible par son id (pour préserver l'historique des factures/mouvements).
    const get = await request(app).get(`/api/produits/${produit._id}`).set(authHeader(admin));
    expect(get.status).toBe(200);
    expect(get.body.actif).toBe(false);
  });

  it("renvoie 404 pour un produit inexistant", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const res = await request(app)
      .get("/api/produits/000000000000000000000000")
      .set(authHeader(admin));
    expect(res.status).toBe(404);
  });

  it("pagine correctement la liste des produits", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    for (let i = 0; i < 25; i++) {
      await creerProduit(app, admin, { sku: `PAGE-${i}`, nom: `Produit ${i}` });
    }

    const page1 = await request(app)
      .get("/api/produits?page=1&limit=10")
      .set(authHeader(admin));
    expect(page1.body.data).toHaveLength(10);
    expect(page1.body.pagination).toMatchObject({ page: 1, limit: 10, total: 25, totalPages: 3 });

    const page3 = await request(app)
      .get("/api/produits?page=3&limit=10")
      .set(authHeader(admin));
    expect(page3.body.data).toHaveLength(5);
  });
});
