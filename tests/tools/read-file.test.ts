/**
 * ReadFileTool Tests
 *
 * Tests for the file reading tool functionality using Vitest
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ReadFileTool } from "../../src/agent-service/tools/read-file";
import { MockFileSystem } from "../mocks/mock-filesystem";

describe("ReadFileTool", () => {
  let mockFS: MockFileSystem;
  let tool: ReadFileTool;

  beforeEach(() => {
    mockFS = new MockFileSystem();
    tool = new ReadFileTool(mockFS);
  });

  it("should have correct metadata", () => {
    expect(tool.name).toBe("read_file");
    expect(tool.description).toBe("Read the contents of a file for analysis");
    expect(tool.parameters).toHaveProperty("type");
    expect(tool.parameters).toHaveProperty("properties");
    expect(tool.parameters).toHaveProperty("required");
  });

  it("should read existing file successfully", async () => {
    const result = await tool.execute({ path: "/test/file1.ts" });

    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("size");

    expect(result.content).toBe('console.log("Hello World");');
    expect(result.size).toBe(27);
  });

  it("should handle non-existent file", async () => {
    const result = await tool.execute({ path: "/test/nonexistent.txt" });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("File not found");
  });

  it("should handle empty file", async () => {
    mockFS.addFile("/test/empty.txt", "");

    const result = await tool.execute({ path: "/test/empty.txt" });

    expect(result.content).toBe("");
    expect(result.size).toBe(0);
  });

  it("should handle different file types", async () => {
    // Test JSON file
    const jsonResult = await tool.execute({ path: "/test/package.json" });
    expect(jsonResult.content).toContain('"name"');
    expect(jsonResult.content).toContain("test-project");

    // Test Markdown file
    const mdResult = await tool.execute({ path: "/test/README.md" });
    expect(mdResult.content).toContain("# Test Project");
  });
});
