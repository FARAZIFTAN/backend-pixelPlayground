# Check templates via API
Write-Host "Checking templates from API..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/templates" -Method GET -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json

    if ($result.success) {
        Write-Host "Templates found:" -ForegroundColor Green
        foreach ($template in $result.data) {
            Write-Host "  - $($template.name) (Active: $($template.isActive))" -ForegroundColor White
        }
    } else {
        Write-Host "API Error: $($result.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error calling API: $($_.Exception.Message)" -ForegroundColor Red
}