@echo off
cd /d "%~dp0"

echo ==================================================
echo The Place Department
echo http://localhost:4173/
echo ==================================================

start "" "http://localhost:4173/"
python -m http.server 4173
if errorlevel 1 pause
