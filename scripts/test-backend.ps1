$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$env:PYTHONPATH = Join-Path $projectRoot "backend"
& ./backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -v
exit $LASTEXITCODE
