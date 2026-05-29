# HANCR Environment Verification Script
# verify.ps1 — Full environment health check

$ErrorActionPreference = "Continue"
$passed = 0
$failed = 0
$warnings = 0

function Write-Check {
  param($label, $status, $detail = "")
  if ($status -eq "PASS") {
    Write-Host "  [OK] $label" -ForegroundColor Green
    if ($detail) { Write-Host "       $detail" -ForegroundColor DarkGray }
    $script:passed++
  } elseif ($status -eq "WARN") {
    Write-Host "  [!!] $label" -ForegroundColor Yellow
    if ($detail) { Write-Host "       $detail" -ForegroundColor Yellow }
    $script:warnings++
  } else {
    Write-Host "  [XX] $label" -ForegroundColor Red
    if ($detail) { Write-Host "       $detail" -ForegroundColor Red }
    $script:failed++
  }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   HANCR Environment Verification v1.0         " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# === SECTION 1: Tools ===
Write-Host "[1] Required Tools:" -ForegroundColor White

try {
  $v = node --version 2>&1
  $major = [int]($v -replace 'v(\d+).*','$1')
  if ($major -ge 18) { Write-Check "Node.js" "PASS" "$v" }
  else { Write-Check "Node.js" "WARN" "$v (recommend v20+)" }
} catch { Write-Check "Node.js" "FAIL" "Not installed" }

try { $v = npm --version 2>&1; Write-Check "npm" "PASS" "v$v" }
catch { Write-Check "npm" "FAIL" "Not installed" }

try { $v = git --version 2>&1; Write-Check "Git" "PASS" "$v" }
catch { Write-Check "Git" "FAIL" "Not installed" }

try { $v = flutter --version 2>&1 | Select-Object -First 1; Write-Check "Flutter" "PASS" "$v" }
catch { Write-Check "Flutter" "WARN" "Not installed - needed for Phase 2" }

try {
  docker --version 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Check "Docker" "PASS" "$(docker --version 2>&1)" }
  else { Write-Check "Docker" "FAIL" "Install Docker Desktop from docker.com" }
} catch { Write-Check "Docker" "FAIL" "Install Docker Desktop from docker.com" }

Write-Host ""

# === SECTION 2: Project Structure ===
Write-Host "[2] Project Structure (E:\HANCR\):" -ForegroundColor White

$dirs = @(
  "apps\rider-api\src",
  "apps\driver-api\src",
  "apps\admin-api\src",
  "libs\database\src\lib\entities",
  "libs\database\src\lib\enums",
  "libs\redis\src\lib",
  "docker"
)
foreach ($d in $dirs) {
  $p = "E:\HANCR\$d"
  if (Test-Path $p) { Write-Check $d "PASS" }
  else { Write-Check $d "FAIL" "Directory missing" }
}

Write-Host ""

# === SECTION 3: Key Files ===
Write-Host "[3] Key Files:" -ForegroundColor White

$files = @(
  "package.json",
  "nx.json",
  "tsconfig.base.json",
  ".env.example",
  "docker\docker-compose.yml",
  "docker\postgres\init.sql",
  "libs\database\src\index.ts",
  "libs\database\src\lib\data-source.ts",
  "libs\database\src\lib\migrations\1748300000000-InitialHancrSchema.ts",
  "libs\redis\src\index.ts"
)
foreach ($f in $files) {
  $p = "E:\HANCR\$f"
  if (Test-Path $p) { Write-Check $f "PASS" }
  else { Write-Check $f "FAIL" "File missing" }
}

Write-Host ""

# === SECTION 4: Database Entities ===
Write-Host "[4] Database Entities:" -ForegroundColor White

$entities = @(
  "order.entity.ts", "rider.entity.ts", "driver.entity.ts",
  "service.entity.ts", "region.entity.ts", "loyalty.entity.ts",
  "driver-stars.entity.ts", "bid.entity.ts", "bid-offer.entity.ts",
  "pool.entity.ts", "pool-member.entity.ts", "app-config.entity.ts",
  "config-audit-log.entity.ts", "request-activity.entity.ts",
  "order-message.entity.ts"
)
foreach ($e in $entities) {
  $p = "E:\HANCR\libs\database\src\lib\entities\$e"
  if (Test-Path $p) { Write-Check $e "PASS" }
  else { Write-Check $e "FAIL" "Entity missing" }
}

Write-Host ""

# === SECTION 5: Redis Services ===
Write-Host "[5] Redis Services:" -ForegroundColor White

$redis = @(
  "driver-redis.service.ts","order-redis.service.ts",
  "bid-redis.service.ts","redis-keys.constant.ts","redis.module.ts"
)
foreach ($r in $redis) {
  $p = "E:\HANCR\libs\redis\src\lib\$r"
  if (Test-Path $p) { Write-Check $r "PASS" }
  else { Write-Check $r "FAIL" "Service missing" }
}

Write-Host ""

# === SECTION 6: TypeScript ===
Write-Host "[6] TypeScript Compilation:" -ForegroundColor White

if (Test-Path "E:\HANCR\node_modules") {
  Push-Location "E:\HANCR"
  
  $dbOut = npx tsc --noEmit -p libs/database/tsconfig.lib.json 2>&1
  if ($LASTEXITCODE -eq 0) { Write-Check "libs/database (tsc)" "PASS" "0 errors" }
  else { Write-Check "libs/database (tsc)" "FAIL" ($dbOut | Select-Object -First 3 | Out-String) }

  $redisOut = npx tsc --noEmit -p libs/redis/tsconfig.json 2>&1
  if ($LASTEXITCODE -eq 0) { Write-Check "libs/redis (tsc)" "PASS" "0 errors" }
  else { Write-Check "libs/redis (tsc)" "FAIL" ($redisOut | Select-Object -First 3 | Out-String) }

  Pop-Location
} else {
  Write-Check "TypeScript" "WARN" "node_modules missing - run: npm install"
}

Write-Host ""

# === SECTION 7: Docker ===
Write-Host "[7] Docker Services:" -ForegroundColor White

try {
  docker info 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Check "Docker Daemon" "PASS" "Running"
    $containers = docker ps --format "{{.Names}}" 2>&1
    if ($containers -match "hancr_postgres") { Write-Check "PostgreSQL" "PASS" "Running" }
    else { Write-Check "PostgreSQL" "WARN" "Not running - cd docker && docker compose up -d" }
    if ($containers -match "hancr_redis") { Write-Check "Redis" "PASS" "Running" }
    else { Write-Check "Redis" "WARN" "Not running - cd docker && docker compose up -d" }
  } else { Write-Check "Docker Daemon" "WARN" "Docker Desktop not running" }
} catch { Write-Check "Docker" "FAIL" "Not installed - download from docker.com" }

Write-Host ""

# === Summary ===
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  RESULTS: $passed passed | $warnings warnings | $failed failed" -ForegroundColor White

if ($failed -eq 0 -and $warnings -eq 0) {
  Write-Host "  STATUS: READY 100% - Start development!" -ForegroundColor Green
} elseif ($failed -eq 0) {
  Write-Host "  STATUS: READY (with $warnings warnings)" -ForegroundColor Yellow
} else {
  Write-Host "  STATUS: $failed issues need fixing before starting" -ForegroundColor Red
}
Write-Host "  PROJECT: E:\HANCR\" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""