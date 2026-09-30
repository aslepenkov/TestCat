/**
 * Agent Core Interfaces
 *
 * Defines contracts for agent configuration and results
 */

export interface ITool {
  name: string;
  description: string;
  parameters: any;
  execute(args: any): Promise<any>;
}

export interface IFileSystem {
  isFile(filePath: string): Promise<boolean>;
  readFile(filePath: string): Promise<string>;
  listDirectory(dirPath: string): Promise<string[]>;
  exists(filePath: string): Promise<boolean>;
  getWorkspaceStructure(maxSize?: number, maxDepth?: number): Promise<string>;
}

export interface AgentConfig {
  copilotApiKey?: string;
  debugMode: boolean;
  githubToken: string;
  maxIterations: number;
  maxTokens?: number;
  model?: string;
  temperature?: number;
  workspacePath: string;
}

export interface AgentResult {
  success: boolean;
  response: string;
  analysisData: any;
  iterations: number;
  error?: string;
}

export interface ToolCall {
  name: string;
  arguments: any;
  result: any;
  timestamp: Date;
}

export interface CLIOptions {
  workspace?: string;
  debug?: boolean;
  maxIterations?: number;
  token?: string;
  systemPrompt?: string;
  prompt?: string;
}
