@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%Start-AliveStudio.ps1"

if errorlevel 1 (
  echo.
  echo ALIVE Studio failed to start. See error above.
  pause
)
