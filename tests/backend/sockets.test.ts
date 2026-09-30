// @vitest-environment node
import { afterAll, describe, it, expect, vi } from "vitest";
import { io as client } from "socket.io-client";
import { EventEmitter } from "events";
import { spawn } from "child_process";

vi.mock("child_process", async (orig) => ({
  ...(await orig<typeof import("child_process")>()),
  spawn: vi.fn(),
}));

process.env.PORT = "0";
const { server } = await import("../../src/backend-service/index");
afterAll(() => {
  server.close();
});

const fakeChild = (code: number) => {
  const c: any = new EventEmitter();
  c.stdout = new EventEmitter();
  c.stderr = new EventEmitter();
  setTimeout(() => {
    c.stdout.emit("data", Buffer.from("line1\nline2\n"));
    c.stdout.emit("end");
    c.emit("close", code);
  }, 10);
  return c;
};

describe("socket analysis", () => {
  it("streams progress and completes", async () => {
    vi.mocked(spawn).mockImplementation(() => fakeChild(0) as any);
    if (!server.listening) await new Promise((r) => server.once("listening", r));
    const port = (server.address() as any).port;
    const s = client(`http://127.0.0.1:${port}`, { transports: ["websocket"] });
    const lines: string[] = [];
    s.on("analysis-progress", (d) => lines.push(d.message));
    const done = new Promise((r) => s.on("analysis-completed", r));
    s.emit("start-analysis", { prompt: "hi" });
    await done;
    expect(lines).toEqual(["line1", "line2"]);
    s.close();
  });
});
