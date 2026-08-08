import request from "supertest";
import { createApp } from "../src/app";
import { registerAndLogin, authHeader, promoteToPlatformOwner } from "./helpers/auth";
import { creerProduit, creerClient } from "./helpers/fixtures";
import { Entreprise } from "../src/models/Entreprise";

const app = createApp();

describe("Administration plateforme — accès", () => {
  it("un utilisateur normal (admin d'entreprise) ne peut pas accéder aux routes admin", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });

    const res = await request(app).get("/api/admin/stats").set(authHeader(admin));
    expect(res.status).toBe(403);
  });

  it("un platform owner peut accéder aux stats plateforme", async () => {
    const owner = await registerAndLogin(app, { role: "admin" });
    await promoteToPlatformOwner(owner);

    const res = await request(app).get("/api/admin/stats").set(authHeader(owner));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalEntreprises");
    expect(res.body).toHaveProperty("entreprisesParStatut");
  });
});

describe("Administration plateforme — liste des entreprises (cross-tenant)", () => {
  it("liste toutes les entreprises, tous tenants confondus, avec compteurs corrects", async () => {
    const owner = await registerAndLogin(app, { role: "admin" });
    await promoteToPlatformOwner(owner);

    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    await creerProduit(app, entrepriseA);
    await creerProduit(app, entrepriseA);
    const clientA = await creerClient(app, entrepriseA);
    const produitA = await creerProduit(app, entrepriseA, { stockActuel: 10 });
    await request(app)
      .post("/api/factures")
      .set(authHeader(entrepriseA))
      .send({ clientId: clientA._id, lignes: [{ produitId: produitA._id, quantite: 1 }] });

    const res = await request(app)
      .get("/api/admin/entreprises?page=1&limit=50")
      .set(authHeader(owner));

    expect(res.status).toBe(200);
    const ligneA = res.body.data.find((e: { _id: string }) => e._id === entrepriseA.entrepriseId);
    expect(ligneA).toBeDefined();
    expect(ligneA.nombreProduits).toBe(3);
    expect(ligneA.nombreFactures).toBe(1);
    expect(ligneA.nombreUtilisateurs).toBe(1);
  });

  it("les compteurs d'une entreprise n'incluent jamais les données d'une autre", async () => {
    const owner = await registerAndLogin(app, { role: "admin" });
    await promoteToPlatformOwner(owner);

    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });
    await creerProduit(app, entrepriseA);
    await creerProduit(app, entrepriseB);
    await creerProduit(app, entrepriseB);

    const res = await request(app)
      .get("/api/admin/entreprises?page=1&limit=50")
      .set(authHeader(owner));

    const ligneA = res.body.data.find((e: { _id: string }) => e._id === entrepriseA.entrepriseId);
    const ligneB = res.body.data.find((e: { _id: string }) => e._id === entrepriseB.entrepriseId);
    expect(ligneA.nombreProduits).toBe(1);
    expect(ligneB.nombreProduits).toBe(2);
  });
});

describe("Administration plateforme — suspension d'entreprise", () => {
  it("suspendre une entreprise bloque immédiatement tous ses utilisateurs", async () => {
    const owner = await registerAndLogin(app, { role: "admin" });
    await promoteToPlatformOwner(owner);
    const entreprise = await registerAndLogin(app, { role: "admin" });

    // Accès normal avant suspension.
    const avant = await request(app).get("/api/produits").set(authHeader(entreprise));
    expect(avant.status).toBe(200);

    const suspension = await request(app)
      .put(`/api/admin/entreprises/${entreprise.entrepriseId}/statut`)
      .set(authHeader(owner))
      .send({ statut: "suspendu" });
    expect(suspension.status).toBe(200);
    expect(suspension.body.statut).toBe("suspendu");

    const apres = await request(app).get("/api/produits").set(authHeader(entreprise));
    expect(apres.status).toBe(403);
    expect(apres.body.error).toMatch(/suspendu/i);
    expect(apres.body.code).toBe("ENTREPRISE_SUSPENDUE");
  });

  it("réactiver une entreprise restaure l'accès", async () => {
    const owner = await registerAndLogin(app, { role: "admin" });
    await promoteToPlatformOwner(owner);
    const entreprise = await registerAndLogin(app, { role: "admin" });

    await Entreprise.findByIdAndUpdate(entreprise.entrepriseId, { statut: "suspendu" });
    const pendant = await request(app).get("/api/produits").set(authHeader(entreprise));
    expect(pendant.status).toBe(403);

    await request(app)
      .put(`/api/admin/entreprises/${entreprise.entrepriseId}/statut`)
      .set(authHeader(owner))
      .send({ statut: "actif" });

    const apres = await request(app).get("/api/produits").set(authHeader(entreprise));
    expect(apres.status).toBe(200);
  });

  it("un non-owner ne peut pas suspendre une entreprise", async () => {
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    const res = await request(app)
      .put(`/api/admin/entreprises/${entrepriseB.entrepriseId}/statut`)
      .set(authHeader(entrepriseA))
      .send({ statut: "suspendu" });

    expect(res.status).toBe(403);
  });

  it("la suspension d'une entreprise n'affecte pas les autres entreprises", async () => {
    const owner = await registerAndLogin(app, { role: "admin" });
    await promoteToPlatformOwner(owner);
    const entrepriseA = await registerAndLogin(app, { role: "admin" });
    const entrepriseB = await registerAndLogin(app, { role: "admin" });

    await request(app)
      .put(`/api/admin/entreprises/${entrepriseA.entrepriseId}/statut`)
      .set(authHeader(owner))
      .send({ statut: "suspendu" });

    const resB = await request(app).get("/api/produits").set(authHeader(entrepriseB));
    expect(resB.status).toBe(200);
  });
});
