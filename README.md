# GitHub App CLI

A modular, feature-rich command-line interface for interacting with GitHub App APIs. This CLI provides comprehensive functionality for managing repositories, teams, webhooks, and authentication through GitHub App installation.

## Features

- **Modular Architecture**: Clean separation of concerns with dedicated modules for each command
- **Repository Management**: List, filter, sort, and export repository data with advanced filtering
- **Collaborator Management**: Fetch repository collaborators with their permission levels
- **Team Management**: Manage organization teams with hierarchy, member roles, and repository permissions
- **Webhook Management**: Discover, analyze, and export repository webhook configurations
- **Secrets Management**: Fetch and export GitHub Actions secrets metadata from organization and repositories
- **Variables Management**: Fetch and export GitHub Actions variables from organization and repositories
- **Token Management**: Handle GitHub App authentication with automatic token refresh
- **CSV Export/Import**: Export data to CSV files with organized folder structure and import repository lists from CSV
- **Comprehensive Filtering**: Advanced filtering options for repositories, teams, and webhooks
- **Statistics & Analytics**: Built-in statistics for all data types with sorting capabilities
- **Error Handling**: Robust error handling with user-friendly messages
- **Logging**: Consistent logging strategy with configurable levels
- **Testing**: Full unit test coverage for all modules
- **Performance Optimized**: Efficient pagination and optional data fetching

## Installation

> 📋 **Detailed Installation Guide**: See [INSTALL.md](./INSTALL.md) for comprehensive installation instructions, troubleshooting, and platform-specific setup.

### Quick Setup

**For Source Installation:**
```bash
git clone https://github.com/niranjanakoni/ghapp-cli.git
cd ghapp-cli
npm install
npm link
```

**For Binary Distribution:**
```bash
# Download binary from GitHub releases
# Place .env and private-key.pem in same directory as binary
# Run: ./ghapp --help (Linux/macOS) or ghapp.exe --help (Windows)
```

**Configuration (both methods):**
```env
# Create .env file with:
GITHUB_APP_ID=your_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
```

**Verification:**
```bash
ghapp token --validate
ghapp repos --help
```

## Usage

### Basic Commands

```bash
# Show help
ghapp help

# List all repositories
ghapp repos

# Export repository collaborators to CSV
ghapp repos --user-permission --fetch

# List teams (auto-detect organization)
ghapp teams

# List webhooks (auto-detect organization)
ghapp webhooks

# Display GitHub Actions secrets metadata
ghapp secrets

# Export secrets metadata to CSV
ghapp secrets --fetch

# Display GitHub Actions variables
ghapp variables

# Export variables to CSV
ghapp variables --fetch

# Show token information
ghapp token
```

### Repository Commands

```bash
# Filter repositories by visibility
ghapp repos --visibility private

# Filter by programming language
ghapp repos --language javascript

# Show detailed information
ghapp repos --detailed

# Fetch collaborators and their roles for each repository
ghapp repos --user-permission --fetch

# Export collaborators to CSV with clean data (only repos with collaborators)
ghapp repos --user-permission --fetch

# Export repository metrics to CSV
ghapp repos --fetch

# Filter by specific repositories from CSV
ghapp repos --repo-csv my-repos.csv

# Advanced filtering with statistics
ghapp repos --min-stars 10 --language python --sort stars --order desc --stats

# Filter by update date
ghapp repos --since 2024-01-01
```

### Team Commands

```bash
# List teams in specific organization
ghapp teams myorg

# Filter by team privacy
ghapp teams --visibility secret

# Show detailed team information with hierarchy
ghapp teams --detailed

# Export teams to CSV with member roles and permissions
ghapp teams --fetch

# Skip member counts for faster results
ghapp teams --skip-members

# Filter by team size
ghapp teams --min-members 5 --max-members 20

# Sort teams by member count with statistics
ghapp teams --sort members --order desc --stats
```

### Webhook Commands

```bash
# List all webhooks for organization repositories (shows only repos with webhooks)
ghapp webhooks

# List webhooks in specific organization
ghapp webhooks myorg

# Show all repositories including those without webhooks
ghapp webhooks --show-all

# Check webhooks for specific repository
ghapp webhooks --repo myrepo

# Show detailed webhook configuration
ghapp webhooks --detailed

# Export webhooks to CSV
ghapp webhooks --fetch

# Filter by event type
ghapp webhooks --event push

# Show only active webhooks
ghapp webhooks --active-only

# Sort by webhook count with statistics
ghapp webhooks --sort webhooks --order desc --stats
```

**Note**: By default, the webhooks command only displays repositories that have webhooks configured. This provides a cleaner, more focused view of your webhook infrastructure. Use `--show-all` to display all repositories including those without webhooks.

### Secrets Commands

```bash
# Display organization and repository secrets metadata
ghapp secrets

# Export secrets metadata to CSV file
ghapp secrets --fetch

# Display only organization secrets
ghapp secrets --scope org

# Display only repository secrets
ghapp secrets --scope repo

# Filter organization secrets by visibility
ghapp secrets --visibility private

# Export with custom output file
ghapp secrets --fetch --output ./my-secrets.csv

# Display with verbose output
ghapp secrets --verbose
```

**Note**: Secrets command fetches GitHub Actions secrets metadata from both organization and repository levels. Secret values are never exposed - only metadata with placeholder values for security. The CSV export includes scope, repository, name, visibility, and timestamps.

### Variables Commands

```bash
# Display organization and repository variables
ghapp variables

# Export variables to CSV file
ghapp variables --fetch

# Display only organization variables
ghapp variables --scope org

# Display only repository variables
ghapp variables --scope repo

# Filter organization variables by visibility
ghapp variables --visibility private

# Export with custom output file
ghapp variables --fetch --output ./my-variables.csv

# Display with verbose output
ghapp variables --verbose

# Export with quiet mode (minimal output)
ghapp variables --fetch --quiet

# Export with verbose logging
ghapp variables --fetch --verbose
```

**Note**: Variables command fetches GitHub Actions variables from both organization and repository levels, displaying their actual values (unlike secrets which are encrypted). The CSV export includes visibility settings, selected repositories for organization variables, and timestamps.

### Token Commands

```bash
# Show current token status
ghapp token

# Validate token without showing details
ghapp token --validate

# Force refresh token
ghapp token --refresh
```

### Help Commands

```bash
# General help
ghapp help

# Detailed help for specific commands
ghapp help-repos
ghapp help-teams
ghapp help-webhooks
ghapp help-secrets
ghapp help-variables
ghapp help-token
```

## Command Options

### Repository Options

| Option | Description | Example |
|--------|-------------|---------|
| `-v, --visibility <type>` | Filter by visibility (public, private, internal) | `--visibility private` |
| `-l, --language <lang>` | Filter by programming language | `--language javascript` |
| `--repo-csv <file>` | Get specific repositories from CSV file | `--repo-csv repos.csv` |
| `--detailed` | Show detailed information including description | `--detailed` |
| `--fetch` | Save comprehensive data to CSV file with detailed metrics | `--fetch` |
| `--user-permission` | Fetch collaborators and their roles for each repository | `--user-permission --fetch` |
| `--since <date>` | Filter by last update date (ISO 8601) | `--since 2024-01-01` |
| `--min-stars <num>` | Minimum number of stars | `--min-stars 10` |
| `--max-stars <num>` | Maximum number of stars | `--max-stars 1000` |
| `--sort <field>` | Sort by (name, stars, forks, updated, size) | `--sort stars` |
| `--order <order>` | Sort order (asc, desc) | `--order desc` |
| `--stats` | Show repository statistics | `--stats` |

### Team Options

| Option | Description | Example |
|--------|-------------|---------|
| `-v, --visibility <type>` | Filter by visibility (open, closed, secret) | `--visibility secret` |
| `--detailed` | Show detailed information including description | `--detailed` |
| `--fetch` | Save data to CSV file instead of displaying | `--fetch` |
| `--skip-members` | Skip fetching member counts for better performance | `--skip-members` |
| `--min-members <num>` | Minimum number of members | `--min-members 5` |
| `--max-members <num>` | Maximum number of members | `--max-members 20` |
| `--sort <field>` | Sort by (name, members, repos) | `--sort members` |
| `--order <order>` | Sort order (asc, desc) | `--order desc` |
| `--stats` | Show team statistics | `--stats` |

### Webhook Options

| Option | Description | Example |
|--------|-------------|---------|
| `--repo <name>` | Check webhooks for specific repository only | `--repo myrepo` |
| `--fetch` | Save data to CSV file instead of displaying | `--fetch` |
| `--detailed` | Show detailed webhook information | `--detailed` |
| `--event <type>` | Filter by specific event type | `--event push` |
| `--active-only` | Show only active webhooks | `--active-only` |
| `--show-all` | Show all repositories even those without webhooks | `--show-all` |
| `--sort <field>` | Sort by (repo, webhooks, url, events, created) | `--sort webhooks` |
| `--order <order>` | Sort order (asc, desc) | `--order desc` |
| `--stats` | Show webhook statistics | `--stats` |

### Secrets Options

| Option | Description | Example |
|--------|-------------|---------|
| `--scope <type>` | Scope of secrets to fetch (org, repo, both) | `--scope org` |
| `--visibility <type>` | Filter org secrets by visibility (all, private, selected) | `--visibility private` |
| `--fetch` | Export secrets metadata to CSV file instead of displaying | `--fetch` |
| `--output <file>` | Custom output file path for CSV export | `--output ./my-secrets.csv` |
| `--verbose` | Enable verbose logging for detailed output | `--verbose` |
| `--quiet` | Suppress non-error output | `--quiet` |

### Variables Options

| Option | Description | Example |
|--------|-------------|---------|
| `--scope <type>` | Scope of variables to fetch (org, repo, both) | `--scope org` |
| `--visibility <type>` | Filter org variables by visibility (all, private, selected) | `--visibility private` |
| `--fetch` | Export variables to CSV file instead of displaying | `--fetch` |
| `--output <file>` | Custom output file path for CSV export | `--output ./my-variables.csv` |
| `--verbose` | Enable verbose logging for detailed output | `--verbose` |
| `--quiet` | Suppress non-error output | `--quiet` |

### Token Options

| Option | Description | Example |
|--------|-------------|---------|
| `--refresh` | Force refresh the token | `--refresh` |
| `--validate` | Validate token without showing details | `--validate` |
| `--detailed` | Show detailed information | `--detailed` |

### Global Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Enable verbose logging |
| `-q, --quiet` | Suppress non-error output |
| `--version` | Show version information |

## CSV File Formats

### Repository CSV Input
```csv
repo-name-1
org/repo-name-2
another-repo
```

### Repository Collaborators CSV Output
When using `--user-permission --fetch`, generates a clean CSV with only repositories that have direct collaborators:

```csv
Source_Organization,Source_Repository,Username,Role
Demo-workshop-org,action-example,vaishnavn02,admin
Demo-workshop-org,action-example,akshay-canarys,write
Demo-workshop-org,HelloWebApp,niranjanakoni,admin
Demo-workshop-org,codeowners-test,ramesh2051,write
```

#### Collaborators CSV Column Descriptions

| Column | Description |
|--------|-------------|
| `Source_Organization` | Organization that owns the repository |
| `Source_Repository` | Repository name |
| `Username` | GitHub username of the collaborator |
| `Role` | Permission level (admin, write, read, maintain, triage) |

**Key Features:**
- **Direct Collaborators Only**: Shows users explicitly added to repositories (not inherited organization permissions)
- **Clean Data**: Excludes repositories with no direct collaborators
- **Accurate Permissions**: Shows actual GitHub API permission levels
- **Migration Ready**: Perfect for repository access analysis and planning

### Repository CSV Output
```csv
Org_Name,Repo_Name,Is_Empty,Last_Push,Last_Update,isFork,isArchive,Visibility,Repo_Size(mb),Default_Branch,Issue_Count,Open_Issues,Closed_Issues,PR_Count,Open_PRs,Closed_PRs,PR_Review_Comment_Count,Commit_Comment_Count,Issue_Comment_Count,Release_Count,Project_Count,Branch_Count,Tag_Count,Has_Wiki,Full_URL,Created
myorg,my-repo,false,2025-01-05T10:30:00Z,2025-01-05T11:00:00Z,false,false,private,2.5,main,25,5,20,15,3,12,45,8,120,3,2,8,12,true,https://github.com/myorg/my-repo,2024-06-15T09:20:00Z
```

#### Repository CSV Column Descriptions

| Column | Description |
|--------|-------------|
| `Org_Name` | Organization or user name that owns the repository |
| `Repo_Name` | Repository name |
| `Is_Empty` | Whether the repository is empty (true/false) |
| `Last_Push` | Timestamp of the last push to the repository |
| `Last_Update` | Timestamp when the repository was last updated |
| `isFork` | Whether this is a forked repository (true/false) |
| `isArchive` | Whether the repository is archived (true/false) |
| `Visibility` | Repository visibility (public, private, internal) |
| `Repo_Size(mb)` | Repository size in megabytes |
| `Default_Branch` | Name of the default branch (e.g., main, master) |
| `Issue_Count` | Total number of issues (open + closed) |
| `Open_Issues` | Number of currently open issues |
| `Closed_Issues` | Number of closed issues |
| `PR_Count` | Total number of pull requests (open + closed) |
| `Open_PRs` | Number of currently open pull requests |
| `Closed_PRs` | Number of closed/merged pull requests |
| `PR_Review_Comment_Count` | Total number of pull request review comments |
| `Commit_Comment_Count` | Total number of commit comments |
| `Issue_Comment_Count` | Total number of issue comments |
| `Release_Count` | Number of releases published |
| `Project_Count` | Number of GitHub projects in the repository |
| `Branch_Count` | Total number of branches |
| `Tag_Count` | Total number of tags |
| `Has_Wiki` | Whether the repository has a wiki enabled (true/false) |
| `Full_URL` | Complete GitHub URL to the repository |
| `Created` | Timestamp when the repository was created |

### Team CSV Output
```csv
Name,Slug,Privacy,Description,Members Count,Repositories Count,HTML URL
Development Team,dev-team,closed,Main development team,8,12,https://github.com/orgs/myorg/teams/dev-team
```

### Webhook CSV Output
```csv
Org_Name,Repo_Name,Webhook_ID,Name,Active,URL,Content_Type,Secret,SSL_Verification,Events,Created,Updated,Last_Response_Code,Last_Response_Message
Demo-workshop-org,action-example,12345678,web,true,https://webhook.example.com/payload,application/json,true,true,"push,pull_request",2024-06-15T09:20:00Z,2025-01-05T11:00:00Z,200,OK
```

#### Webhook CSV Column Descriptions

| Column | Description |
|--------|-------------|
| `Org_Name` | Organization that owns the repository |
| `Repo_Name` | Repository name containing the webhook |
| `Webhook_ID` | Unique webhook identifier |
| `Name` | Webhook name (usually 'web') |
| `Active` | Whether the webhook is active (true/false) |
| `URL` | Target URL for webhook delivery |
| `Content_Type` | Content type for webhook payload |
| `Secret` | Whether webhook has a secret configured (true/false) |
| `SSL_Verification` | Whether SSL verification is enabled (true/false) |
| `Events` | Comma-separated list of events that trigger the webhook |
| `Created` | Timestamp when webhook was created |
| `Updated` | Timestamp when webhook was last updated |
| `Last_Response_Code` | HTTP status code from last delivery attempt |
| `Last_Response_Message` | Response message from last delivery attempt |

### Secrets CSV Output
```csv
scope,repository,name,value,visibility,selected_repositories,created_at,updated_at
organization,,API_TOKEN,[ENCRYPTED_SECRET_VALUE],all,,2024-06-15T09:20:00Z,2025-01-05T11:00:00Z
organization,,DB_PASSWORD,[ENCRYPTED_SECRET_VALUE],selected,"repo1,repo2",2024-06-15T09:20:00Z,2025-01-05T11:00:00Z
repository,my-repo,SECRET_KEY,[ENCRYPTED_SECRET_VALUE],,,2024-06-15T09:20:00Z,2025-01-05T11:00:00Z
```

#### Secrets CSV Column Descriptions

| Column | Description |
|--------|-------------|
| `scope` | Secret scope (organization or repository) |
| `repository` | Repository name (empty for organization secrets) |
| `name` | Secret name |
| `value` | Always `[ENCRYPTED_SECRET_VALUE]` for security |
| `visibility` | Organization secret visibility (all, private, selected) |
| `selected_repositories` | Comma-separated repository list for "selected" visibility |
| `created_at` | Timestamp when secret was created |
| `updated_at` | Timestamp when secret was last updated |

### Variables CSV Output
```csv
scope,repository,name,value,visibility,selected_repositories,created_at,updated_at
organization,,API_URL,https://api.example.com,all,,2024-06-15T09:20:00Z,2025-01-05T11:00:00Z
organization,,ENVIRONMENT,production,selected,"repo1,repo2",2024-06-15T09:20:00Z,2025-01-05T11:00:00Z
repository,my-repo,BUILD_CONFIG,release,,,2024-06-15T09:20:00Z,2025-01-05T11:00:00Z
```

#### Variables CSV Column Descriptions

| Column | Description |
|--------|-------------|
| `scope` | Variable scope (organization or repository) |
| `repository` | Repository name (empty for organization variables) |
| `name` | Variable name |
| `value` | Actual variable value (unlike secrets) |
| `visibility` | Organization variable visibility (all, private, selected) |
| `selected_repositories` | Comma-separated repository list for "selected" visibility |
| `created_at` | Timestamp when variable was created |
| `updated_at` | Timestamp when variable was last updated |

## Project Structure

```
ghapp-cli/
├── src/
│   ├── commands/          # Command modules
│   │   ├── repos.js       # Repository command handler
│   │   ├── teams.js       # Teams command handler
│   │   ├── webhooks.js    # Webhooks command handler
│   │   ├── secrets.js     # Secrets command handler
│   │   ├── variables.js   # Variables command handler
│   │   ├── token.js       # Token command handler
│   │   └── help.js        # Help command handler
│   ├── config/            # Configuration management
│   │   └── config.js      # Application configuration
│   └── utils/             # Utility modules
│       ├── logger.js      # Logging utilities
│       ├── github.js      # GitHub API utilities
│       ├── fileUtils.js   # File operation utilities
│       ├── filters.js     # Data filtering utilities
│       └── display.js     # Display formatting utilities
├── test/                  # Unit tests
│   ├── config.test.js     # Configuration tests
│   ├── logger.test.js     # Logger tests
│   ├── fileUtils.test.js  # File utilities tests
│   ├── filters.test.js    # Filters tests
│   ├── teams.test.js      # Teams command tests
│   └── webhooks.test.js   # Webhooks command tests
├── cli.js                 # Main CLI entry point
├── package.json           # Dependencies and scripts
├── .eslintrc.json         # ESLint configuration
└── README.md              # This file
```

## CSV Export Features

All commands support CSV export with `--fetch` option. All exports are automatically organized into date-based folders by data type for better file management.

### Repository Collaborators CSV Export
- Clean collaborator data with direct repository access only
- Organization, repository, username, and permission level
- Excludes inherited organization permissions for accurate analysis
- Perfect for repository access auditing and migration planning

### Repository CSV Export
- Organization and repository names with metadata
- Repository status (empty, fork, archived) and visibility
- Repository size in MB and default branch information
- Last push and update timestamps, creation date
- Comprehensive issue tracking (total, open, closed counts)
- Pull request analytics (total, open, closed counts)
- Comment activity (PR reviews, commits, issues)
- Project metrics (releases, projects, branches, tags)
- Repository features (wiki status) and direct GitHub URLs

### Team CSV Export
- Team name, slug, privacy level, description
- Parent team information (team hierarchy)
- Member count (direct members only)
- Repository count and permissions
- Member roles and repository access levels

### Webhook CSV Export
- Repository information
- Webhook ID, name, and active status
- Target URL and content type
- Secret configuration status and SSL settings
- Event types and creation/update timestamps
- Last response status and messages

### Secrets CSV Export
- Organization and repository secrets metadata (values never exposed)
- Secret scope (organization/repository), name, and placeholder values
- Visibility settings (all, private, selected) for organization secrets
- Selected repositories for organization secrets with "selected" visibility
- Creation and update timestamps
- Security-safe export with `[ENCRYPTED_SECRET_VALUE]` placeholders

### Variables CSV Export
- Organization and repository variables with actual values
- Variable scope (organization/repository), name, and value
- Visibility settings (all, private, selected)
- Selected repositories for organization variables with "selected" visibility
- Creation and update timestamps

### Organized Export Structure

All CSV exports are automatically organized into a clean directory structure:

```
ghapp-exports/
└── YYYY-MM-DD/              # Date-based folders
    ├── repositories/        # Repository data exports
    ├── collaborators/       # Collaborator data exports  
    ├── teams/              # Team data exports
    ├── webhooks/           # Webhook data exports
    ├── secrets/            # Secrets metadata exports
    └── variables/          # Variables data exports
```

**Benefits:**
- **Clean Organization**: No more CSV files cluttering your project directory
- **Date Separation**: Each day's exports go into separate folders
- **Type Separation**: Different data types are organized into dedicated subdirectories
- **Easy Management**: Simple to find, archive, or clean up old exports
- **Professional Structure**: Maintains a clean workspace while preserving all export data

**Example Export Paths:**
```
ghapp-exports/2025-08-07/repositories/repos_2025-08-07T10-30-15-123Z.csv
ghapp-exports/2025-08-07/collaborators/collabs_2025-08-07T10-31-22-456Z.csv
ghapp-exports/2025-08-07/teams/teams_2025-08-07T10-32-18-789Z.csv
ghapp-exports/2025-08-07/webhooks/webhooks_2025-08-07T10-33-05-012Z.csv
ghapp-exports/2025-08-07/secrets/secrets_2025-08-07T10-33-45-678Z.csv
ghapp-exports/2025-08-07/variables/variables_2025-08-07T10-34-12-345Z.csv
```

## Global Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Enable verbose logging for debugging |
| `-q, --quiet` | Suppress non-error output |
| `--help` | Show help for any command |

## Environment Variables

Create a `.env` file in the project root:

```env
# Required: GitHub App configuration
GITHUB_APP_ID=your_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_PRIVATE_KEY_PATH=path/to/private-key.pem

# Auto-generated: Token management (managed by CLI)
GITHUB_APP_TOKEN=auto_generated
GITHUB_APP_TOKEN_EXPIRES=auto_generated
```

## Permissions Required

Your GitHub App needs the following permissions:

- **Contents**: Read (for repository information)
- **Metadata**: Read (for basic repository data)
- **Members**: Read (for team membership information and collaborator access)
- **Administration**: Read (for webhook configuration access)

**Note**: The new collaborator management feature requires the **Members** permission to access repository collaborator information and permission levels.

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix
```

### Development Mode

```bash
# Run with file watching
npm run dev
```

### Validation

```bash
# Validate configuration
npm run validate
```

## Architecture Principles

This CLI follows modern software engineering principles:

1. **Modular Design**: Each command is in its own module with clear responsibilities
2. **Separation of Concerns**: Utilities are separated by function (logging, file operations, etc.)
3. **Consistent Error Handling**: Centralized error handling with user-friendly messages
4. **Comprehensive Testing**: Unit tests for all modules with good coverage
5. **Performance Optimization**: Efficient API calls with pagination and caching
6. **Extensibility**: Easy to add new commands and features
7. **Documentation**: Comprehensive inline documentation and help system

## Error Handling

The CLI implements robust error handling:

- **GitHub API Errors**: Specific handling for authentication, permissions, and rate limiting
- **File System Errors**: Graceful handling of file read/write operations
- **Network Errors**: Retry logic and timeout handling
- **Validation Errors**: Clear validation messages for user input
- **Configuration Errors**: Helpful guidance for setup issues

## Performance Features

- **Pagination**: Efficiently handles large datasets with automatic pagination
- **Parallel Processing**: Processes multiple API calls concurrently where possible
- **Caching**: Caches authentication tokens and reuses connections
- **Optional Data**: Skip expensive operations (like member counts) when not needed
- **Streaming**: Large CSV exports are streamed to disk

## Security Considerations

- **Token Management**: Secure handling of GitHub App tokens with automatic refresh
- **File Permissions**: Proper file permission handling for sensitive data
- **Input Validation**: Comprehensive validation of all user inputs
- **Error Messages**: Error messages don't expose sensitive information

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes following the existing code style
4. Add tests for new functionality
5. Run tests and linting: `npm test && npm run lint`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

## Requirements Compliance

This implementation addresses all requirements from `requirements.md`:

✅ **Modular Structure**: Each command has its own module  
✅ **Help Command**: Comprehensive help system  
✅ **Main CLI Integration**: All modules imported in main CLI file  
✅ **Command Handlers**: Each module has dedicated handler functions  
✅ **Unit Tests**: Complete test coverage for all modules  
✅ **Consistent Structure**: Uniform module structure and patterns  
✅ **Naming Conventions**: Consistent function and variable naming  
✅ **Error Handling**: Centralized error handling strategy  
✅ **Documentation**: Comprehensive documentation for all modules  
✅ **Logging Strategy**: Consistent logging with configurable levels  
✅ **Argument Parsing**: Consistent CLI argument handling  
✅ **Configuration**: Centralized configuration management  
✅ **Code Standards**: ESLint configuration and enforcement  
✅ **Async Operations**: Proper async/await handling throughout  
✅ **Performance**: Optimized for performance with pagination and caching  
✅ **Environment Variables**: Secure environment variable handling  
✅ **Node.js Compatibility**: Compatible with latest Node.js versions  
✅ **CLI Framework**: Uses Commander.js for consistent CLI experience  
✅ **Webhook Management**: Complete webhook discovery and analysis features

## License

MIT License - see LICENSE file for details.

## Quick Reference

### Most Common Commands

```bash
# Repository analysis and metrics
ghapp repos --fetch                           # Export all repository metrics
ghapp repos --user-permission --fetch         # Export repository collaborators
ghapp repos --visibility private --fetch      # Export private repositories only

# Organization team analysis  
ghapp teams --fetch                           # Export team structure and members

# Webhook analysis
ghapp webhooks --fetch                        # Export webhook configurations

# Secrets analysis
ghapp secrets                                 # Display GitHub Actions secrets metadata
ghapp secrets --fetch                         # Export secrets metadata to CSV

# Variables analysis
ghapp variables                               # Display GitHub Actions variables
ghapp variables --fetch                       # Export variables to CSV

# Token management
ghapp token                                   # Check token status
ghapp token --refresh                         # Force token refresh
```

### Data Export Formats

| Command | Output File | Contains |
|---------|-------------|----------|
| `ghapp repos --fetch` | `repositories_TIMESTAMP.csv` | 26 columns of repository metrics |
| `ghapp repos --user-permission --fetch` | `collaborators_TIMESTAMP.csv` | 4 columns of collaborator data |
| `ghapp teams --fetch` | `teams_TIMESTAMP.csv` | Team structure and member counts |
| `ghapp webhooks --fetch` | `webhooks_TIMESTAMP.csv` | Webhook configurations |
| `ghapp secrets --fetch` | `secrets_TIMESTAMP.csv` | 8 columns of GitHub Actions secrets metadata |
| `ghapp variables --fetch` | `variables_TIMESTAMP.csv` | 8 columns of GitHub Actions variables |

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/your-org/ghapp-cli/issues)
- Use `ghapp help` for command-specific guidance
- Review the comprehensive help system with `ghapp help-<command>`
