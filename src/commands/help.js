/**
 * Help command module
 * Provides comprehensive help information for all commands
 */

import { displayHelp } from "../utils/display.js";
import { config } from "../config/config.js";

/**
 * Main help command handler
 * Shows general help information
 */
export function handleHelpCommand() {
  const helpData = {
    title: `${config.app.name} - ${config.app.description}`,
    description: `Version ${config.app.version}\n\nA command-line interface for interacting with GitHub App APIs.`,
    
    options: [
      { flags: 'repos', description: 'List all repositories accessible to the installation' },
      { flags: 'teams [org]', description: 'List all teams (auto-detects org if not specified)' },
      { flags: 'webhooks [org]', description: 'List webhooks configured for repositories' },
      { flags: 'token', description: 'Show token and expiry information' },
      { flags: 'help-repos', description: 'Show detailed help for repos command' },
      { flags: 'help-teams', description: 'Show detailed help for teams command' },
      { flags: 'help-webhooks', description: 'Show detailed help for webhooks command' },
      { flags: 'help-token', description: 'Show detailed help for token command' },
      { flags: '--version', description: 'Show version information' }
    ],
    
    examples: [
      { command: 'ghapp repos', description: 'List all repositories' },
      { command: 'ghapp repos --visibility private', description: 'List only private repositories' },
      { command: 'ghapp teams', description: 'List all teams (auto-detect org)' },
      { command: 'ghapp teams myorg', description: 'List teams in specific organization' },
      { command: 'ghapp webhooks', description: 'List webhooks for all repositories' },
      { command: 'ghapp webhooks --repo myrepo', description: 'Check webhooks for specific repository' },
      { command: 'ghapp token', description: 'Show current token status' }
    ],
    
    notes: [
      'Use --help with any command for detailed options',
      'All commands support --fetch to export data to CSV',
      'GitHub App credentials must be configured in .env file'
    ]
  };
  
  displayHelp('help', helpData);
}

/**
 * Repository command help handler
 * Shows detailed help for the repos command
 */
export function handleReposHelpCommand() {
  const helpData = {
    title: 'Repository Commands Help',
    description: 'List and manage repositories accessible to your GitHub App installation.',
    
    options: [
      { flags: '-v, --visibility <type>', description: 'Filter by visibility (public, private, internal)' },
      { flags: '-l, --language <lang>', description: 'Filter by programming language' },
      { flags: '--repo-csv <file>', description: 'Get specific repositories from CSV file' },
      { flags: '--detailed', description: 'Show detailed repository information' },
      { flags: '--fetch', description: 'Export to CSV file with detailed metrics instead of displaying' },
      { flags: '--user-permission', description: 'Fetch collaborators and their roles for each repository' },
      { flags: '--since <date>', description: 'Filter by last update date (ISO 8601)' },
      { flags: '--min-stars <num>', description: 'Minimum number of stars' },
      { flags: '--max-stars <num>', description: 'Maximum number of stars' },
      { flags: '--sort <field>', description: 'Sort by (name, stars, forks, updated, size)' },
      { flags: '--order <order>', description: 'Sort order (asc, desc)' },
      { flags: '--stats', description: 'Show repository statistics' }
    ],
    
    examples: [
      { command: 'ghapp repos', description: 'Get all repositories' },
      { command: 'ghapp repos --visibility private', description: 'Only private repositories' },
      { command: 'ghapp repos --language javascript', description: 'Only JavaScript repositories' },
      { command: 'ghapp repos --repo-csv myrepos.csv', description: 'Get specific repos from CSV' },
      { command: 'ghapp repos --detailed', description: 'Show detailed information' },
      { command: 'ghapp repos --user-permission', description: 'Get collaborators and their roles' },
      { command: 'ghapp repos --user-permission --fetch', description: 'Export collaborators to CSV' },
      { command: 'ghapp repos --fetch', description: 'Save to CSV file with detailed metrics' },
      { command: 'ghapp repos --min-stars 10', description: 'Repositories with 10+ stars' },
      { command: 'ghapp repos --sort stars --order desc', description: 'Sort by stars (most first)' },
      { command: 'ghapp repos --since 2024-01-01', description: 'Updated since Jan 1, 2024' }
    ],
    
    notes: [
      'CSV input format: repository names, one per line',
      'Output CSV includes: org name, repo name, empty status, dates, counts for issues/PRs/releases, etc.',
      'Files are saved with timestamp: repositories_YYYY-MM-DDTHH-mm-ss-SSSZ.csv',
      'Use --detailed for description, URLs, and additional metrics in console output',
      'Use --fetch for comprehensive repository analytics CSV export',
      'Use --user-permission to get collaborator roles (admin, maintain, push, triage, pull)',
      '--user-permission and --fetch may take longer as they require additional API calls per repository'
    ]
  };
  
  displayHelp('repos', helpData);
}

/**
 * Teams command help handler
 * Shows detailed help for the teams command
 */
export function handleTeamsHelpCommand() {
  const helpData = {
    title: 'Teams Commands Help',
    description: 'List and manage teams in GitHub organizations.',
    
    options: [
      { flags: '[org]', description: 'Organization name (auto-detects if not provided)' },
      { flags: '-v, --visibility <type>', description: 'Filter by visibility (open, closed, secret)' },
      { flags: '--detailed', description: 'Show detailed team information' },
      { flags: '--fetch', description: 'Export to CSV file instead of displaying' },
      { flags: '--skip-members', description: 'Skip fetching member/repo counts (faster)' },
      { flags: '--min-members <num>', description: 'Minimum number of members' },
      { flags: '--max-members <num>', description: 'Maximum number of members' },
      { flags: '--sort <field>', description: 'Sort by (name, members, repos)' },
      { flags: '--order <order>', description: 'Sort order (asc, desc)' },
      { flags: '--stats', description: 'Show team statistics' }
    ],
    
    examples: [
      { command: 'ghapp teams', description: 'All teams (auto-detect org)' },
      { command: 'ghapp teams myorg', description: 'All teams in specific organization' },
      { command: 'ghapp teams --visibility secret', description: 'Only secret teams' },
      { command: 'ghapp teams --detailed', description: 'Show detailed team information' },
      { command: 'ghapp teams --fetch', description: 'Export to CSV file' },
      { command: 'ghapp teams --skip-members', description: 'Skip member counts (faster)' },
      { command: 'ghapp teams --min-members 5', description: 'Teams with 5+ members' },
      { command: 'ghapp teams --sort members --order desc', description: 'Sort by member count' }
    ],
    
    notes: [
      'Organization is auto-detected from GitHub App installation if not specified',
      'Member and repository counts require additional API calls (slower)',
      'Use --skip-members for faster results when counts are not needed',
      'Output CSV includes: name, privacy, members count, repositories count, etc.',
      'Some teams may show "No access" for counts due to permissions'
    ]
  };
  
  displayHelp('teams', helpData);
}

/**
 * Token command help handler
 * Shows detailed help for the token command
 */
export function handleTokenHelpCommand() {
  const helpData = {
    title: 'Token Commands Help',
    description: 'Manage and inspect GitHub App authentication tokens.',
    
    options: [
      { flags: '--refresh', description: 'Force refresh the token' },
      { flags: '--validate', description: 'Validate token without showing details' }
    ],
    
    examples: [
      { command: 'ghapp token', description: 'Show current token status and expiry' },
      { command: 'ghapp token --validate', description: 'Check if token is valid' },
      { command: 'ghapp token --refresh', description: 'Force refresh the token' }
    ],
    
    notes: [
      'Tokens are automatically refreshed when expired',
      'Token expiry is shown in both UTC and IST time zones',
      'Tokens are valid for 1 hour from GitHub App',
      'A 5-minute buffer is used for refresh timing'
    ]
  };
  
  displayHelp('token', helpData);
}

/**
 * Webhooks command help handler
 * Shows detailed help for the webhooks command
 */
export function handleWebhooksHelpCommand() {
  const helpData = {
    title: 'Webhooks Command Help',
    description: 'List and analyze webhooks configured for repositories in your GitHub organization.',
    
    usage: [
      'ghapp webhooks [org] [options]',
      'ghapp webhooks --repo <repository-name> [options]',
      'ghapp webhooks myorg --fetch',
      'ghapp webhooks --event push --active-only'
    ],
    
    arguments: [
      { name: 'org', description: 'Organization name (auto-detects if not provided)' }
    ],
    
    options: [
      { flags: '--repo <name>', description: 'Check webhooks for specific repository only' },
      { flags: '--fetch', description: 'Save webhook data to CSV file instead of displaying' },
      { flags: '--detailed', description: 'Show detailed webhook information including config' },
      { flags: '--event <type>', description: 'Filter by specific event type (push, pull_request, etc.)' },
      { flags: '--active-only', description: 'Show only active webhooks' },
      { flags: '--show-all', description: 'Show all repositories even those without webhooks' },
      { flags: '--sort <field>', description: 'Sort by: repo, webhooks, url, events, created' },
      { flags: '--order <order>', description: 'Sort order: asc, desc (default: asc)' },
      { flags: '--stats', description: 'Show webhook statistics summary' },
      { flags: '-v, --verbose', description: 'Enable verbose logging' },
      { flags: '-q, --quiet', description: 'Suppress non-error output' },
      { flags: '-h, --help', description: 'Show this help message' }
    ],
    
    examples: [
      { command: 'ghapp webhooks', description: 'List webhooks for all repositories (auto-detect org)' },
      { command: 'ghapp webhooks myorg', description: 'List webhooks for all repositories in myorg' },
      { command: 'ghapp webhooks --repo myrepo', description: 'Check webhooks for specific repository' },
      { command: 'ghapp webhooks --fetch', description: 'Export webhook data to CSV file' },
      { command: 'ghapp webhooks --event push', description: 'Show repositories with push event webhooks' },
      { command: 'ghapp webhooks --active-only --detailed', description: 'Show detailed info for active webhooks only' },
      { command: 'ghapp webhooks --sort webhooks --order desc', description: 'Sort by webhook count (highest first)' },
      { command: 'ghapp webhooks --stats', description: 'Show webhook statistics' }
    ],
    
    notes: [
      'Organization is auto-detected if your GitHub App is installed at organization level',
      'CSV export includes webhook configuration details and last response status',
      'Use --detailed to see webhook configuration including secret status',
      'Common webhook events: push, pull_request, issues, release, create, delete',
      'Requires appropriate GitHub App permissions to access repository webhooks'
    ]
  };
  
  displayHelp('webhooks', helpData);
}

/**
 * Shows version information
 */
export function showVersion() {
  console.log(`${config.app.name} version ${config.app.version}`);
  console.log(`${config.app.description}`);
}

/**
 * Shows quick usage information
 */
export function showQuickHelp() {
  console.log(`Usage: ${config.app.name} <command> [options]`);
  console.log('');
  console.log('Commands:');
  console.log('  repos                   List repositories');
  console.log('  teams [org]             List teams');
  console.log('  webhooks [org]          List webhooks');
  console.log('  token                   Show token info');
  console.log('  help                    Show this help');
  console.log('');
  console.log(`Run '${config.app.name} help' for more information.`);
}

/**
 * Gets help data for a specific command
 * @param {string} command - Command name
 * @returns {Object|null} Help data or null if command not found
 */
export function getCommandHelp(command) {
  const helpMap = {
    'repos': handleReposHelpCommand,
    'teams': handleTeamsHelpCommand,
    'webhooks': handleWebhooksHelpCommand,
    'token': handleTokenHelpCommand,
    'help': handleHelpCommand
  };
  
  return helpMap[command] || null;
}
