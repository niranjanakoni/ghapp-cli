# How to Download and Install ghapp-cli

## For Windows Users

### Option 1: Simple Download and Use (Recommended)

1. **Download the Windows package:**
   - Go to: https://github.com/niranjanakoni/ghapp-cli/releases
   - Download `ghapp-win.zip` from the latest release
   - Or direct download: [ghapp-win.zip](https://github.com/niranjanakoni/ghapp-cli/releases/latest/download/ghapp-win.zip)

2. **Extract and use:**
   ```cmd
   # Extract to any folder, e.g., C:\Tools\ghapp
   # Open Command Prompt and navigate to the folder
   cd C:\Tools\ghapp
   ghapp.bat --help
   ```

3. **Start using it:**
   ```cmd
   ghapp.bat repos --help
   ghapp.bat teams MyOrg
   ghapp.bat webhooks --org MyOrg
   ```

### Option 2: System-wide Installation (Advanced)

1. **Download and extract** as above
2. **Run the installer:**
   ```cmd
   # Right-click "install.bat" and "Run as administrator"
   # OR double-click install.bat
   ```
3. **Restart Command Prompt** and use from anywhere:
   ```cmd
   ghapp --help
   ghapp repos --list
   ```

### Option 3: Manual PATH Setup

1. **Download and extract** to `C:\Tools\ghapp`
2. **Add to PATH manually:**
   - Press `Windows + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\Tools\ghapp`
   - Click OK on all dialogs
3. **Restart Command Prompt** and use `ghapp` from anywhere

## For macOS Users

### Option 1: Simple Download and Use

1. **Download the macOS package:**
   - Go to: https://github.com/niranjanakoni/ghapp-cli/releases
   - Download `ghapp-macos.tar.gz`

2. **Extract and use:**
   ```bash
   # Extract the downloaded file
   tar -xzf ghapp-macos.tar.gz
   cd ghapp-macos
   
   # Make it executable
   chmod +x ghapp
   
   # Use it
   ./ghapp --help
   ```

### Option 2: System-wide Installation

```bash
# Download and extract
curl -L https://github.com/niranjanakoni/ghapp-cli/releases/latest/download/ghapp-macos.tar.gz | tar -xz

# Move to system location
sudo mv ghapp-macos /usr/local/bin/ghapp-cli
sudo chmod +x /usr/local/bin/ghapp-cli/ghapp

# Create symlink for easy access
sudo ln -s /usr/local/bin/ghapp-cli/ghapp /usr/local/bin/ghapp

# Use from anywhere
ghapp --help
```

### Option 3: Homebrew (If available in the future)

```bash
brew install niranjanakoni/tap/ghapp-cli
ghapp --help
```

## For Linux Users

### Option 1: Simple Download and Use

1. **Download the Linux package:**
   ```bash
   wget https://github.com/niranjanakoni/ghapp-cli/releases/latest/download/ghapp-linux.tar.gz
   tar -xzf ghapp-linux.tar.gz
   cd ghapp-linux
   chmod +x ghapp
   ./ghapp --help
   ```

### Option 2: System-wide Installation

```bash
# Download and extract
wget https://github.com/niranjanakoni/ghapp-cli/releases/latest/download/ghapp-linux.tar.gz
tar -xzf ghapp-linux.tar.gz

# Install system-wide
sudo mv ghapp-linux /opt/ghapp-cli
sudo chmod +x /opt/ghapp-cli/ghapp
sudo ln -s /opt/ghapp-cli/ghapp /usr/local/bin/ghapp

# Use from anywhere
ghapp --help
```

### Option 3: Snap Package (If available in the future)

```bash
sudo snap install ghapp-cli
ghapp --help
```

## Requirements

- **Node.js must be installed** on your system (any recent version)
- Download from: https://nodejs.org
- Or use system package manager:
  - Windows: `winget install OpenJS.NodeJS`
  - macOS: `brew install node`
  - Linux: `sudo apt install nodejs npm` (Ubuntu/Debian)

## Quick Start After Installation

1. **Check installation:**
   ```bash
   ghapp --version
   ghapp --help
   ```

2. **Configure your GitHub App:**
   ```bash
   # Set up your GitHub App credentials
   # (Follow the main README for configuration details)
   ```

3. **Start using:**
   ```bash
   ghapp repos --help
   ghapp teams MyOrg
   ghapp webhooks --org MyOrg --format table
   ```

## Troubleshooting

### "Command not found" or "ghapp is not recognized"
- Make sure Node.js is installed: `node --version`
- Check if the executable path is correct
- On Windows, restart Command Prompt after PATH changes

### "Permission denied" (macOS/Linux)
```bash
chmod +x ghapp
```

### "Module not found" errors
- Make sure you extracted the complete package
- Don't move individual files, keep the folder structure intact

## Uninstall

### Windows
- Delete the extracted folder
- Remove from PATH if you added it manually

### macOS/Linux
```bash
# If installed system-wide
sudo rm /usr/local/bin/ghapp
sudo rm -rf /opt/ghapp-cli  # or wherever you installed it
```

## Alternative Installation Methods

### 1. NPM (For developers)
```bash
npm install -g ghapp-cli
```

### 2. Direct from source
```bash
git clone https://github.com/niranjanakoni/ghapp-cli.git
cd ghapp-cli
npm install
npm start -- --help
```

## Getting Help

- **GitHub Issues**: https://github.com/niranjanakoni/ghapp-cli/issues
- **Documentation**: Check the README.md in the repository
- **Command help**: `ghapp --help` or `ghapp [command] --help`
