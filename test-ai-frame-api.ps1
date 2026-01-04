# Test AI Frame Generator with PowerShell

# Base URL
$baseUrl = "http://localhost:3001/api"

Write-Host "`n=== Test 1: AI Chat ===" -ForegroundColor Cyan

# Test AI Chat
$chatBody = @{
    messages = @(
        @{
            role = "user"
            content = "Saya ingin frame dengan 3 foto vertikal, warna biru gradient"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $chatResponse = Invoke-RestMethod -Uri "$baseUrl/ai/chat" `
        -Method POST `
        -ContentType "application/json" `
        -Body $chatBody

    Write-Host "`n[OK] AI Chat Response:" -ForegroundColor Green
    Write-Host $chatResponse.message
    
    if ($chatResponse.frameSpec) {
        Write-Host "`n[OK] Frame Spec ditemukan:" -ForegroundColor Green
        Write-Host ($chatResponse.frameSpec | ConvertTo-Json -Depth 5)
    } else {
        Write-Host "`n[INFO] Frame Spec belum tersedia (user belum confirm)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n[ERROR] Error saat test AI Chat:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== Test 2: Generate Frame ===" -ForegroundColor Cyan

# Test Generate Frame
$frameBody = @{
    frameCount = 3
    layout = "vertical"
    backgroundColor = "#4A90E2"
    borderColor = "#2E5C8A"
    gradientFrom = "#4A90E2"
    gradientTo = "#2E5C8A"
    borderThickness = 2
    borderRadius = 8
} | ConvertTo-Json

try {
    $frameResponse = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $frameBody

    Write-Host "`n[OK] Frame Generated Successfully!" -ForegroundColor Green
    Write-Host "Success: $($frameResponse.success)"
    Write-Host "Content Type: $($frameResponse.contentType)"
    Write-Host "Image Size: $($frameResponse.image.Length) characters"
    
    # Save SVG to file
    $svgContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($frameResponse.image))
    $outputFile = "generated-frame-test.svg"
    $svgContent | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "`n[SAVED] Frame saved to: $outputFile" -ForegroundColor Green
    Write-Host "Buka file SVG tersebut di browser untuk melihat hasil!" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n[ERROR] Error saat generate frame:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== Test 3: Generate Frame with Invalid Data ===" -ForegroundColor Cyan

# Test validation
$invalidFrameBody = @{
    frameCount = 10  # Invalid: max 6
    layout = "invalid"  # Invalid layout
    backgroundColor = "blue"  # Invalid: bukan hex color
    borderColor = "#FF5733"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/ai/generate-frame" `
        -Method POST `
        -ContentType "application/json" `
        -Body $invalidFrameBody
    
    Write-Host "`n[ERROR] Validation should have failed but did not!" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails.Message) {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`n[OK] Validation berhasil menangkap error:" -ForegroundColor Green
        Write-Host "Error: $($errorResponse.error)"
        Write-Host "Details: $($errorResponse.details)"
    } else {
        Write-Host "`n[OK] Validation berhasil menangkap error:" -ForegroundColor Green
        Write-Host $_.Exception.Message
    }
}

Write-Host "`n=== Test Selesai ===" -ForegroundColor Cyan
Write-Host "`nCatatan:" -ForegroundColor Yellow
Write-Host "- Pastikan backend sudah running di http://localhost:3001" -ForegroundColor White
Write-Host "- Pastikan GROQ_API_KEY sudah di-set di .env (untuk AI Chat)" -ForegroundColor White
Write-Host "- Check file generated-frame-test.svg untuk melihat hasil" -ForegroundColor White
