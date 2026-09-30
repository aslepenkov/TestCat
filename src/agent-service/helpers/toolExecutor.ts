import type { ToolRegistry } from "../tools";
import type { ToolCall } from "../interfaces";
import { LoggerService } from "./../services/logger-service";

export async function executeToolCalls(
  extractedToolCalls: ToolCall[],
  toolRegistry: ToolRegistry,
  allToolCalls: ToolCall[],
): Promise<void> {
  const logger = LoggerService.getInstance();

  for (const toolCall of extractedToolCalls) {
    logger.info(`🔧 Executing tool: ${toolCall.name}`);
    const tool = toolRegistry.get(toolCall.name);

    if (!tool) {
      logger.error(`Tool not found: ${toolCall.name}`);
      toolCall.result = { error: "Tool not found" };
      allToolCalls.push(toolCall);
      continue;
    }

    try {
      const result = await tool.execute(toolCall.arguments);
      toolCall.result = result;
      toolCall.timestamp = new Date();
      allToolCalls.push(toolCall);
    } catch (error) {
      logger.error(`Error executing tool ${toolCall.name}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toolCall.result = { error: errorMessage };
      toolCall.timestamp = new Date();
      allToolCalls.push(toolCall);
    }
  }
}
