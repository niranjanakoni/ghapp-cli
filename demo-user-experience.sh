#!/bin/bash

# Demo script showing how a normal user would install and use ghapp-cli
# This simulates the user experience

echo "🚀 ghapp-cli Installation Demo"
echo "================================="
echo

echo "Step 1: Download the package"
echo "👤 User: I'll download ghapp-linux.tar.gz from GitHub releases"
echo "💻 Command: wget https://github.com/niranjanakoni/ghapp-cli/releases/latest/download/ghapp-linux.tar.gz"
echo

echo "Step 2: Extract the package"
echo "👤 User: Let me extract this file"
echo "💻 Command: tar -xzf ghapp-linux.tar.gz"
echo

echo "Step 3: Make it executable"
echo "👤 User: I need to make the script executable"
echo "💻 Command: cd ghapp-linux && chmod +x ghapp"
echo

echo "Step 4: Test the installation"
echo "👤 User: Let me see if it works"
echo "💻 Command: ./ghapp --help"
echo

echo "Expected output:"
echo "=================="
cat << 'EOF'
Usage: ghapp [options] [command]
CLI to interact with GitHub App APIs

Options:
  -V, --version             output the version number
  -v, --verbose             Enable verbose logging
  -q, --quiet               Suppress non-error output
  -h, --help                display help for command

Commands:
  repos [options]           List repositories accessible to the installation
  teams [options] [org]     List teams in the organization
  webhooks [options] [org]  List webhooks configured for repositories
  token [options]           Show current GitHub App token and expiry information
  help                      Show help information
EOF

echo
echo "Step 5: Use the tool"
echo "👤 User: Great! Now I can use it for my GitHub App"
echo "💻 Command: ./ghapp repos --help"
echo "💻 Command: ./ghapp teams MyOrg"
echo "💻 Command: ./ghapp webhooks --org MyOrg --format table"
echo

echo "🎉 Installation complete!"
echo "The user can now:"
echo "  ✅ Use the tool immediately with ./ghapp"
echo "  ✅ Move it to /usr/local/bin for system-wide access"
echo "  ✅ Add it to their PATH for convenience"
echo
echo "No Node.js knowledge required - just download, extract, and use!"
