import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { ReadOnlyFileSystem } from "../../src/agent-service/services/read-only-filesystem";
import { extractToolCalls } from "../../src/agent-service/helpers/responseParser";

describe("ReadOnlyFileSystem confinement", () => {
  let root: string;
  let outside: string;
  let fsx: ReadOnlyFileSystem;

  beforeAll(() => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "ws-"));
    root = path.join(base, "workspace");
    outside = path.join(base, "secret.txt");
    fs.mkdirSync(root);
    fs.writeFileSync(path.join(root, "ok.txt"), "ok");
    fs.writeFileSync(outside, "secret");
    fs.symlinkSync(outside, path.join(root, "link.txt"));
    fsx = new ReadOnlyFileSystem(root);
  });
  afterAll(() => fs.rmSync(path.dirname(root), { recursive: true, force: true }));

  it("reads files inside the workspace", async () => {
    expect(await fsx.readFile("ok.txt")).toBe("ok");
    expect(await fsx.readFile(path.join(root, "ok.txt"))).toBe("ok");
  });
  it.each(["../secret.txt", "/etc/passwd", "link.txt"])("rejects %s", async (p) => {
    await expect(fsx.readFile(p)).rejects.toThrow(/outside the workspace/);
  });
});

describe("extractToolCalls", () => {
  it("parses several calls and ignores prose braces", () => {
    const text = `Plan {not json}
{"tool_call":{"name":"read_file","arguments":{"path":"a}b.ts"}}}
and {"tool_call":{"name":"finish_analyze","arguments":{}}}`;
    expect(extractToolCalls(text).map((c) => c.name)).toEqual([
      "read_file",
      "finish_analyze",
    ]);
  });
  it("returns [] for plain text", () => {
    expect(extractToolCalls("just words")).toEqual([]);
  });
});
