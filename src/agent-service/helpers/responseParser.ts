import type { ToolCall } from "../interfaces";

/** Yields every top-level balanced {...} block, ignoring braces inside JSON strings. */
function* jsonObjectCandidates(text: string): Generator<string> {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"' && depth > 0) inString = true;
    else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}" && depth > 0) {
      depth--;
      if (depth === 0) yield text.slice(start, i + 1);
    }
  }
}

export function extractToolCalls(response: string): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const candidate of jsonObjectCandidates(response)) {
    try {
      const toolCall = JSON.parse(candidate)?.tool_call;
      if (toolCall && typeof toolCall.name === "string") calls.push(toolCall);
    } catch {
      // not JSON (e.g. a code snippet in prose) - ignore
    }
  }
  return calls;
}
