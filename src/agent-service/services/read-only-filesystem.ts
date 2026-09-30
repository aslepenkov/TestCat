/**
 * Read-Only File System Implementation
 *
 * Provides safe, read-only access to the file system with workspace structure analysis
 */

import * as path from "path";
import fs from "fs-extra";
import { IFileSystem } from "../interfaces";

export class ReadOnlyFileSystem implements IFileSystem {
  private readonly workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async readFile(filePath: string): Promise<string> {
    const absolutePath = await this.resolvePath(filePath);
    return await fs.readFile(absolutePath, "utf-8");
  }

  async readFileOrFallback(
    filePath: string,
    fallback: string,
  ): Promise<string> {
    // Trusted, internal use only (prompt files live outside the workspace)
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return fallback;
    }
  }

  async isFile(filePath: string): Promise<boolean> {
    const absolutePath = await this.resolvePath(filePath);
    try {
      const stat = await fs.stat(absolutePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    const absolutePath = await this.resolvePath(dirPath);
    return await fs.readdir(absolutePath);
  }

  async exists(filePath: string): Promise<boolean> {
    const absolutePath = await this.resolvePath(filePath);
    return await fs.pathExists(absolutePath);
  }

  async getWorkspaceStructure(
    maxSize: number = 2000,
    maxDepth = 10,
  ): Promise<string> {
    return this.buildDirectoryTree(this.workspacePath, 0, maxSize, maxDepth);
  }

  /**
   * Resolves a path and guarantees it stays inside the workspace.
   * Tool arguments come from the LLM (and thus from untrusted repo content),
   * so ".." segments, absolute paths and symlinks must not escape the root.
   */
  private async resolvePath(filePath: string): Promise<string> {
    const root = path.resolve(this.workspacePath);
    const resolved = path.resolve(root, filePath);
    this.assertInside(root, resolved, filePath);

    try {
      const real = await fs.realpath(resolved);
      this.assertInside(await fs.realpath(root), real, filePath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
    return resolved;
  }

  private assertInside(root: string, target: string, original: string): void {
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Access denied: path is outside the workspace: ${original}`);
    }
  }

  private async buildDirectoryTree(
    dirPath: string,
    depth: number = 0,
    maxSize: number,
    maxDepth: number = 10, // Max depth to prevent infinite recursion
  ): Promise<string> {
    let result = "";

    // Stop recursion if maxDepth is reached
    if (depth > maxDepth) {
      return result;
    }

    try {
      // Read entries in the directory
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      // Sort entries (directories first, then files)
      const sortedEntries = this.sortDirectoryEntries(entries);

      for (const entry of sortedEntries) {
        if (this.shouldSkipEntry(entry.name)) {
          continue; // Skip files and folders that should be ignored
        }

        const entryPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.workspacePath, entryPath);

        // Add the current entry (directory or file) to the result
        result += entry.isDirectory()
          ? `${relativePath}/\n`
          : `${relativePath}\n`;

        // Check if result exceeds maxSize and truncate if necessary
        if (result.length > maxSize) {
          return (
            result.slice(0, maxSize) + "\n... (truncated due to size limit)"
          );
        }

        // Recursively process subdirectories
        if (entry.isDirectory()) {
          const subTree = await this.buildDirectoryTree(
            entryPath,
            depth + 1,
            maxSize,
            maxDepth,
          );

          result += subTree;

          // Check again for size limit after processing subtree
          if (result.length > maxSize) {
            return (
              result.slice(0, maxSize) + "\n... (truncated due to size limit)"
            );
          }
        }
      }
    } catch (error) {
      // Handle cases where the directory is inaccessible (e.g., permissions issues)
      result += `Error reading directory: ${dirPath}\n`;
    }

    return result;
  }

  private sortDirectoryEntries(entries: any[]): any[] {
    return entries.sort((a: any, b: any) => {
      // Directories first, then files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  private shouldSkipEntry(entryName: string): boolean {
    const skipPatterns = [
      "bin",
      "obj",
      "node_modules",
      "dist",
      "build",
      "__pycache__",
      "logs",
    ];

    return entryName.startsWith(".") || skipPatterns.includes(entryName);
  }
}
