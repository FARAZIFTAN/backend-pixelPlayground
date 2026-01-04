# Test User Settings API

Write-Host "=== Testing User Settings API ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3001"
$testEmail = "didit@gmail.com"
$testPassword = "12345678"

# Login first to get token
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers with token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Get current settings
Write-Host "2. Getting current settings..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/settings" -Method Get -Headers $headers
    Write-Host "✓ Settings retrieved successfully!" -ForegroundColor Green
    Write-Host "Notifications:" -ForegroundColor Cyan
    Write-Host "  - Email Notifications: $($getResponse.data.notifications.emailNotifications)" -ForegroundColor Gray
    Write-Host "  - Template Alerts: $($getResponse.data.notifications.templateAlerts)" -ForegroundColor Gray
    Write-Host "  - Weekly Reports: $($getResponse.data.notifications.weeklyReports)" -ForegroundColor Gray
    Write-Host "Theme:" -ForegroundColor Cyan
    Write-Host "  - Theme: $($getResponse.data.theme.theme)" -ForegroundColor Gray
    Write-Host "  - Language: $($getResponse.data.theme.language)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Get settings failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Update notification settings
Write-Host "3. Updating notification settings..." -ForegroundColor Yellow
$notificationBody = @{
    type = "notifications"
    settings = @{
        emailNotifications = $true
        templateAlerts = $false
        weeklyReports = $true
    }
} | ConvertTo-Json

try {
    $updateNotifResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/settings" -Method Put -Body $notificationBody -Headers $headers
    Write-Host "✓ Notification settings updated!" -ForegroundColor Green
    Write-Host "Response: $($updateNotifResponse.message)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Update notifications failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Update theme settings
Write-Host "4. Updating theme settings..." -ForegroundColor Yellow
$themeBody = @{
    type = "theme"
    settings = @{
        theme = "dark"
        language = "id"
    }
} | ConvertTo-Json

try {
    $updateThemeResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/settings" -Method Put -Body $themeBody -Headers $headers
    Write-Host "✓ Theme settings updated!" -ForegroundColor Green
    Write-Host "Response: $($updateThemeResponse.message)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Update theme failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Verify updates
Write-Host "5. Verifying settings were saved..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/settings" -Method Get -Headers $headers
    Write-Host "✓ Settings verified!" -ForegroundColor Green
    Write-Host "Notifications:" -ForegroundColor Cyan
    Write-Host "  - Email Notifications: $($verifyResponse.data.notifications.emailNotifications)" -ForegroundColor Gray
    Write-Host "  - Template Alerts: $($verifyResponse.data.notifications.templateAlerts)" -ForegroundColor Gray
    Write-Host "  - Weekly Reports: $($verifyResponse.data.notifications.weeklyReports)" -ForegroundColor Gray
    Write-Host "Theme:" -ForegroundColor Cyan
    Write-Host "  - Theme: $($verifyResponse.data.theme.theme)" -ForegroundColor Gray
    Write-Host "  - Language: $($verifyResponse.data.theme.language)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Verify settings failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== Test Completed ===" -ForegroundColor Cyan
