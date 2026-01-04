# Test Delete Composite API
# Usage: .\test-delete-composite.ps1

$baseUrl = "http://localhost:3001/api"

Write-Host "=== Testing Delete Composite API ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get token
Write-Host "Step 1: Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@pixelplayground.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get composites list
Write-Host "Step 2: Get composites list..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $composites = Invoke-RestMethod -Uri "$baseUrl/composites?limit=10" -Method GET -Headers $headers
    Write-Host "✓ Found $($composites.data.composites.Count) composites" -ForegroundColor Green
    
    if ($composites.data.composites.Count -eq 0) {
        Write-Host "⚠ No composites found to delete. Please create a composite first." -ForegroundColor Yellow
        exit 0
    }
    
    # Show first composite
    $firstComposite = $composites.data.composites[0]
    Write-Host ""
    Write-Host "First composite:" -ForegroundColor Gray
    Write-Host "  ID: $($firstComposite._id)" -ForegroundColor Gray
    Write-Host "  URL: $($firstComposite.compositeUrl)" -ForegroundColor Gray
    Write-Host "  Created: $($firstComposite.createdAt)" -ForegroundColor Gray
    Write-Host ""
    
    # Ask for confirmation
    $confirm = Read-Host "Do you want to delete this composite? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Delete cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    # Step 3: Delete composite
    Write-Host ""
    Write-Host "Step 3: Deleting composite..." -ForegroundColor Yellow
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/composites/$($firstComposite._id)" -Method DELETE -Headers $headers
    Write-Host "✓ Composite deleted successfully" -ForegroundColor Green
    Write-Host "Response: $($deleteResponse.message)" -ForegroundColor Gray
    Write-Host ""
    
    # Step 4: Verify deletion
    Write-Host "Step 4: Verifying deletion..." -ForegroundColor Yellow
    try {
        $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/composites/$($firstComposite._id)" -Method GET -Headers $headers
        Write-Host "✗ Composite still exists (this should not happen)" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✓ Composite successfully deleted (404 confirmed)" -ForegroundColor Green
        } else {
            Write-Host "⚠ Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "=== Test completed ===" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}
