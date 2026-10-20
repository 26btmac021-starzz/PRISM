@echo off
setlocal
cd /d "%~dp0"
echo =========================================
echo       PRISM / FIELD INTELLIGENCE
 echo =========================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
if not exist ".env" copy /y ".env.example" ".env" >nul
if not exist "node_modules" (
  echo First run: installing packages, please wait...
  call npm.cmd install
  if errorlevel 1 (
    echo npm installation failed. See output above.
    pause
    exit /b 1
  )
)
echo Starting new PRISM UI. Open the Local URL printed below.
echo Press Ctrl+C to stop the dev server.
call npm.cmd run dev
pause
