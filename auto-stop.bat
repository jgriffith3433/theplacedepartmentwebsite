@echo off
cd /d "%~dp0"

echo ==================================================
echo Stop The Place Department
echo ==================================================

set FOUND=0
for /f "tokens=5" %%P in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":4173 "') do (
  set FOUND=1
  echo Stopping server on port 4173 ^(PID %%P^)
  taskkill /F /PID %%P >nul 2>&1
)

if "%FOUND%"=="0" echo No server found on port 4173.

echo Done.
pause
