/**
 * Read File Tool
 *
 * Provides safe file reading capabilities with content size limits
 */

import { ITool, IFileSystem } from "../interfaces";

const MAX_CHARS = 100_000; // keep tool results within the model context budget

export class ReadFileTool implements ITool {
  name = "read_file";
  description = "Read the contents of a file for analysis";
  parameters = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read",
      },
    },
    required: ["path"],
  };

  constructor(private fileSystem: IFileSystem) {}

  async execute(args: { path: string }): Promise<any> {
    try {
      const content = await this.fileSystem.readFile(args.path);
      return {
        content: content.slice(0, MAX_CHARS),
        size: content.length,
        truncated: content.length > MAX_CHARS,
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
