# PixelPlayground Backend - Quick Testing Guide

Write-Host "🎨 PixelPlayground Backend - Quick Test" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "http://localhost:3001"

# Check if backend is running
Write-Host "1️⃣  Testing Backend Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/health" -Method GET -UseBasicParsing
    $health = $response.Content | ConvertFrom-Json
    
    if ($health.success) {
        Write-Host "   ✅ Backend is running!" -ForegroundColor Green
        Write-Host "   ✅ MongoDB Status: $($health.status.mongodb)" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "   ❌ Backend error!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Backend is not running!" -ForegroundColor Red
    Write-Host "   💡 Run: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test Register
Write-Host "2️⃣  Testing Register Endpoint..." -ForegroundColor Yellow
$registerData = @{
    name = "Test User"
    email = "test_$(Get-Random -Maximum 10000)@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "   ✅ Register successful!" -ForegroundColor Green
        $testEmail = $result.data.user.email
        Write-Host "   📧 Test email: $testEmail" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        Write-Host "   ❌ Register failed: $($errorBody.message)" -ForegroundColor Red
    }
}

# Test Login
Write-Host "3️⃣  Testing Login Endpoint..." -ForegroundColor Yellow
$loginData = @{
    email = $testEmail
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "   ✅ Login successful!" -ForegroundColor Green
        $token = $result.data.token
        Write-Host "   🔑 Token received: $($token.Substring(0, 30))..." -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host "   ❌ Login failed!" -ForegroundColor Red
}

# Test Verify Token
Write-Host "4️⃣  Testing Verify Token Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/verify" -Method GET -Headers $headers -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "   ✅ Token verification successful!" -ForegroundColor Green
        Write-Host "   👤 User: $($result.data.user.name)" -ForegroundColor Cyan
        Write-Host "   📧 Email: $($result.data.user.email)" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host "   ❌ Token verification failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ All Tests Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   Backend URL: $BACKEND_URL" -ForegroundColor White
Write-Host "   Database: karyaklik" -ForegroundColor White
Write-Host "   Collection: users" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Open in browser:" -ForegroundColor Yellow
Write-Host "   Backend: $BACKEND_URL" -ForegroundColor White
Write-Host "   Health Check: $BACKEND_URL/api/health" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
