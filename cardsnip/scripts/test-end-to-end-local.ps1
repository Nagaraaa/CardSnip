$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ScraperDir = Join-Path $ProjectRoot "scraper"
$FakeShopUrl = "http://localhost:8080/index.html?price=39.99&stock=in"
$ApiBaseUrl = "http://localhost:8000"
$LocalPython = Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\python.exe"

function Get-PythonCommand {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        return "python"
    }

    if (Get-Command py -ErrorAction SilentlyContinue) {
        return "py"
    }

    if (Test-Path $LocalPython) {
        return $LocalPython
    }

    throw "Python est introuvable. Installe Python ou ajoute-le au PATH Windows."
}

$PythonCommand = Get-PythonCommand

function Write-Step {
    param([string] $Message)
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Read-Json {
    param([string] $Url, [string] $Method = "GET")

    $response = Invoke-WebRequest -UseBasicParsing -Method $Method $Url -TimeoutSec 20
    return $response.Content | ConvertFrom-Json
}

function Read-JsonArray {
    param([string] $Url)

    return @(Read-Json $Url | ForEach-Object { $_ })
}

Write-Step "Initialisation SQLite"
Push-Location $ScraperDir
& $PythonCommand scripts\init_db.py
Pop-Location

Write-Step "Verification fake shop"
$fakeShopResponse = Invoke-WebRequest -UseBasicParsing $FakeShopUrl -TimeoutSec 5
if ($fakeShopResponse.StatusCode -ne 200) {
    throw "Fake shop indisponible sur $FakeShopUrl"
}

Write-Step "Verification FastAPI"
$health = Read-Json "$ApiBaseUrl/health"
if ($health.status -ne "ok") {
    throw "FastAPI ne repond pas correctement sur $ApiBaseUrl/health"
}

Write-Step "Scenario A - prix bas et en stock"
Push-Location $ScraperDir
& $PythonCommand -c "from storage.database import connect; c=connect(); c.execute('update tracked_products set source_url=? where id=1', ('http://localhost:8080/index.html?price=39.99&stock=in',)); c.commit(); c.close()"
Pop-Location

$runA = Read-Json "$ApiBaseUrl/scraper/run" "POST"
if ($runA.errors -ne 0 -or $runA.observations -lt 1) {
    throw "Scenario A KO: $($runA | ConvertTo-Json -Compress)"
}

$latestA = Read-JsonArray "$ApiBaseUrl/observations/latest"
$demoA = $latestA | Where-Object { $_.tracked_product_id -eq 1 } | Select-Object -First 1
if (-not $demoA -or [double]$demoA.price -ne 39.99 -or $demoA.stock_status -ne "in_stock") {
    throw "Observation scenario A incorrecte: $($latestA | ConvertTo-Json -Compress)"
}

Write-Step "Scenario B - prix haut et rupture"
Push-Location $ScraperDir
& $PythonCommand -c "from storage.database import connect; c=connect(); c.execute('update tracked_products set source_url=? where id=1', ('http://localhost:8080/index.html?price=99.99&stock=out',)); c.commit(); c.close()"
Pop-Location

$runB = Read-Json "$ApiBaseUrl/scraper/run" "POST"
if ($runB.errors -ne 0 -or $runB.observations -lt 1) {
    throw "Scenario B KO: $($runB | ConvertTo-Json -Compress)"
}

$latestB = Read-JsonArray "$ApiBaseUrl/observations/latest"
$demoB = $latestB | Where-Object { $_.tracked_product_id -eq 1 } | Select-Object -First 1
if (-not $demoB -or [double]$demoB.price -ne 99.99 -or $demoB.stock_status -ne "out_of_stock") {
    throw "Observation scenario B incorrecte: $($latestB | ConvertTo-Json -Compress)"
}

Write-Step "Restauration scenario demo"
Push-Location $ScraperDir
& $PythonCommand -c "from storage.database import connect; c=connect(); c.execute('update tracked_products set source_url=? where id=1', ('http://localhost:8080/index.html?price=39.99&stock=in',)); c.commit(); c.close()"
Pop-Location

Write-Host ""
Write-Host "Test end-to-end local OK." -ForegroundColor Green
Write-Host "Flux valide: fake-shop -> scraper -> SQLite -> FastAPI -> dashboard." -ForegroundColor Green
