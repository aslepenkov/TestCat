import { describe, it, expect, vi, beforeEach } from "vitest";
import { StandaloneAgent } from "../../src/agent-service/agent";
import { CopilotAPI } from "../../src/agent-service/services/copilot-api";
import { ReadOnlyFileSystem } from "../../src/agent-service/services/read-only-filesystem";
import * as helpers from "../../src/agent-service/helpers";

// Mock dependencies
vi.mock("../../src/agent-service/services/copilot-api");
vi.mock("../../src/agent-service/services/read-only-filesystem");
vi.mock("../../src/agent-service/helpers");

describe("StandaloneAgent", () => {
  let agent: StandaloneAgent;
  const config = {
    workspacePath: "/test/workspace",
    githubToken: "test_token",
    maxIterations: 5,
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    agent = new StandaloneAgent(config);
  });

  it("should construct a StandaloneAgent instance", () => {
    expect(agent).toBeInstanceOf(StandaloneAgent);
    expect(ReadOnlyFileSystem).toHaveBeenCalledWith(config.workspacePath);
  });

  describe("initialize", () => {
    it("should initialize the agent successfully", async () => {
      const createWithGitHubToken = vi
        .spyOn(CopilotAPI, "createWithGitHubToken")
        .mockResolvedValue({ callAPI: vi.fn() } as any);

      await agent.initialize();

      expect(createWithGitHubToken).toHaveBeenCalledWith(config);
    });
  });

  describe("getPrompt", () => {
    it("should return the option prompt if it exists", async () => {
      const prompt = await agent.getPrompt(
        "option prompt",
        "system.txt",
        "fallback",
      );
      expect(prompt).toBe("option prompt");
    });

    it("should read the prompt from the file system if option prompt does not exist", async () => {
      const readFileOrFallback = vi.spyOn(
        (agent as any).fileSystem,
        "readFileOrFallback",
      );
      readFileOrFallback.mockResolvedValue("file prompt");
      const prompt = await agent.getPrompt(undefined, "system.txt", "fallback");
      expect(prompt).toBe("file prompt");
    });
  });

  describe("analyzeWorkspace", () => {
    it("should analyze the workspace and return a successful result", async () => {
      const getPromptSpy = vi
        .spyOn(StandaloneAgent.prototype, "getPrompt")
        .mockResolvedValue("prompt");
      const runAnalysisLoopSpy = vi
        // @ts-expect-error - private method
        .spyOn(StandaloneAgent.prototype, "runAnalysisLoop")
        .mockResolvedValue({
          success: true,
          response: "analysis",
          analysisData: "data",
          iterations: 1,
        });

      const result = await agent.analyzeWorkspace({});
      expect(result.success).toBe(true);
      expect(result.response).toBe("analysis");
      getPromptSpy.mockRestore();
      runAnalysisLoopSpy.mockRestore();
    });

    it("should handle errors during analysis", async () => {
      const getPromptSpy = vi
        .spyOn(StandaloneAgent.prototype, "getPrompt")
        .mockRejectedValue(new Error("test error"));
      const result = await agent.analyzeWorkspace({});
      expect(result.success).toBe(false);
      expect(result.error).toBe("test error");
      getPromptSpy.mockRestore();
    });
  });

  describe("runAnalysisLoop", () => {
    beforeEach(async () => {
      vi.spyOn(CopilotAPI, "createWithGitHubToken").mockResolvedValue({
        callAPI: vi.fn(),
      } as any);
      await agent.initialize();
    });
    it("should run the analysis loop and finish when finish_analyze is called", async () => {
      vi.spyOn(helpers, "extractToolCalls").mockReturnValueOnce([
        { name: "finish_analyze" },
      ]);
      const callAPISpy = vi
        .spyOn((agent as any).copilotAPI, "callAPI")
        .mockResolvedValueOnce("...<tool_code>finish_analyze()</tool_code>...")
        .mockResolvedValueOnce("final analysis");

      const result = await (agent as any).runAnalysisLoop("system", "user", {
        toolCalls: [],
        iterations: 0,
        analysisData: "",
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe(
        "...<tool_code>finish_analyze()</tool_code>...",
      );
      expect(callAPISpy).toHaveBeenCalledTimes(1);
    });

    it("should run the analysis loop and stop after max iterations", async () => {
      vi.spyOn(helpers, "extractToolCalls").mockReturnValue([]);
      const callAPISpy = vi
        .spyOn((agent as any).copilotAPI, "callAPI")
        .mockResolvedValue("no tool calls");

      const result = await (agent as any).runAnalysisLoop("system", "user", {
        toolCalls: [],
        iterations: 0,
        analysisData: "",
      });

      expect(result.success).toBe(true);
      expect(callAPISpy).toHaveBeenCalledTimes(config.maxIterations + 1);
    });
  });

  describe("callCopilotAPI", () => {
    it("should throw an error if copilotAPI is not initialized", async () => {
      await expect(
        (agent as any).callCopilotAPI("prompt", "system"),
      ).rejects.toThrow("Copilot API is not initialized.");
    });
  });
});
