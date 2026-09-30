/**
 * Copilot Integration
 *
 * GitHub Copilot API integration for general code analysis
 */

import {
  CAPIClient,
  RequestType,
  type IExtensionInformation,
} from "@vscode/copilot-api";
import { randomUUID } from "crypto";
import { AgentConfig } from "../interfaces.js";
import { LoggerService } from "./../services/logger-service";

export class CopilotAPI {
  private readonly logger = LoggerService.getInstance();

  private client: CAPIClient | null = null;
  private hasCopilotAPI = false;
  private copilotToken: { token: string } | null = null;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private maxHistoryLength = 1500;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  static async createWithGitHubToken(config: AgentConfig): Promise<CopilotAPI> {
    const instance = new CopilotAPI(config);
    await instance.initializeWithGitHubToken(config.githubToken);
    return instance;
  }

  async resetClient(githubToken?: string): Promise<void> {
    this.clearContext();
    this.client = null;
    this.hasCopilotAPI = false;
    this.copilotToken = null;
    if (githubToken) {
      await this.initializeWithGitHubToken(githubToken);
    }
    if (this.config.debugMode) {
      this.logger.info("🤖 Client completely reset");
    }
  }

  clearContext(): void {
    this.conversationHistory = [];
    if (this.config.debugMode) {
      this.logger.info("🧹 Conversation context cleared");
    }
  }

  getContextLength(): number {
    return this.conversationHistory.length;
  }

  setMaxHistoryLength(maxLength: number): void {
    this.maxHistoryLength = maxLength;
    this.trimHistory();
  }

  async callAPI(
    prompt: string,
    systemPrompt: string,
    maintainContext: boolean = true,
  ): Promise<string> {
    if (!this.hasCopilotAPI || !this.client) {
      throw new Error(
        `Copilot API not available (hasCopilotAPI: ${this.hasCopilotAPI})`,
      );
    }
    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: systemPrompt },
        ...(maintainContext ? this.conversationHistory : []),
        { role: "user", content: prompt },
      ];
      const requestBody = {
        model: this.config.model ?? "gpt-4",
        messages,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 4000,
      };
      if (this.config.debugMode) {
        await this.logger.info("📤 Request body:");
        await this.logger.info(JSON.stringify(requestBody, null, 2));
      }
      const response = await this.client.makeRequest<Response>(
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.copilotToken?.token ?? ""}`,
            "X-GitHub-Api-Version": "2025-04-01",
          },
        },
        { type: RequestType.ChatCompletions },
      );
      if (this.config.debugMode) {
        await this.logger.info("📥 Response body:");
        await this.logger.info(JSON.stringify(response, null, 2));
      }
      const responseContent = await this.parseResponse(response);
      if (maintainContext) {
        this.conversationHistory.push({ role: "user", content: prompt });
        this.conversationHistory.push({
          role: "assistant",
          content: responseContent,
        });
        this.trimHistory();
      }
      return responseContent;
    } catch (error: any) {
      this.logger.error(`Copilot API error: ${error.message}`);
      throw error;
    }
  }

  private async initializeWithGitHubToken(githubToken: string): Promise<void> {
    const extensionInfo: IExtensionInformation = {
      name: "TestCatAI-code-analyzer",
      sessionId: `session-${Date.now()}`,
      machineId: randomUUID(),
      vscodeVersion: "1.80.0",
      version: "1.0.0",
      buildType: "dev",
    };
    this.client = new CAPIClient(extensionInfo, undefined);
    this.copilotToken = await this.fetchCopilotToken(githubToken);
    if (!this.copilotToken?.token) {
      throw new Error("Copilot token not received");
    }
    this.client = new CAPIClient(extensionInfo, this.copilotToken.token);
    this.hasCopilotAPI = true;
    if (this.config.debugMode) {
      this.logger.info("✅ CAPIClient initialized with Copilot token");
    }
  }

  private async fetchCopilotToken(
    githubToken: string,
  ): Promise<{ token: string }> {
    if (!this.client) throw new Error("CAPIClient not initialized");
    if (this.config.debugMode) {
      this.logger.info("🔑 Fetching Copilot token...");
    }
    const response = await this.client.makeRequest<Response>(
      {
        headers: {
          Authorization: `token ${githubToken}`,
          "X-GitHub-Api-Version": "2025-04-01",
        },
      },
      { type: RequestType.CopilotToken },
    );
    const text = await response.text();
    try {
      const tokenData = JSON.parse(text);
      if (!tokenData.token) throw new Error("No token in response");
      return tokenData;
    } catch (e) {
      this.logger.error("Failed to parse Copilot token response");
      throw new Error(`Invalid Copilot token response: ${e}`);
    }
  }

  private trimHistory(): void {
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(
        -this.maxHistoryLength,
      );
    }
  }

  private async parseResponse(response: Response | any): Promise<string> {
    // Handles both Response object and already-parsed JSON
    let parsed: any;
    if (response instanceof Response) {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      const responseText = await response.text();
      parsed = JSON.parse(responseText);
    } else {
      parsed = response;
    }
    if (parsed.choices?.length > 0 && parsed.choices[0].message?.content) {
      return parsed.choices[0].message.content;
    }
    if (typeof parsed.content === "string") {
      return parsed.content;
    }
    if (typeof parsed.text === "string") {
      return parsed.text;
    }
    throw new Error("No valid response content from Copilot API");
  }
}
