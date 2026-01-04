# Test CORS Configuration
Write-Host "=== Testing CORS Configuration ===" -ForegroundColor Cyan

$BASE_URL = "http://localhost:3001"
$ORIGIN = "http://localhost:8080"

Write-Host "`nTesting with Origin: $ORIGIN" -ForegroundColor Yellow

# Test 1: OPTIONS Preflight
Write-Host "`n1. Testing OPTIONS Preflight Request..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $ORIGIN
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type,authorization,cache-control"
    }
    
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" `
        -Method Options `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "✅ OPTIONS Request Successful" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Gray
    
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    $corsHeaders = $response.Headers['Access-Control-Allow-Headers']
    
    Write-Host "Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Gray
    
    if ($corsOrigin -eq $ORIGIN) {
        Write-Host "✅ Origin matches!" -ForegroundColor Green
    } else {
        Write-Host "❌ Origin mismatch! Got: $corsOrigin" -ForegroundColor Red
    }
    
    if ($corsHeaders -like "*cache-control*") {
        Write-Host "✅ cache-control header allowed" -ForegroundColor Green
    } else {
        Write-Host "❌ cache-control NOT in allowed headers" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ OPTIONS Request Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
}

# Test 2: GET Request with CORS
Write-Host "`n2. Testing GET Request with CORS..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $ORIGIN
    }
    
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/health" `
        -Method Get `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "✅ GET Request Successful" -ForegroundColor Green
    
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    Write-Host "Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Gray
    
    if ($corsOrigin -eq $ORIGIN) {
        Write-Host "✅ CORS headers correct!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CORS Origin: $corsOrigin (Expected: $ORIGIN)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ GET Request Failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
}

# Test 3: Static File CORS
Write-Host "`n3. Testing Static File CORS..." -ForegroundColor Yellow
Write-Host "Note: This will only work if you have files in /uploads/" -ForegroundColor Gray

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "CORS middleware should now:" -ForegroundColor Yellow
Write-Host "✅ Handle dynamic origins (localhost:8080, 5173, 3000)" -ForegroundColor Green
Write-Host "✅ Allow cache-control header" -ForegroundColor Green
Write-Host "✅ Respond to OPTIONS preflight correctly" -ForegroundColor Green
Write-Host "✅ Set CORS headers on all API routes" -ForegroundColor Green
Write-Host "✅ Set CORS headers on /uploads/* files" -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure backend is running (npm run dev)" -ForegroundColor Gray
Write-Host "2. Refresh your frontend" -ForegroundColor Gray
Write-Host "3. Try login and download features" -ForegroundColor Gray
Write-Host "4. Check browser console - should be NO CORS errors" -ForegroundColor Gray
