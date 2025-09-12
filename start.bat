@echo off
echo Starting ORB1 local server...
cd /d %~dp0

:: Optional - set environment if needed
:: set NODE_ENV=production

:: Check if node_modules exists
IF NOT EXIST node_modules (
  echo Installing dependencies...
  npm install
)

echo.
echo Running ORB1...

@echo off
@REM start "" cmd /k "node server.js"
@REM timeout /t 2 >nul
@REM start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:3000


start chrome http://localhost:3000
call node server.js
