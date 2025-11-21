# Supabase Environment Setup Script
Write-Host "Setting up Supabase connection..." -ForegroundColor Green
Write-Host ""

# Get database password from user
$dbPassword = Read-Host "Enter your Supabase DATABASE PASSWORD (not the anon key)" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# Get JWT secret
$jwtSecret = Read-Host "Enter JWT Secret (or press Enter for default)" 
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = "fleet-management-secret-key-change-in-production"
}

# Construct connection string
# Supabase format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
$projectRef = "uucjdcbtpunfsyuixsmc"
$connectionString = "postgresql://postgres:$dbPasswordPlain@db.$projectRef.supabase.co:5432/postgres"

# Create .env file content
$envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Database Connection
DATABASE_URL=$connectionString

# Supabase API
SUPABASE_URL=https://uucjdcbtpunfsyuixsmc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2pkY2J0cHVuZnN5dWl4c21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODE0MzIsImV4cCI6MjA3ODM1NzQzMn0.2Pfe6Z4mhkJn5d1HlnDd8ACMpydNO1a_CSw_qQvYQsI

# JWT Secret
JWT_SECRET=$jwtSecret

# Database Configuration (Alternative - not needed if using DATABASE_URL)
# DB_HOST=db.uucjdcbtpunfsyuixsmc.supabase.co
# DB_USER=postgres
# DB_NAME=postgres
# DB_PORT=5432
# DB_SSL=true

# Disable test mode to use real database
TEST_MODE=false
"@

# Write to .env file
$envPath = Join-Path $PSScriptRoot "backend\.env"
$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ .env file created at: $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure you have:" -ForegroundColor Yellow
Write-Host "   1. Your Supabase database password (not the anon key)" -ForegroundColor Yellow
Write-Host "   2. Run the database migrations in Supabase SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify .env file in backend/.env" -ForegroundColor Cyan
Write-Host "   2. Run migrations from database/migrations/ folder" -ForegroundColor Cyan
Write-Host "   3. Restart backend server: cd backend && npm run dev" -ForegroundColor Cyan

