/**
 * Read Directory Tool
 *
 * Reads all files in a directory, concatenates their contents,
 * and includes file names as headers.
 */

import { ITool, IFileSystem } from "../interfaces";
import path from "path";

const MAX_CHARS = 100_000; // keep tool results within the model context budget

export class ReadDirectoryTool implements ITool {
  name = "read_directory";
  description =
    "Read and concatenate contents of all files in a directory, with file names as headers";
  parameters = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the directory to read",
      },
    },
    required: ["path"],
  };

  constructor(private fileSystem: IFileSystem) {}

  async execute(args: { path: string }): Promise<any> {
    try {
      const dirPath = args.path.trim();
      const entries = await this.fileSystem.listDirectory(dirPath);
      let content = "";

      for (const entry of entries) {
        const filePath = path.join(dirPath, entry);
        if (content.length >= MAX_CHARS) break;
        if (await this.fileSystem.isFile(filePath)) {
          const fileContent = await this.fileSystem.readFile(filePath);
          content += `\n--- ${entry} ---\n${fileContent}\n`;
        }
      }

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
