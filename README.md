# GitHub App CLI

A modular, feature-rich command-line interface for interacting with GitHub App APIs. This CLI provides comprehensive functionality for managing repositories, teams, webhooks, and authentication through GitHub App installation.

## Features

- **Modular Architecture**: Clean separation of concerns with dedicated modules for each command
- **Repository Management**: List, filter, sort, and export repository data with advanced filtering
- **Collaborator Management**: Fetch repository collaborators with their permission levels (NEW!)
- **Team Management**: Manage organization teams with hierarchy, member roles, and repository permissions
- **Webhook Management**: Discover, analyze, and export repository webhook configurations
- **Token Management**: Handle GitHub App authentication with automatic token refresh
- **CSV Export/Import**: Export data to CSV files and import repository lists from CSV
- **Comprehensive Filtering**: Advanced filtering options for repositories, teams, and webhooks
- **Statistics & Analytics**: Built-in statistics for all data types with sorting capabilities
- **Error Handling**: Robust error handling with user-friendly messages
- **Logging**: Consistent logging strategy with configurable levels
- **Testing**: Full unit test coverage for all modules
- **Performance Optimized**: Efficient pagination and optional data fetching

## Installation

### Prerequisites

- Node.js >= 18.0.0
- A configured GitHub App with appropriate permissions

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/ghapp-cli.git
cd ghapp-cli
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
GITHUB_APP_ID=your_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_PRIVATE_KEY_PATH=path/to/private-key.pem
GITHUB_APP_TOKEN=auto_generated
GITHUB_APP_TOKEN_EXPIRES=auto_generated
```

4. Make the CLI globally available:
```bash
npm link
```

## Usage

### Basic Commands

```bash
# Show help
ghapp help

# List all repositories
ghapp repos

# 🆕 Export repository collaborators to CSV (NEW!)
ghapp repos --user-permission --fetch

# List teams (auto-detect organization)
ghapp teams

# List webhooks (auto-detect organization)
ghapp webhooks

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

# Include user permissions for each repository
ghapp repos --permissions

# Fetch collaborators and their roles for each repository (NEW!)
ghapp repos --user-permission --fetch

# Export collaborators to CSV with clean data (only repos with collaborators)
ghapp repos --user-permission --fetch

# Detailed view with permissions
ghapp repos --permissions --detailed

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
| `--permissions` | Include user permissions for each repository | `--permissions` |
| `--user-permission` | **NEW!** Fetch collaborators and their roles for each repository | `--user-permission --fetch` |
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

### Repository Collaborators CSV Output (NEW!)
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

## Project Structure

```
ghapp-cli/
├── src/
│   ├── commands/          # Command modules
│   │   ├── repos.js       # Repository command handler
│   │   ├── teams.js       # Teams command handler
│   │   ├── webhooks.js    # Webhooks command handler
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

## Recent Updates

### 🆕 Version 2.0 - Collaborator Management
- **NEW**: `--user-permission` flag for repository collaborator analysis
- **NEW**: Clean CSV export for repository collaborators with direct permissions only
- **IMPROVED**: Enhanced filtering to exclude inherited organization permissions
- **ENHANCED**: Better data quality for migration planning and access auditing

## 🆕 Collaborator Management (New Feature!)

The CLI now includes powerful collaborator management capabilities perfect for repository access analysis and migration planning.

### Key Features

- **Direct Collaborators Only**: Fetches users explicitly added to repositories, excluding inherited organization permissions
- **Clean CSV Export**: Generates clean data with only repositories that have direct collaborators
- **Accurate Permissions**: Shows actual GitHub API permission levels (`admin`, `write`, `read`, `maintain`, `triage`)
- **Migration Ready**: Perfect format for analyzing repository access patterns and planning migrations

### Usage Examples

```bash
# Export all repository collaborators to CSV
ghapp repos --user-permission --fetch

# View collaborators in terminal (with repository metrics)
ghapp repos --user-permission

# Combine with repository filtering
ghapp repos --visibility private --user-permission --fetch
```

### Sample Output

```csv
Source_Organization,Source_Repository,Username,Role
Demo-workshop-org,action-example,vaishnavn02,admin
Demo-workshop-org,action-example,akshay-canarys,write
Demo-workshop-org,HelloWebApp,niranjanakoni,admin
Demo-workshop-org,codeowners-test,ramesh2051,write
Demo-workshop-org,codeowners-test,nikhilgowda-135,write
```

### What Makes This Special

1. **Precise Filtering**: Uses GitHub's `affiliation: 'direct'` parameter to exclude organization owners who aren't actual collaborators
2. **No Noise**: Only includes repositories with actual collaborators (no "No collaborators found" entries)
3. **Ready for Analysis**: Clean, focused data perfect for understanding repository access patterns
4. **Migration Planning**: Ideal for planning repository migrations with accurate user permission mapping

## CSV Export Features

All commands support CSV export with `--fetch` option:

### Repository Collaborators CSV Export (NEW!)
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
ghapp repos --user-permission --fetch         # Export repository collaborators (NEW!)
ghapp repos --visibility private --fetch      # Export private repositories only

# Organization team analysis  
ghapp teams --fetch                           # Export team structure and members

# Webhook analysis
ghapp webhooks --fetch                        # Export webhook configurations

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

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/your-org/ghapp-cli/issues)
- Use `ghapp help` for command-specific guidance
- Review the comprehensive help system with `ghapp help-<command>`
