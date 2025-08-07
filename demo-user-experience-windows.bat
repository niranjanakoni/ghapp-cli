@echo off
REM Demo script showing how a normal user would install and use ghapp-cli on Windows
REM This simulates the user experience

echo 🚀 ghapp-cli Installation Demo (Windows)
echo ==========================================
echo.

echo Step 1: Download the package
echo 👤 User: I'll go to GitHub and download ghapp-win.zip
echo 🌐 URL: https://github.com/niranjanakoni/ghapp-cli/releases
echo 📁 File: ghapp-win.zip
echo.

echo Step 2: Extract the package
echo 👤 User: I'll extract this to C:\Tools\ghapp
echo 💻 Action: Right-click ghapp-win.zip → Extract All → C:\Tools\ghapp
echo.

echo Step 3: Test the installation
echo 👤 User: Let me open Command Prompt and test it
echo 💻 Command: cd C:\Tools\ghapp
echo 💻 Command: ghapp.bat --help
echo.

echo Expected output:
echo ==================
echo Usage: ghapp [options] [command]
echo CLI to interact with GitHub App APIs
echo.
echo Options:
echo   -V, --version             output the version number
echo   -v, --verbose             Enable verbose logging
echo   -q, --quiet               Suppress non-error output
echo   -h, --help                display help for command
echo.
echo Commands:
echo   repos [options]           List repositories accessible to the installation
echo   teams [options] [org]     List teams in the organization
echo   webhooks [options] [org]  List webhooks configured for repositories
echo   token [options]           Show current GitHub App token and expiry information
echo   help                      Show help information
echo.

echo Step 4: Easy system-wide installation (Optional)
echo 👤 User: I want to use 'ghapp' from anywhere
echo 💻 Action: Double-click install.bat (or right-click → Run as administrator)
echo 📝 Result: Tool is added to PATH automatically
echo.

echo Step 5: Use the tool
echo 👤 User: Perfect! Now I can use it anywhere
echo 💻 Command: ghapp repos --help
echo 💻 Command: ghapp teams MyOrg
echo 💻 Command: ghapp webhooks --org MyOrg --format table
echo.

echo 🎉 Installation complete!
echo The user can now:
echo   ✅ Use ghapp.bat directly from the extracted folder
echo   ✅ Run install.bat for system-wide access
echo   ✅ Use 'ghapp' from any Command Prompt after installation
echo.
echo 💡 No technical knowledge required:
echo   • No need to understand Node.js, npm, or package managers
echo   • No command-line compilation or building
echo   • Just download, extract, and use!
echo.
pause
