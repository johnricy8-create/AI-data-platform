$root = Split-Path -Parent $PSScriptRoot
Set-Location "$root\frontend"
npm run build
Write-Host ""
Write-Host "Build complete. Restart the backend to serve frontend/dist on http://127.0.0.1:8011"
