import { Request, Response } from "express";
import { execFile } from "child_process";

export const buildAnalyzeArgs = (body: Record<string, unknown>): string[] => {
  const { workspace, debug, model, maxIterations, token, systemPrompt, prompt } =
    body;
  const args = ["exec", "testcatai-agent", "testcatai", "analyze"];
  if (workspace) args.push(`--workspace=${workspace}`);
  if (debug) args.push("--debug");
  if (model) args.push(`--model=${model}`);
  if (maxIterations) args.push(`--maxIterations=${maxIterations}`);
  if (token) args.push(`--token=${token}`);
  if (systemPrompt) args.push(`--systemPrompt=${systemPrompt}`);
  if (prompt) args.push(`--prompt=${prompt}`);
  return args;
};

export const runAnalyze = (req: Request, res: Response) => {
  const args = buildAnalyzeArgs(req.body ?? {});
  // Never log the token
  console.log("docker", args.map((a) => (a.startsWith("--token=") ? "--token=***" : a)).join(" "));
  // execFile passes args directly, without a shell, so user input cannot inject commands
  execFile("docker", args, (error, stdout, stderr) => {
    const output = [...stdout.split("\n"), ...stderr.split("\n")];
    if (error) {
      return res.status(500).json({ error: error.message, output });
    }
    res.json({ output });
  });
};
