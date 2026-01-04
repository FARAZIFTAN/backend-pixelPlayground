# Quick test for AI Frame API

$baseUrl = "http://localhost:3001/api"

Write-Host "`n=== Quick Test: Generate Frame ===" -ForegroundColor Cyan

$testBody = @{
    frameCount = 3
    layout = "vertical"
    backgroundColor = "#FFD700"
    borderColor = "#FFA500"
    gradientFrom = "#FFD700"
    gradientTo = "#FFA500"
    borderThickness = 2
    borderRadius = 8
} | ConvertTo-Json

Write-Host "`nRequest:" -ForegroundColor Yellow
Write-Host $testBody

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody
    
    Write-Host "`n[SUCCESS]" -ForegroundColor Green
    Write-Host "Frame generated successfully!"
    Write-Host "Success: $($response.success)"
    Write-Host "ContentType: $($response.contentType)"
    Write-Host "Image Length: $($response.image.Length) characters"
    
    # Save SVG
    $svgContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($response.image))
    $svgContent | Out-File -FilePath "quick-test-frame.svg" -Encoding UTF8
    Write-Host "`nFrame saved to: quick-test-frame.svg" -ForegroundColor Green
    Write-Host "Buka file dengan browser!" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n[FAILED]" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`n"
