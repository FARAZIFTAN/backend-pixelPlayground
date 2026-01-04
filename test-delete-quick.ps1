# Quick Test Delete Composite
$baseUrl = "http://localhost:3001/api"

# Login
Write-Host "Login..." -ForegroundColor Yellow
$loginBody = @{ email = "admin@pixelplayground.com"; password = "admin123" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.data.token
Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor Green

# Get composites
Write-Host "`nGetting composites..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $token" }
$composites = Invoke-RestMethod -Uri "$baseUrl/composites?limit=5" -Method GET -Headers $headers
Write-Host "Found: $($composites.data.composites.Count) composites" -ForegroundColor Green

if ($composites.data.composites.Count -eq 0) {
    Write-Host "No composites to delete!" -ForegroundColor Red
    exit
}

$first = $composites.data.composites[0]
Write-Host "`nFirst composite:" -ForegroundColor Cyan
Write-Host "  ID: $($first._id)"
Write-Host "  URL: $($first.compositeUrl)"
Write-Host "  Created: $($first.createdAt)"

# Try to delete
Write-Host "`nAttempting delete..." -ForegroundColor Yellow
try {
    $deleteUrl = "$baseUrl/composites/$($first._id)"
    Write-Host "DELETE URL: $deleteUrl" -ForegroundColor Gray
    
    $result = Invoke-RestMethod -Uri $deleteUrl -Method DELETE -Headers $headers
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($result | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}
