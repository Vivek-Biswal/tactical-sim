param([string]$BindAddress = "127.0.0.1", [int]$Port = 8000)
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$backendPython = Join-Path $projectRoot "backend/.venv/Scripts/python.exe"
if (-not (Test-Path -LiteralPath $backendPython)) { throw "Create backend/.venv and install backend/requirements.txt first. See docs/backend.md." }
Set-Location -LiteralPath $projectRoot
& $backendPython -m uvicorn app.main:app --app-dir backend --host $BindAddress --port $Port --ws-max-size 65536
