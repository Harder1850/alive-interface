$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$dashboardDir = Join-Path $repoRoot "studio\dashboard"
$apiHealthUrl = "http://localhost:4174/api/health"
$readinessUrl = "http://localhost:4174/api/startup-readiness"
$studioUrl = "http://localhost:5173"

function Test-UrlJson {
  param([string]$Url)

  try {
    $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 2
    return @{ ok = $true; body = $response }
  }
  catch {
    return @{ ok = $false; body = $null }
  }
}

function Test-Url {
  param([string]$Url)

  try {
    Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

try {
  $health = Test-UrlJson -Url $apiHealthUrl
  $studioReachable = Test-Url -Url $studioUrl

  if (-not ($health.ok -and $studioReachable)) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm --prefix `"$dashboardDir`" run dev" -WorkingDirectory $repoRoot -WindowStyle Minimized
  }

  $deadline = (Get-Date).AddSeconds(120)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    $health = Test-UrlJson -Url $apiHealthUrl
    $readiness = Test-UrlJson -Url $readinessUrl
    $studioReachable = Test-Url -Url $studioUrl

    if (
      $health.ok -and
      $health.body.ok -eq $true -and
      $readiness.ok -and
      $readiness.body.studioReady -eq $true -and
      $readiness.body.runtimeReady -eq $true -and
      $readiness.body.demoPathReady -eq $true -and
      $readiness.body.intentPathReady -eq $true -and
      $studioReachable
    ) {
      $ready = $true
      break
    }

    Start-Sleep -Milliseconds 800
  }

  if (-not $ready) {
    throw "ALIVE Studio startup failed readiness checks within 120s. Expected Studio, Runtime, Demo path, and Intent path to be ready."
  }

  Start-Process $studioUrl
  Write-Host "ALIVE Studio is ready: $studioUrl"
}
catch {
  Write-Error "ALIVE Studio launcher failed: $($_.Exception.Message)"
  exit 1
}
