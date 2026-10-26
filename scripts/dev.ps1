$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting backend on http://127.0.0.1:8011 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\backend'; uv run uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload"
)

Start-Sleep -Seconds 2

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\frontend'; npm run dev"
)

Write-Host ""
Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host "API docs: http://127.0.0.1:8011/docs"
