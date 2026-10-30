@echo off
cd /d "%~dp0"
call npm ci
if errorlevel 1 goto done
call npm run build:win
:done
pause
