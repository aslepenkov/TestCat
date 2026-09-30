/**
 * Agent Module - Domain Logic Layer
 *
 * Exports agent implementations and related interfaces
 */
import * as path from "path";
import { ToolRegistry } from "../tools";
import {
  validateWorkspace,
  buildToolResultsPrompt,
  buildUserPrompt,
  extractToolCalls,
  executeToolCalls,
} from "../helpers";
import { CopilotAPI, LoggerService, ReadOnlyFileSystem } from "../services";
import type { AgentConfig, AgentResult, CLIOptions } from "../interfaces";

export class StandaloneAgent {
  private readonly logger = LoggerService.getInstance();
  private readonly fileSystem: ReadOnlyFileSystem;
  private readonly toolRegistry: ToolRegistry = new ToolRegistry();
  private readonly config: AgentConfig;
  private copilotAPI: CopilotAPI | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
    this.fileSystem = new ReadOnlyFileSystem(config.workspacePath);
  }

  async initialize(): Promise<void> {
    this.logger.info(`🤖 Initializing Agent...`);
    this.logger.info(`📁 Workspace: ${this.config.workspacePath}`);
    this.copilotAPI = await CopilotAPI.createWithGitHubToken(this.config);
    this.toolRegistry.initializeReadOnlyTools(this.fileSystem);
    await validateWorkspace(this.fileSystem, this.config.workspacePath);

    // Output tools info
    const toolNames = this.toolRegistry
      .getAll()
      .map((tool) => tool.name)
      .join(", ");
    this.logger.info(
      `🔧 Initialized ${this.toolRegistry.size()} tools: ${toolNames}`,
    );
  }

  async getPrompt(
    optionPrompt: string | undefined,
    fileName: string,
    fallback: string,
  ): Promise<string> {
    if (optionPrompt && optionPrompt.trim()) {
      return optionPrompt;
    }
    return await this.fileSystem.readFileOrFallback(
      path.join(process.cwd(), "prompt", fileName),
      fallback,
    );
  }

  async analyzeWorkspace(options: CLIOptions): Promise<AgentResult> {
    try {
      const systemPrompt = await this.getPrompt(
        options.systemPrompt,
        "system.txt",
        "You are an ascii cats generator",
      );

      const userPrompt = await this.getPrompt(
        options.prompt,
        "prompt.txt",
        "Write a cat in ascii art",
      );

      const analysisContext = {
        startTime: Date.now(),
        toolCalls: [],
        iterations: 0,
        analysisData: "",
      };

      const result = await this.runAnalysisLoop(
        systemPrompt,
        userPrompt,
        analysisContext,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Analysis failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        success: false,
        response: "",
        error: error instanceof Error ? error.message : String(error),
      } as AgentResult;
    }
  }

  private async runAnalysisLoop(
    systemPrompt: string,
    userPrompt: string,
    context: any,
  ): Promise<AgentResult> {
    let currentResponse = await this.callCopilotAPI(
      await buildUserPrompt(this.config, this.fileSystem, userPrompt),
      systemPrompt,
    );

    while (context.iterations < this.config.maxIterations) {
      context.iterations++;
      this.logger.info(
        `📋 Iteration ${context.iterations}/${this.config.maxIterations}`,
      );

      const extractedToolCalls = extractToolCalls(currentResponse);
      if (extractedToolCalls.length === 0) {
        context.analysisData += currentResponse;
      }

      if (extractedToolCalls.some((tc) => tc.name === "finish_analyze")) {
        this.logger.info(
          `✅ 'finish_analyze' tool called. Stopping analysis loop.`,
        );
        break;
      }

      await executeToolCalls(
        extractedToolCalls,
        this.toolRegistry,
        context.toolCalls,
      );

      currentResponse = await this.callCopilotAPI(
        await buildToolResultsPrompt(extractedToolCalls),
        systemPrompt,
      );
    }

    return {
      success: true,
      response: currentResponse,
      analysisData: JSON.stringify(context.analysisData),
      iterations: context.iterations,
    };
  }

  private async callCopilotAPI(
    prompt: string,
    systemPrompt: string,
  ): Promise<string> {
    if (!this.copilotAPI) throw new Error("Copilot API is not initialized.");
    const response = await this.copilotAPI.callAPI(prompt, systemPrompt);
    return response;
  }
}

export type {
  AgentConfig,
  AgentResult,
  ToolCall,
  CLIOptions,
} from "../interfaces";
