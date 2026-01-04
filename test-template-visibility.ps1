# Test Template Visibility Filtering
# Tests GET /api/templates with visibility filtering (public vs private)

Write-Host "`n=== Testing Template Visibility Filtering ===" -ForegroundColor Cyan
Write-Host "Testing public/private template filtering`n" -ForegroundColor Yellow

# Configuration
$baseUrl = "http://localhost:3001/api"
$loginUrl = "$baseUrl/auth/login"
$templatesUrl = "$baseUrl/templates"

# Test user credentials
$email = "admin@example.com"
$password = "admin123"

# Step 1: Test UNAUTHENTICATED request (should only see public templates)
Write-Host "[1/3] Testing UNAUTHENTICATED request..." -ForegroundColor Cyan
Write-Host "   Should only return public templates" -ForegroundColor Gray

try {
    $unauthResponse = Invoke-RestMethod -Uri $templatesUrl -Method GET
    $publicCount = $unauthResponse.data.templates.Count
    $hasPrivate = ($unauthResponse.data.templates | Where-Object { $_.visibility -eq "private" }).Count -gt 0
    
    Write-Host "   ✅ Request successful!" -ForegroundColor Green
    Write-Host "   Total templates: $publicCount" -ForegroundColor Gray
    
    if ($hasPrivate) {
        Write-Host "   ⚠️  WARNING: Found private templates in unauthenticated response!" -ForegroundColor Red
    } else {
        Write-Host "   ✅ All templates are public (as expected)" -ForegroundColor Green
    }
    
    # Show template details
    Write-Host "`n   Templates:" -ForegroundColor Gray
    foreach ($template in $unauthResponse.data.templates | Select-Object -First 5) {
        $visibilityColor = if ($template.visibility -eq "public") { "Green" } else { "Red" }
        Write-Host "   - $($template.name) | Visibility: $($template.visibility) | AI: $($template.isAIGenerated)" -ForegroundColor $visibilityColor
    }
} catch {
    Write-Host "   ❌ Request failed: $_" -ForegroundColor Red
}

# Step 2: Login to get token
Write-Host "`n[2/3] Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   User ID: $($loginResponse.user._id)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Test AUTHENTICATED request (should see public + user's private templates)
Write-Host "`n[3/3] Testing AUTHENTICATED request..." -ForegroundColor Cyan
Write-Host "   Should return public templates + user's private templates" -ForegroundColor Gray

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $authResponse = Invoke-RestMethod -Uri $templatesUrl -Method GET -Headers $headers
    $totalCount = $authResponse.data.templates.Count
    $publicTemplates = ($authResponse.data.templates | Where-Object { $_.visibility -eq "public" }).Count
    $privateTemplates = ($authResponse.data.templates | Where-Object { $_.visibility -eq "private" }).Count
    $aiTemplates = ($authResponse.data.templates | Where-Object { $_.isAIGenerated -eq $true }).Count
    
    Write-Host "   ✅ Request successful!" -ForegroundColor Green
    Write-Host "`n   📊 Statistics:" -ForegroundColor Cyan
    Write-Host "   - Total templates: $totalCount" -ForegroundColor Gray
    Write-Host "   - Public templates: $publicTemplates" -ForegroundColor Green
    Write-Host "   - Private templates: $privateTemplates" -ForegroundColor Magenta
    Write-Host "   - AI-generated: $aiTemplates" -ForegroundColor Yellow
    
    # Show some templates
    Write-Host "`n   📋 Sample Templates:" -ForegroundColor Cyan
    foreach ($template in $authResponse.data.templates | Select-Object -First 10) {
        $icon = if ($template.isAIGenerated) { "🤖" } else { "📸" }
        $visibilityIcon = if ($template.visibility -eq "public") { "🌍" } else { "🔒" }
        $visibilityColor = if ($template.visibility -eq "public") { "Green" } else { "Magenta" }
        
        Write-Host "   $icon $visibilityIcon $($template.name)" -ForegroundColor $visibilityColor
        Write-Host "      Category: $($template.category) | Frames: $($template.frameCount) | Visibility: $($template.visibility)" -ForegroundColor Gray
    }
    
    # Comparison with unauthenticated
    if ($totalCount -gt $publicCount) {
        $difference = $totalCount - $publicCount
        Write-Host "`n   ✨ Authenticated user sees $difference more template(s) than unauthenticated users" -ForegroundColor Green
    } else {
        Write-Host "`n   ℹ️  No additional private templates for this user" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ Request failed: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✨ Visibility filtering test completed!" -ForegroundColor Green
Write-Host "`nKey Points:" -ForegroundColor Yellow
Write-Host "1. Unauthenticated users: Only see public templates" -ForegroundColor Gray
Write-Host "2. Authenticated users: See public templates + their own private templates" -ForegroundColor Gray
Write-Host "3. AI-generated templates can be public or private" -ForegroundColor Gray
