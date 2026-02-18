@echo off
REM Windows launcher for build/sbt (avoids "Select an application" when running the bash script).
REM Prefer: 1) Git Bash  2) WSL  3) sbt on PATH

set "ROOT=%~dp0.."
set "SBT_SCRIPT=%~dp0sbt"
cd /d "%ROOT%"

REM Try Git Bash (common when Git for Windows is installed)
set "BASH="
if defined ProgramFiles set "BASH=%ProgramFiles%\Git\bin\bash.exe"
if not exist "%BASH%" if defined ProgramFiles(x86) set "BASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if exist "%BASH%" (
  "%BASH%" "%SBT_SCRIPT%" %*
  exit /b %ERRORLEVEL%
)

REM Try WSL (use --cd so the project dir is current inside WSL)
where wsl >nul 2>&1
if %ERRORLEVEL% equ 0 (
  wsl --cd "%CD%" bash "./build/sbt" %*
  exit /b %ERRORLEVEL%
)

REM Fallback: system sbt if on PATH
where sbt >nul 2>&1
if %ERRORLEVEL% equ 0 (
  sbt %*
  exit /b %ERRORLEVEL%
)

echo.
echo sbt.bat: Could not find bash or sbt.
echo   - Install Git for Windows and use Git Bash, or
echo   - Install WSL (e.g. Ubuntu from Microsoft Store), or
echo   - Install sbt and add it to PATH (e.g. scoop install sbt).
echo.
exit /b 1
