# PowerShell script to create .env file
# Run this from the backend directory

Write-Host "Creating .env file..." -ForegroundColor Cyan
Write-Host ""

# Prompt for PostgreSQL password
$password = Read-Host "Enter your PostgreSQL password (will be URL-encoded)" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

# URL encode the password
Add-Type -AssemblyName System.Web
$passwordEncoded = [System.Web.HttpUtility]::UrlEncode($passwordPlain)

# Create .env file
$envContent = @"
DATABASE_URL=postgresql://postgres:$passwordEncoded@localhost:5432/fueleu
PORT=3001
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline

Write-Host ""
Write-Host ".env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "DATABASE_URL format: postgresql://postgres:$passwordEncoded@localhost:5432/fueleu" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Password has been URL-encoded to handle special characters like @, #, etc." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run 'npm run dev' to start the backend" -ForegroundColor Green

