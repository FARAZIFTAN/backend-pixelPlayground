# Test admin login with test user
Write-Host "Testing login with test user..." -ForegroundColor Cyan

$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $content = $response.Content
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Response: $content" -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    $content = $_.Exception.Response.Content
    Write-Host "Login failed with status $statusCode" -ForegroundColor Red
    Write-Host "Response: $content" -ForegroundColor Red
}