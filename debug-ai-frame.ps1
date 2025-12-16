# Debug AI Frame API - Test specific request

$baseUrl = "http://localhost:3001/api"

Write-Host "`n=== Debug: Testing Generate Frame API ===" -ForegroundColor Cyan

# Test 1: Valid request
Write-Host "`n[Test 1] Valid Request" -ForegroundColor Yellow
$validBody = @{
    frameCount = 3
    layout = "vertical"
    backgroundColor = "#4A90E2"
    borderColor = "#2E5C8A"
    gradientFrom = "#4A90E2"
    gradientTo = "#2E5C8A"
    borderThickness = 2
    borderRadius = 8
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host $validBody

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $validBody
    
    Write-Host "`n[OK] Response received:" -ForegroundColor Green
    Write-Host "Success: $($response.success)"
    Write-Host "Content Type: $($response.contentType)"
    if ($response.image) {
        Write-Host "Image Length: $($response.image.Length)"
    }
} catch {
    Write-Host "`n[ERROR]" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:"
        Write-Host $_.ErrorDetails.Message
    }
}

# Test 2: Missing gradientFrom/gradientTo (should still work)
Write-Host "`n`n[Test 2] Without Gradient" -ForegroundColor Yellow
$noGradientBody = @{
    frameCount = 2
    layout = "horizontal"
    backgroundColor = "#FFD700"
    borderColor = "#FFA500"
    borderThickness = 2
    borderRadius = 8
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host $noGradientBody

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $noGradientBody
    
    Write-Host "`n[OK] Response received:" -ForegroundColor Green
    Write-Host "Success: $($response.success)"
} catch {
    Write-Host "`n[ERROR]" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:"
        Write-Host $_.ErrorDetails.Message
    }
}

# Test 3: Invalid frameCount (should fail with 400)
Write-Host "`n`n[Test 3] Invalid FrameCount (10)" -ForegroundColor Yellow
$invalidBody = @{
    frameCount = 10
    layout = "vertical"
    backgroundColor = "#FFD700"
    borderColor = "#FFA500"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host $invalidBody

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $invalidBody
    
    Write-Host "`n[UNEXPECTED] Should have failed but succeeded" -ForegroundColor Red
} catch {
    Write-Host "`n[EXPECTED ERROR]" -ForegroundColor Green
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    if ($_.ErrorDetails.Message) {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error: $($errorData.error)"
        Write-Host "Details: $($errorData.details)"
    }
}

# Test 4: Missing required field (should fail with 400)
Write-Host "`n`n[Test 4] Missing Required Field (borderColor)" -ForegroundColor Yellow
$missingFieldBody = @{
    frameCount = 3
    layout = "vertical"
    backgroundColor = "#FFD700"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host $missingFieldBody

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $missingFieldBody
    
    Write-Host "`n[UNEXPECTED] Should have failed but succeeded" -ForegroundColor Red
} catch {
    Write-Host "`n[EXPECTED ERROR]" -ForegroundColor Green
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Response:"
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`n`n=== Debug Tests Complete ===" -ForegroundColor Cyan
