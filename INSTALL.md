# Installation Guide for ghapp CLI

A comprehensive guide to install and set up the GitHub App CLI tool.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **GitHub App**: A configured GitHub App with appropriate permissions
- **Git**: For cloning the repository (if installing from source)

## Installation Methods

### Method 1: Install from Source (Recommended for Development)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/niranjanakoni/ghapp-cli.git
cd ghapp-cli
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Make CLI Available Globally (Optional)
```bash
npm link
```

After this, you can use `ghapp` command from anywhere in your terminal.

### Method 2: Install from Built Package

#### Step 1: Download Pre-built Package
- Go to [GitHub Releases](https://github.com/niranjanakoni/ghapp-cli/releases)
- Download the appropriate package for your operating system:
  - **Windows**: `ghapp-win.zip`
  - **macOS**: `ghapp-macos.tar.gz`
  - **Linux**: `ghapp-linux.tar.gz`

#### Step 2: Extract and Use

**Windows:**
```cmd
# Extract to desired location (e.g., C:\Tools\ghapp)
# Copy your .env and private-key.pem files to the same directory
# Open Command Prompt and navigate to the folder
cd C:\Tools\ghapp
ghapp.bat --help
```

**macOS/Linux:**
```bash
# Extract the package
tar -xzf ghapp-[platform].tar.gz
cd ghapp-[platform]

# Copy your .env and private-key.pem files to this directory
cp /path/to/your/.env .
cp /path/to/your/private-key.pem .

# Make executable
chmod +x ghapp

# Test the installation
./ghapp --help
```

> **📁 Important**: The binary looks for `.env` and `private-key.pem` files in the **same directory** where the binary is located. Make sure to copy these files alongside the binary.

## Configuration Setup

> **📁 For Binary Users**: If you downloaded a pre-built binary, you need to create the configuration files in the **same directory** as the binary executable.

### Step 1: Create Environment File

Create a `.env` file in the project root directory (or next to your binary):

```bash
# Copy the example environment file
cp .env.example .env

# Or create manually if .env.example doesn't exist
touch .env
```

### Step 2: Configure Environment Variables

Edit the `.env` file with your GitHub App credentials:

```env
# GitHub App Configuration
GITHUB_APP_ID=your_github_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_PRIVATE_KEY_PATH=path/to/your/private-key.pem

# Optional: Pre-configured token (will be auto-generated)
GITHUB_APP_TOKEN=
GITHUB_APP_TOKEN_EXPIRES=
```

### Step 3: Set Up Private Key

1. **Download your GitHub App's private key** from GitHub:
   - Go to GitHub → Settings → Developer settings → GitHub Apps
   - Select your app → Generate a private key
   - Download the `.pem` file

2. **Place the private key file** in your project directory (or next to your binary):
   ```bash
   # Example placement for source installation
   cp ~/Downloads/your-app-name.YYYY-MM-DD.private-key.pem ./private-key.pem
   
   # Example placement for binary installation  
   cp ~/Downloads/your-app-name.YYYY-MM-DD.private-key.pem /path/to/binary/private-key.pem
   ```

3. **Update the path** in your `.env` file:
   ```env
   GITHUB_PRIVATE_KEY_PATH=./private-key.pem
   ```

## GitHub App Setup

### Required Permissions

Your GitHub App needs the following permissions:

#### Repository Permissions:
- **Contents**: Read
- **Metadata**: Read
- **Pull requests**: Read
- **Issues**: Read
- **Administration**: Read (for webhooks)

#### Organization Permissions:
- **Members**: Read
- **Administration**: Read (for teams and webhooks)

### Installation Requirements

1. **Install the GitHub App** on your organization or repositories
2. **Note the Installation ID** from the installation URL or API
3. **Configure the App ID** from your GitHub App settings

## Binary Distribution File Structure

When using pre-built binaries, your directory should look like this:

```
your-ghapp-directory/
├── ghapp (or ghapp.exe on Windows)    # The binary executable
├── .env                               # Your configuration file
└── private-key.pem                    # Your GitHub App private key
```

The binary automatically looks for these files in the same directory where it's located.

## Verification

### Step 1: Test Configuration
```bash
# Verify environment setup
ghapp token --validate
```

### Step 2: Test Basic Functionality
```bash
# Test repository access
ghapp repos --help

# Test with actual data (if configured correctly)
ghapp repos
```

### Step 3: Test All Commands
```bash
# Repository management
ghapp repos --stats

# Team management  
ghapp teams

# Webhook analysis
ghapp webhooks

# Token management
ghapp token
```

## Common Installation Issues

### Issue 1: "Command not found: ghapp"

**Solution for Source Installation:**
```bash
# Re-run npm link
npm link

# Or use direct execution
node cli.js --help
```

**Solution for Package Installation:**
```bash
# Use full path or create alias
alias ghapp='./path/to/ghapp'
```

### Issue 2: "Missing required environment variables"

**Solution:**
1. Verify `.env` file exists and is in the correct location
2. Check that all required variables are set:
   ```bash
   cat .env | grep -E "(GITHUB_APP_ID|GITHUB_INSTALLATION_ID|GITHUB_PRIVATE_KEY_PATH)"
   ```

### Issue 3: "Private key file not found"

**Solution:**
1. Verify the private key file exists:
   ```bash
   ls -la private-key.pem
   ```
2. Check the path in `.env` file
3. Ensure proper file permissions:
   ```bash
   chmod 600 private-key.pem
   ```

### Issue 4: "API authentication failed"

**Solution:**
1. Verify GitHub App is installed on target organization/repositories
2. Check App permissions are correctly configured
3. Verify Installation ID is correct:
   ```bash
   # Test token generation
   ghapp token --refresh
   ```

## Platform-Specific Instructions

### Windows Setup

1. **Using Command Prompt:**
   ```cmd
   cd C:\path\to\ghapp-cli
   node cli.js --help
   ```

2. **Using PowerShell:**
   ```powershell
   Set-Location "C:\path\to\ghapp-cli"
   node cli.js --help
   ```

3. **Add to PATH (Optional):**
   - Add the ghapp-cli directory to your System PATH
   - Restart Command Prompt/PowerShell

### macOS Setup

1. **Using Terminal:**
   ```bash
   cd /path/to/ghapp-cli
   ./ghapp --help
   ```

2. **Add to PATH (Optional):**
   ```bash
   echo 'export PATH="$PATH:/path/to/ghapp-cli"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Linux Setup

1. **Using Terminal:**
   ```bash
   cd /path/to/ghapp-cli
   ./ghapp --help
   ```

2. **System-wide Installation (Optional):**
   ```bash
   sudo cp ghapp /usr/local/bin/
   sudo chmod +x /usr/local/bin/ghapp
   ```

## Development Setup

### For Contributors

1. **Clone and setup:**
   ```bash
   git clone https://github.com/niranjanakoni/ghapp-cli.git
   cd ghapp-cli
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Run linting:**
   ```bash
   npm run lint
   ```

4. **Build for distribution:**
   ```bash
   npm run bundle
   ```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITHUB_APP_ID` | Yes | Your GitHub App ID | `123456` |
| `GITHUB_INSTALLATION_ID` | Yes | Installation ID of your app | `12345678` |
| `GITHUB_PRIVATE_KEY_PATH` | Yes | Path to private key file | `./private-key.pem` |
| `GITHUB_APP_TOKEN` | No | Auto-generated token | Auto-managed |
| `GITHUB_APP_TOKEN_EXPIRES` | No | Token expiration time | Auto-managed |

## Next Steps

After successful installation:

1. **Read the main documentation**: Check `README.md` for usage examples
2. **Explore commands**: Use `ghapp help` to see all available commands
3. **Test with your data**: Try `ghapp repos --stats` to verify setup
4. **Export data**: Use `ghapp repos --fetch` to export repository data

## Support

If you encounter issues:

1. **Check logs**: Run commands with `--verbose` flag for detailed output
2. **Validate setup**: Use `ghapp token --validate` to check configuration
3. **Review documentation**: Check the main `README.md` for usage examples
4. **Report issues**: Create an issue on [GitHub Issues](https://github.com/niranjanakoni/ghapp-cli/issues)

## Quick Start Commands

Once installed and configured:

```bash
# Show help
ghapp --help

# List repositories
ghapp repos

# Export repository data (saves to organized folders)
ghapp repos --fetch

# Show teams
ghapp teams

# Check token status
ghapp token

# Get detailed help for any command
ghapp help-repos
ghapp help-teams
ghapp help-webhooks
```

## CSV Export Organization

When using the `--fetch` option, CSV files are automatically organized into a clean directory structure:

```
ghapp-exports/
└── YYYY-MM-DD/                    # Date-based folders
    ├── repositories/              # Repository data exports
    ├── collaborators/             # Collaborator data exports  
    ├── teams/                     # Team data exports
    └── webhooks/                  # Webhook data exports
```

**Benefits:**
- Keeps your workspace clean (no CSV files in project root)
- Easy to find exports by date and type
- Simple cleanup and archiving of old data
- Professional organization for data management

**Example:**
```bash
# Export repositories - creates: ghapp-exports/2025-08-07/repositories/repos_[timestamp].csv
ghapp repos --fetch

# Export teams - creates: ghapp-exports/2025-08-07/teams/teams_[timestamp].csv  
ghapp teams --fetch

# Export webhooks - creates: ghapp-exports/2025-08-07/webhooks/webhooks_[timestamp].csv
ghapp webhooks --fetch
```

## Further Documentation

- **Usage Examples**: See [README.md](./README.md) for comprehensive usage examples and command reference
- **Command Options**: Detailed options and examples for all commands
- **CSV Export Formats**: Data structure and column descriptions
- **Advanced Features**: Filtering, sorting, and statistics options
