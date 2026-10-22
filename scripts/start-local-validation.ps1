$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$validationRoot = Join-Path $projectRoot '.validation'
New-Item -ItemType Directory -Force -Path $validationRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'convex'), (Join-Path $projectRoot 'config') -Destination $validationRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json') -Destination $validationRoot -Force
$validationEnv = Join-Path $validationRoot '.env.local'
if (-not (Test-Path -LiteralPath $validationEnv)) {
    Set-Content -LiteralPath $validationEnv -Value ''
}
Push-Location $validationRoot
$previousMode = $env:CONVEX_AGENT_MODE
try {
    $env:CONVEX_AGENT_MODE = 'anonymous'
    npx convex dev --run seed:run
} finally {
    $env:CONVEX_AGENT_MODE = $previousMode
    Pop-Location
}
