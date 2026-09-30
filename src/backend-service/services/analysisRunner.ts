import { spawn } from "child_process";
import { buildAnalyzeArgs } from "../controllers/analyzeController";

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

export type LogType = "info" | "error";

/**
 * Runs the agent CLI in its container, streaming each output line to onLine.
 * Resolves with the exit code; rejects if the process cannot be started.
 */
export const runAnalysisStreaming = (
  body: Record<string, unknown>,
  onLine: (line: string, type: LogType) => void,
): Promise<number> =>
  new Promise((resolve, reject) => {
    const child = spawn("docker", buildAnalyzeArgs(body));
    const pipe = (stream: NodeJS.ReadableStream, type: LogType) => {
      let buffer = "";
      const emit = (raw: string) => {
        const line = raw.replace(ANSI, "");
        onLine(line, /\[error\]/.test(line) ? "error" : type);
      };
      stream.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.filter(Boolean).forEach(emit);
      });
      stream.on("end", () => buffer && emit(buffer));
    };
    pipe(child.stdout, "info");
    pipe(child.stderr, "info");
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
