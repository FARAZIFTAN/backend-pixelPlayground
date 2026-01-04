# Simple login test
Write-Host "Testing admin login..." -ForegroundColor Cyan

$loginData = @{
    email = "admin5@gmail.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Sending login request..." -ForegroundColor Yellow
Write-Host "Data: $loginData" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $statusCode = $response.StatusCode
    $content = $response.Content

    Write-Host "Status Code: $statusCode" -ForegroundColor Green
    Write-Host "Response: $content" -ForegroundColor White

    $result = $content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "Login successful!" -ForegroundColor Green
        $token = $result.data.token
        Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan
    } else {
        Write-Host "Login failed: $($result.message)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    Write-Host "Error Status Code: $statusCode" -ForegroundColor Red
    Write-Host "Error Response: $content" -ForegroundColor Red
}