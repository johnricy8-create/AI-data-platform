@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
set "UV=uv"

where uv >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.local\bin\uv.exe" (
    set "UV=%USERPROFILE%\.local\bin\uv.exe"
  ) else (
    echo [ERROR] uv not found. Install uv first:
    echo   powershell -c "irm https://astral.sh/uv/install.ps1 ^| iex"
    pause
    exit /b 1
  )
)

netstat -ano | findstr /R /C:":8011 .*LISTENING" >nul
if errorlevel 1 (
  if not exist "%ROOT%backend\.venv" (
    echo Installing Python dependencies...
    pushd "%ROOT%backend"
    "%UV%" sync --python 3.12
    popd
  )
  echo Starting backend on http://127.0.0.1:8011 ...
  start "AI Commerce Hub API" /D "%ROOT%backend" "%UV%" run uvicorn app.main:app --host 127.0.0.1 --port 8011
  ping -n 4 127.0.0.1 >nul
) else (
  echo Backend already running on 8011.
)

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul
if errorlevel 1 (
  if not exist "%ROOT%frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%ROOT%frontend"
    call npm install
    popd
  )
  echo Starting frontend on http://127.0.0.1:5173 ...
  start "AI Commerce Hub Web" /D "%ROOT%frontend" cmd /k npm run dev
  ping -n 4 127.0.0.1 >nul
) else (
  echo Frontend already running on 5173.
)

echo.
echo Frontend: http://127.0.0.1:5173
echo API docs: http://127.0.0.1:8011/docs
start "" "http://127.0.0.1:5173"
endlocal
