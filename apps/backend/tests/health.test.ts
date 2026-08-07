import request from "supertest";
import { createApp } from "../src/app";

describe("GET /api/health", () => {
  it("retourne status ok et db connected", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", db: "connected" });
  });
});
