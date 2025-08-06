#!/usr/bin/env node

/**
 * Main CLI entry point
 * GitHub App CLI - A modular command-line interface for GitHub App APIs
 * 
 * This is the main entry point that orchestrates all command modules
 * following the requirements for modular architecture, consistent error handling,
 * and proper separation of concerns.
 */

import { Command } from "commander";
import { config, validateConfig } from "./src/config/config.js";
import { setLogLevel, LOG_LEVELS, logError } from "./src/utils/logger.js";
import { displayError } from "./src/utils/display.js";

// Command handlers
import { handleRepositoriesCommand, validateRepositoryOptions } from "./src/commands/repos.js";
import { handleTeamsCommand, validateTeamOptions } from "./src/commands/teams.js";
import { handleWebhooksCommand, validateWebhookOptions } from "./src/commands/webhooks.js";
import { handleTokenCommand } from "./src/commands/token.js";
import { 
  handleHelpCommand, 
  handleReposHelpCommand, 
  handleTeamsHelpCommand, 
  handleWebhooksHelpCommand,
  handleTokenHelpCommand,
  showVersion,
  showQuickHelp 
} from "./src/commands/help.js";

/**
 * Main program setup and configuration
 */
const program = new Command();

// Configure main program
program
  .name(config.app.name)
  .description(config.app.description)
  .version(config.app.version)
  .option("-v, --verbose", "Enable verbose logging")
  .option("-q, --quiet", "Suppress non-error output")
  .hook('preAction', (thisCommand, actionCommand) => {
    // Set log level based on global options
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setLogLevel(LOG_LEVELS.DEBUG);
    } else if (opts.quiet) {
      setLogLevel(LOG_LEVELS.ERROR);
    }

    // Validate configuration before running any command
    if (!validateConfig()) {
      process.exit(1);
    }
  });

/**
 * Repositories command
 * Lists repositories accessible to the GitHub App installation
 */
program
  .command("repos")
  .description("List repositories accessible to the installation")
  .option("-v, --visibility <type>", "Filter by visibility (public, private, internal)")
  .option("-l, --language <lang>", "Filter by programming language")
  .option("--repo-csv <file>", "Get specific repositories from CSV file")
  .option("--detailed", "Show detailed information including description")
  .option("--fetch", "Save data to CSV file instead of displaying")
  .option("--permissions", "Include user permissions for each repository")
  .option("--since <date>", "Filter by last update date (ISO 8601)")
  .option("--min-stars <num>", "Minimum number of stars", parseInt)
  .option("--max-stars <num>", "Maximum number of stars", parseInt)
  .option("--sort <field>", "Sort by (name, stars, forks, updated, size)")
  .option("--order <order>", "Sort order (asc, desc)")
  .option("--stats", "Show repository statistics")
  .action(async (options) => {
    try {
      // Validate options
      const validation = validateRepositoryOptions(options);
      if (!validation.isValid) {
        validation.errors.forEach(error => logError(error));
        process.exit(1);
      }

      await handleRepositoriesCommand(options);
    } catch (error) {
      displayError("executing repos command", error);
      process.exit(1);
    }
  });

/**
 * Teams command
 * Lists teams in the specified organization
 */
program
  .command("teams")
  .argument("[org]", "Organization name (auto-detects if not provided)")
  .description("List teams in the organization (auto-detects org if GitHub App is installed at org level)")
  .option("-v, --visibility <type>", "Filter by visibility (open, closed, secret)")
  .option("--detailed", "Show detailed information including description")
  .option("--fetch", "Save data to CSV file instead of displaying")
  .option("--skip-members", "Skip fetching member and repository counts for better performance")
  .option("--min-members <num>", "Minimum number of members", parseInt)
  .option("--max-members <num>", "Maximum number of members", parseInt)
  .option("--sort <field>", "Sort by (name, members, repos)")
  .option("--order <order>", "Sort order (asc, desc)")
  .option("--stats", "Show team statistics")
  .action(async (org, options) => {
    try {
      // Validate options
      const validation = validateTeamOptions(options);
      if (!validation.isValid) {
        validation.errors.forEach(error => logError(error));
        process.exit(1);
      }

      await handleTeamsCommand(org, options);
    } catch (error) {
      displayError("executing teams command", error);
      process.exit(1);
    }
  });

/**
 * Webhooks command
 * Lists webhooks configured for repositories
 */
program
  .command("webhooks")
  .argument("[org]", "Organization name (auto-detects if not provided)")
  .description("List webhooks configured for repositories in the organization")
  .option("--repo <name>", "Check webhooks for specific repository only")
  .option("--fetch", "Save data to CSV file instead of displaying")
  .option("--detailed", "Show detailed webhook information")
  .option("--event <type>", "Filter by specific event type (push, pull_request, etc.)")
  .option("--active-only", "Show only active webhooks")
  .option("--show-all", "Show all repositories even those without webhooks")
  .option("--sort <field>", "Sort by (repo, webhooks, url, events, created)")
  .option("--order <order>", "Sort order (asc, desc)")
  .option("--stats", "Show webhook statistics")
  .action(async (org, options) => {
    try {
      // Validate options
      const validation = validateWebhookOptions(options);
      if (!validation.isValid) {
        validation.errors.forEach(error => logError(error));
        process.exit(1);
      }

      await handleWebhooksCommand(org, options);
    } catch (error) {
      displayError("executing webhooks command", error);
      process.exit(1);
    }
  });

/**
 * Token command
 * Shows current GitHub App token information and management
 */
program
  .command("token")
  .description("Show current GitHub App token and expiry information")
  .option("--refresh", "Force refresh the token")
  .option("--validate", "Validate token without showing details")
  .action(async (options) => {
    try {
      await handleTokenCommand(options);
    } catch (error) {
      displayError("executing token command", error);
      process.exit(1);
    }
  });

/**
 * Help commands
 * Provides comprehensive help information
 */
program
  .command("help")
  .description("Show help information")
  .action(() => {
    handleHelpCommand();
  });

program
  .command("help-repos")
  .description("Show detailed help for repos command")
  .action(() => {
    handleReposHelpCommand();
  });

program
  .command("help-teams")
  .description("Show detailed help for teams command")
  .action(() => {
    handleTeamsHelpCommand();
  });

program
  .command("help-webhooks")
  .description("Show detailed help for webhooks command")
  .action(() => {
    handleWebhooksHelpCommand();
  });

program
  .command("help-token")
  .description("Show detailed help for token command")
  .action(() => {
    handleTokenHelpCommand();
  });

/**
 * Legacy help command for backwards compatibility
 */
program
  .command("help-pagination")
  .description("Show command options and examples (legacy)")
  .action(() => {
    console.log("⚠️  This command is deprecated. Use 'ghapp help-repos' or 'ghapp help-teams' instead.");
    handleReposHelpCommand();
  });

/**
 * Error handling for unknown commands
 */
program.on('command:*', (operands) => {
  logError(`Unknown command: ${operands[0]}`);
  showQuickHelp();
  process.exit(1);
});

/**
 * Handle --version flag
 */
program.on('option:version', () => {
  showVersion();
  process.exit(0);
});

/**
 * Global error handler
 */
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise);
  logError('Reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Parse command line arguments and execute
 */
try {
  program.parse();
} catch (error) {
  displayError("parsing command line arguments", error);
  process.exit(1);
}
