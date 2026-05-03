@echo off
echo ==============================================
echo 🚀 Starting MindTY Server 🚀
echo ==============================================
cd /d "%~dp0\tunisia-mind-web" 2>nul || cd /d "%~dp0"
echo 📦 Installing dependencies if needed...
call npm install --no-fund --no-audit

echo ⚙️ Starting Node.js backend on port 3000...
node server.js

