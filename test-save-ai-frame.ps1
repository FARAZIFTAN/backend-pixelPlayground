# Test Save AI Frame API
# Tests the /api/ai/save-frame endpoint with public and private visibility

Write-Host "`n=== Testing Save AI Frame API ===" -ForegroundColor Cyan
Write-Host "Testing save-frame endpoint with visibility settings`n" -ForegroundColor Yellow

# Configuration
$baseUrl = "http://localhost:3001/api"
$loginUrl = "$baseUrl/auth/login"
$saveFrameUrl = "$baseUrl/ai/save-frame"

# Test user credentials (adjust as needed)
$email = "admin@example.com"
$password = "admin123"

# Step 1: Login to get token
Write-Host "[1/3] Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Test saving PUBLIC frame
Write-Host "`n[2/3] Testing PUBLIC frame save..." -ForegroundColor Cyan

$publicFrameData = @{
    name = "Test Public Frame $(Get-Date -Format 'HH:mm:ss')"
    frameSpec = @{
        frameCount = 3
        layout = "vertical"
        theme = "Modern"
        backgroundColor = "#FDE2E4"
        borderColor = "#F7A9A8"
        gradientFrom = "#FFD1DC"
        gradientTo = "#FDE2E4"
        borderThickness = 2
        borderRadius = 12
    }
    frameDataUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIxMjAwIiBmaWxsPSIjRkRFMkU0Ii8+PC9zdmc+"
    visibility = "public"
    description = "A beautiful AI-generated frame for testing"
    tags = @("AI", "Modern", "Test", "Public")
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $publicResponse = Invoke-RestMethod -Uri $saveFrameUrl -Method POST -Body $publicFrameData -Headers $headers
    Write-Host "   ✅ PUBLIC frame saved successfully!" -ForegroundColor Green
    Write-Host "   Frame ID: $($publicResponse.template.id)" -ForegroundColor Gray
    Write-Host "   Name: $($publicResponse.template.name)" -ForegroundColor Gray
    Write-Host "   Visibility: $($publicResponse.template.visibility)" -ForegroundColor Green
    Write-Host "   AI Generated: $($publicResponse.template.isAIGenerated)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to save public frame:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Step 3: Test saving PRIVATE frame
Write-Host "`n[3/3] Testing PRIVATE frame save..." -ForegroundColor Cyan

$privateFrameData = @{
    name = "Test Private Frame $(Get-Date -Format 'HH:mm:ss')"
    frameSpec = @{
        frameCount = 4
        layout = "grid"
        theme = "Elegant"
        backgroundColor = "#E8F5E9"
        borderColor = "#81C784"
        gradientFrom = "#C8E6C9"
        gradientTo = "#E8F5E9"
        borderThickness = 3
        borderRadius = 8
    }
    frameDataUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI0U4RjVFOSIvPjwvc3ZnPg=="
    visibility = "private"
    description = "A private AI-generated frame for personal use"
    tags = @("AI", "Elegant", "Test", "Private")
} | ConvertTo-Json -Depth 10

try {
    $privateResponse = Invoke-RestMethod -Uri $saveFrameUrl -Method POST -Body $privateFrameData -Headers $headers
    Write-Host "   ✅ PRIVATE frame saved successfully!" -ForegroundColor Green
    Write-Host "   Frame ID: $($privateResponse.template.id)" -ForegroundColor Gray
    Write-Host "   Name: $($privateResponse.template.name)" -ForegroundColor Gray
    Write-Host "   Visibility: $($privateResponse.template.visibility)" -ForegroundColor Magenta
    Write-Host "   AI Generated: $($privateResponse.template.isAIGenerated)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to save private frame:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✨ Test completed!" -ForegroundColor Green
Write-Host "   - Login: ✅" -ForegroundColor Green
Write-Host "   - Public frame: Check above" -ForegroundColor Yellow
Write-Host "   - Private frame: Check above" -ForegroundColor Yellow
Write-Host "`nNote: You can verify the frames in MongoDB or by calling GET /api/templates" -ForegroundColor Gray
