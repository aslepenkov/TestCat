import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

const outputDir = () => path.resolve(process.env.OUTPUT_DIR || "output");

export const listOutput = async (_req: Request, res: Response) => {
  try {
    const dir = outputDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && !e.name.startsWith("."))
        .map(async (e) => ({
          name: e.name,
          modified: (await fs.stat(path.join(dir, e.name))).mtime,
        })),
    );
    files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
};

export const readOutput = async (req: Request, res: Response) => {
  const dir = outputDir();
  const name = path.basename(String(req.params.filename));
  try {
    const content = await fs.readFile(path.join(dir, name), "utf8");
    res.json({
      name,
      content,
      contentType: name.endsWith(".md") ? "text/markdown" : "text/plain",
    });
  } catch {
    res.status(404).json({ error: "File not found" });
  }
};
