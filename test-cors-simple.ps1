# Test CORS - Simple Version
Write-Host "=== CORS Configuration Test ===" -ForegroundColor Cyan

$BASE_URL = "http://localhost:3001"
$ORIGIN = "http://localhost:8080"

Write-Host "`nTesting with Origin: $ORIGIN`n" -ForegroundColor Yellow

# Test OPTIONS Preflight
Write-Host "Test 1: OPTIONS Preflight..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $ORIGIN
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type,authorization,cache-control"
    }
    
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" -Method Options -Headers $headers -UseBasicParsing
    
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    $corsHeaders = $response.Headers['Access-Control-Allow-Headers']
    
    if ($corsOrigin -eq $ORIGIN) {
        Write-Host "  PASS - Origin matches: $corsOrigin" -ForegroundColor Green
    } else {
        Write-Host "  FAIL - Origin mismatch: $corsOrigin" -ForegroundColor Red
    }
    
    if ($corsHeaders -like "*cache-control*") {
        Write-Host "  PASS - cache-control header allowed" -ForegroundColor Green
    } else {
        Write-Host "  FAIL - cache-control NOT allowed" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test GET with CORS
Write-Host "`nTest 2: GET Request with CORS..." -ForegroundColor Yellow
try {
    $headers = @{ "Origin" = $ORIGIN }
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/health" -Method Get -Headers $headers -UseBasicParsing
    
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    
    if ($corsOrigin -eq $ORIGIN) {
        Write-Host "  PASS - CORS headers correct: $corsOrigin" -ForegroundColor Green
    } else {
        Write-Host "  WARN - Got origin: $corsOrigin" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Next: Restart backend and test in browser" -ForegroundColor Gray
