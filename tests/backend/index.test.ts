import request from "supertest";
import { app, server } from "../../src/backend-service/index";
import { afterAll, describe, it, expect } from "vitest";

afterAll(() => {
  server.close();
});

describe("GET /health", () => {
  it("should return 200 OK", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });
});
