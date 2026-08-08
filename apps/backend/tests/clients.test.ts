import request from "supertest";
import { createApp } from "../src/app";
import { registerAndLogin, authHeader } from "./helpers/auth";
import { creerClient, clientPayload } from "./helpers/fixtures";

const app = createApp();

describe("Clients", () => {
  it("crée un client et le retrouve dans la liste", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const client = await creerClient(app, admin, { nom: "Société Al Amine" });

    expect(client.nom).toBe("Société Al Amine");

    const res = await request(app).get("/api/clients").set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("accepte un client sans matricule fiscal (particulier)", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const res = await request(app)
      .post("/api/clients")
      .set(authHeader(admin))
      .send({ nom: "Karim Ben Ahmed" });

    expect(res.status).toBe(201);
    expect(res.body.matriculeFiscal ?? null).toBeNull();
  });

  it("modifie un client existant", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    const client = await creerClient(app, admin);

    const res = await request(app)
      .put(`/api/clients/${client._id}`)
      .set(authHeader(admin))
      .send({ telephone: "71 234 567" });

    expect(res.status).toBe(200);
    expect(res.body.telephone).toBe("71 234 567");
  });

  it("pagine correctement la liste des clients", async () => {
    const admin = await registerAndLogin(app, { role: "admin" });
    for (let i = 0; i < 15; i++) {
      await creerClient(app, admin, clientPayload({ nom: `Client ${i}` }));
    }

    const res = await request(app).get("/api/clients?page=2&limit=10").set(authHeader(admin));
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 10, total: 15, totalPages: 2 });
  });
});
