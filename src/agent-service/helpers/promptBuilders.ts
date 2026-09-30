import type { AgentConfig, IFileSystem } from "../interfaces";
import { ToolRegistry } from "../tools";

export async function buildUserPrompt(
  config: AgentConfig,
  fileSystem: IFileSystem,
  request: string,
): Promise<string> {
  const template = `REQUEST: {{request}}
AVAILABLE TOOLS:
{{toolDescriptions}}
WORKING DIRECTORY: {{workspacePath}}
WORKSPACE STRUCTURE: {{workspaceStructure}}`;

  const workspaceStructure = await fileSystem.getWorkspaceStructure(2000, 1);

  const toolRegistry = new ToolRegistry();
  toolRegistry.initializeReadOnlyTools(fileSystem); //TODO SINGLETONE INJECTABLE
  const toolDescriptions = toolRegistry
    .getAll()
    .map(
      (tool: {
        name: string;
        description: string;
        parameters?: Record<string, any>;
      }) => {
        let paramsStr = "Parameters: None";
        if (tool.parameters) {
          const { type, properties, required } = tool.parameters;
          const propsStr = properties
            ? Object.entries(properties)
                .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
                .join(", ")
            : "";
          paramsStr = `Parameters: type: ${type || "unknown"}${propsStr ? ", properties: " + propsStr : ""}${required ? ", required: " + required : ""}`;
        }
        return `${tool.name}: ${tool.description}\n${paramsStr}`;
      },
    )
    .join("\n");

  return template
    .replace("{{workspacePath}}", config.workspacePath)
    .replace("{{workspaceStructure}}", workspaceStructure)
    .replace("{{toolDescriptions}}", toolDescriptions)
    .replace("{{request}}", request);
}

export async function buildToolResultsPrompt(
  toolCalls: any[],
): Promise<string> {
  //TODO delete this as prompt affect
  const analysisInstruction = `Continue your analysis based on these results.
If you have enough information, provide a comprehensive summary of your findings.`;

  const results = toolCalls
    .map(
      (call) =>
        `Tool: ${call.name}\nArguments: ${JSON.stringify(
          call.arguments,
        )}\nResult: ${JSON.stringify(call.result)}`,
    )
    .join("\n\n");

  if (!results.trim()) {
    return analysisInstruction;
  }

  return `Tool execution results:
${results}
${analysisInstruction}`;
}
