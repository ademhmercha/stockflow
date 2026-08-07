import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

function payloadInscription(email: string) {
  return {
    email,
    password: "motdepasse123",
    nom: "Test User",
    role: "admin",
    entreprise: {
      nom: "Ma PME",
      matriculeFiscal: "1234567A",
    },
  };
}

describe("Auth", () => {
  it("inscrit un utilisateur et son entreprise, puis retourne des tokens", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(payloadInscription("admin@pme.tn"));

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe("admin@pme.tn");
  });

  it("refuse une inscription en double sur le même email", async () => {
    await request(app).post("/api/auth/register").send(payloadInscription("dup@pme.tn"));
    const res = await request(app).post("/api/auth/register").send(payloadInscription("dup@pme.tn"));

    expect(res.status).toBe(409);
  });

  it("connecte un utilisateur avec les bons identifiants", async () => {
    await request(app).post("/api/auth/register").send(payloadInscription("login@pme.tn"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@pme.tn", password: "motdepasse123" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it("refuse une connexion avec un mauvais mot de passe", async () => {
    await request(app).post("/api/auth/register").send(payloadInscription("bad@pme.tn"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad@pme.tn", password: "mauvais-mot-de-passe" });

    expect(res.status).toBe(401);
  });

  it("refuse l'accès à une route protégée sans token", async () => {
    const res = await request(app).get("/api/produits");
    expect(res.status).toBe(401);
  });
});
