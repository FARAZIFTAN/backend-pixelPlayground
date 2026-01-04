# Test user registration
Write-Host "Testing admin registration..." -ForegroundColor Cyan

$registerData = @{
    name = "Admin User 4"
    email = "admin4@gmail.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    $content = $response.Content
    Write-Host "Registration successful!" -ForegroundColor Green
    Write-Host "Response: $content" -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    Write-Host "Registration failed with status $statusCode" -ForegroundColor Red
    Write-Host "Response: $content" -ForegroundColor Red
}