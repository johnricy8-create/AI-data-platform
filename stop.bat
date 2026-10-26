@echo off
setlocal EnableExtensions
echo Stopping AI Commerce Hub on ports 8011 and 5173...

for %%P in (8011 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%A >nul 2>nul
    echo Stopped PID %%A on port %%P
  )
)

echo Done.
endlocal
