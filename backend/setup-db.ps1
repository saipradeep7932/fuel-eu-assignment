# PowerShell script for setting up PostgreSQL database
# Run this from the backend directory

Write-Host "FuelEU Database Setup Script" -ForegroundColor Green
Write-Host ""

# Check if Docker is available
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerAvailable) {
    Write-Host "Docker is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop"
    Write-Host "2. Install PostgreSQL locally and create database manually"
    Write-Host "3. Use a cloud PostgreSQL service (e.g., Supabase, Railway)"
    Write-Host ""
    Write-Host "For now, you can:" -ForegroundColor Yellow
    Write-Host "- Create a .env file with your DATABASE_URL"
    Write-Host "- The backend will start but APIs will fail without a database"
    Write-Host ""
    exit 1
}

Write-Host "Starting PostgreSQL container..." -ForegroundColor Cyan
docker run --name fueleu-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=fueleu `
  -p 5432:5432 `
  -d postgres:15

if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL container started!" -ForegroundColor Green
    Write-Host "Waiting 5 seconds for PostgreSQL to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "Creating database schema..." -ForegroundColor Cyan
    Get-Content "src/infrastructure/db/schema.sql" | docker exec -i fueleu-postgres psql -U postgres -d fueleu
    
    Write-Host "Seeding data..." -ForegroundColor Cyan
    Get-Content "src/infrastructure/db/seed.sql" | docker exec -i fueleu-postgres psql -U postgres -d fueleu
    
    Write-Host ""
    Write-Host "Database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create a .env file in the backend directory with:"
    Write-Host "   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fueleu"
    Write-Host "2. Run: npm run dev"
} else {
    Write-Host "Failed to start PostgreSQL container" -ForegroundColor Red
    Write-Host "Container may already exist. Try: docker start fueleu-postgres" -ForegroundColor Yellow
}

