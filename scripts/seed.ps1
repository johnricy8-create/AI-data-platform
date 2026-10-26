$root = Split-Path -Parent $PSScriptRoot
Set-Location "$root\backend"
uv run python -m app.db.seed
