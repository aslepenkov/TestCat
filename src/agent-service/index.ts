/**
 * CLI for General Code Analysis
 *
 * Simplified command line interface focused on the functionality:
 * - Copilot integration
 * - General code analysis (reads prompt from input/prompt.txt)
 * - Readonly operations only
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { Command } from "commander";
import { CLIOptions, StandaloneAgent } from "./agent";
import { LoggerService, AuthService } from "./services";

const logger = LoggerService.getInstance();
const auth = AuthService.getInstance();

// Load environment variables
dotenv.config();

export function parseArgs(): { command: string; options: CLIOptions } {
  const program = new Command();

  program
    .name("standalone-agent-cli")
    .description("Standalone Agent CLI tool for workspace analysis.")
    .argument("<command>", "The command to execute")
    .option("-w, --workspace <path>", "Path to the workspace directory")
    .option("-d, --debug", "Enable debug mode", false)
    .option("-m, --model <model>", "Model to use", "gpt-4.1")
    .option(
      "-i, --maxIterations <number>",
      "Maximum number of iterations",
      (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed < 1) {
          throw new Error("Max iterations must be a positive integer.");
        }
        return parsed;
      },
      10, // Default value
    )
    .option("-t, --token <token>", "GitHub token to use")
    .option("-s, --systemPrompt <prompt>", "System prompt to use")
    .option("-p, --prompt <prompt>", "Custom user input prompt")
    .action((command) => {
      logger.info(`Executing command: ${command}`);
      logger.info(
        `With options: ${JSON.stringify(program.opts<CLIOptions>(), null, 2)}`,
      );
    })
    .allowUnknownOption(false)
    .helpOption("-h, --help", "Show help information");

  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(1);
  }
  // Parse the arguments
  program.parse(process.argv);
  // Extract the parsed arguments
  const options = program.opts<CLIOptions>();
  const command = program.args[0]; // Extract the primary command

  // Check for missing command
  if (!command) {
    program.outputHelp();
    process.exit(1);
  }
  return { command, options };
}

async function runAnalysis(options: CLIOptions): Promise<void> {
  logger.info("🚀 Starting Code Analysis...\n");

  // Setup configuration
  const defaultWorkspace = process.env.DATA_DIR
    ? process.env.DATA_DIR
    : "./input";
  const workspacePath = path.resolve(options.workspace || defaultWorkspace);
  const analysisConfig = {
    debugMode: options.debug || false,
    maxIterations: options.maxIterations || 10,
    githubToken: (options.token || process.env.GITHUB_TOKEN) ?? "",
  };

  // Validate API access
  if (!options.token && !process.env.GITHUB_TOKEN) {
    logger.error("❌ GitHub token is required for Copilot API access");
    // Use DI for getToken
    analysisConfig.githubToken = await auth.getToken();
  }

  try {
    // Initialize the agent with updated config
    const agentConfig = { ...analysisConfig, workspacePath };
    const agent = new StandaloneAgent(agentConfig);
    await agent.initialize();

    logger.info("✅ Agent initialized successfully!\n");

    // Run the analysis
    const result = await agent.analyzeWorkspace(options);

    if (result.success) {
      logger.info(`✅ Success! Analysis completed`);
      logger.info(`🔄 Completed in ${result.iterations} iterations`);

      // Display analysis data
      if (result.analysisData) {
        //todo delete deprecated
        const summary = result.analysisData;

        if (summary) {
          logger.info(`📋 Summary: ${summary}`);
        }
      }

      logger.info("📝 Last Response:");
      logger.info(result.response);
    } else {
      logger.error(`❌ Analysis failed: ${result.error}`);
      process.exitCode = 1;
    }

    logger.info("📁 Logs saved to: ./logs/");
    logger.info("🔄️ Artifacts (if any) saved to: ./output/");
  } catch (error: any) {
    logger.error(`💥 Fatal error: ${error.message}`);
    process.exitCode = 1;
    if (options.debug) {
      logger.error(error.stack);
    }
  }
}

// Export for server use
export { runAnalysis };

// Main function for CLI execution
export async function main(): Promise<void> {
  const { command, options } = parseArgs();

  switch (command) {
    case "analyze":
      await runAnalysis(options);
      break;
    default:
      logger.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Run the CLI only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error(`💥 Unexpected error: ${error.message}`);
    process.exit(1);
  });
}
