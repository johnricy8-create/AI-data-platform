$root = Split-Path -Parent $PSScriptRoot
Set-Location "$root\backend"
uv run uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload
