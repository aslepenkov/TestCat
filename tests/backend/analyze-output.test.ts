import request from "supertest";
import { afterAll, describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

vi.mock("child_process");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "out-"));
process.env.OUTPUT_DIR = dir;
fs.writeFileSync(path.join(dir, "a.md"), "# hi");

const { app, server } = await import("../../src/backend-service/index");

afterAll(() => {
  server.close();
});

beforeEach(() => vi.mocked(execFile).mockReset());

describe("POST /analyze", () => {
  it("passes args without a shell", async () => {
    vi.mocked(execFile).mockImplementation(((_c: any, _a: any, ...rest: any[]) => {
      const cb = rest[rest.length - 1];
      if (typeof cb === "function") cb(null, "out\n", "");
    }) as any);
    const prompt = 'x"; rm -rf / #';
    const res = await request(app).post("/analyze").send({ prompt, debug: true });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain("out");
    const args = vi.mocked(execFile).mock.calls[0][1] as string[];
    expect(args).toContain(`--prompt=${prompt}`);
    expect(args).toContain("--debug");
  });

  it("returns 500 on failure", async () => {
    vi.mocked(execFile).mockImplementation(((_c: any, _a: any, ...rest: any[]) => {
      const cb = rest[rest.length - 1];
      if (typeof cb === "function") cb(new Error("boom"), "", "err");
    }) as any);
    const res = await request(app).post("/analyze").send({});
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("boom");
  });
});

describe("output endpoints", () => {
  it("lists files", async () => {
    const res = await request(app).get("/output");
    expect(res.body.files.map((f: any) => f.name)).toEqual(["a.md"]);
  });
  it("reads a file", async () => {
    const res = await request(app).get("/output/a.md");
    expect(res.body.content).toBe("# hi");
    expect(res.body.contentType).toBe("text/markdown");
  });
  it("404s and blocks traversal", async () => {
    expect((await request(app).get("/output/nope.md")).status).toBe(404);
    expect((await request(app).get("/output/..%2Fpackage.json")).status).toBe(404);
  });
});
