# =============================================
# HANCR — سكريبت بدء بيئة التطوير
# يُشغَّل بعد إعادة تشغيل Windows
# =============================================

Write-Host "🚀 HANCR Dev Environment Starting..." -ForegroundColor Cyan

# 1. تشغيل Docker Containers (PostgreSQL + Redis)
Write-Host "`n📦 Starting Docker containers..." -ForegroundColor Yellow
Set-Location "E:\HANCR\docker"
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker containers started" -ForegroundColor Green
} else {
    Write-Host "❌ Docker start failed — make sure Docker Desktop is running" -ForegroundColor Red
    exit 1
}

# 2. انتظر حتى يكون PostgreSQL جاهزاً
Write-Host "`n⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
do {
    Start-Sleep -Seconds 2
    $waited += 2
    $ready = docker exec hancr_postgres pg_isready -U hancr -d hancr 2>&1
} while ($ready -notlike "*accepting*" -and $waited -lt $maxWait)

if ($waited -ge $maxWait) {
    Write-Host "⚠️ PostgreSQL not ready after ${maxWait}s — continuing anyway" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL ready!" -ForegroundColor Green
}

# 3. تشغيل TypeORM Migrations
Write-Host "`n🗄️ Running database migrations..." -ForegroundColor Yellow
Set-Location "E:\HANCR"
$env:NODE_ENV = "development"
node -e "
const { DataSource } = require('typeorm');
// Quick migration check
console.log('Migrations check — run manually if needed:');
console.log('cd E:\\HANCR && npx typeorm migration:run -d libs/database/src/data-source.ts');
"

# 4. تشغيل admin-api
Write-Host "`n🔧 Starting admin-api on port 3002..." -ForegroundColor Yellow
Set-Location "E:\HANCR\apps\admin-api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\HANCR\apps\admin-api'; `$env:NODE_ENV='development'; npx ts-node src/main.ts" -WindowStyle Normal

# 5. تشغيل admin-panel
Write-Host "`n🌐 Starting admin-panel on port 4000..." -ForegroundColor Yellow
Set-Location "E:\HANCR\apps\admin-panel"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\HANCR\apps\admin-panel'; npm run dev" -WindowStyle Normal

Write-Host "`n✅ All services starting!" -ForegroundColor Green
Write-Host "📱 Admin Panel: http://localhost:4000/login" -ForegroundColor Cyan
Write-Host "🔗 Admin API:   http://localhost:3002/graphql" -ForegroundColor Cyan
Write-Host "🐘 PostgreSQL:  localhost:5433 (docker)" -ForegroundColor Cyan
Write-Host "📮 Redis:       localhost:6379 (docker)" -ForegroundColor Cyan
Write-Host "`n🔑 Default login: admin@hancr.com" -ForegroundColor Yellow
