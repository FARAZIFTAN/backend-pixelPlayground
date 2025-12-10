# Check current public IP and MongoDB Atlas access setup
Write-Host "🌐 Checking your public IP address..." -ForegroundColor Cyan

try {
    $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
    Write-Host "✅ Your current public IP: $publicIP" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Follow these steps to add your IP to MongoDB Atlas:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to: https://cloud.mongodb.com/" -ForegroundColor White
    Write-Host "2. Login and select your project" -ForegroundColor White
    Write-Host "3. Click 'Network Access' in the left sidebar" -ForegroundColor White
    Write-Host "4. Click 'Add IP Address' button" -ForegroundColor White
    Write-Host "5. Enter your IP: $publicIP" -ForegroundColor Green
    Write-Host "   OR click 'Allow Access from Anywhere' (0.0.0.0/0) for development" -ForegroundColor Yellow
    Write-Host "6. Click 'Confirm' and wait for it to become Active" -ForegroundColor White
    Write-Host ""
    Write-Host "WARNING: If using dynamic IP, use 0.0.0.0/0 instead" -ForegroundColor Yellow
    Write-Host "   But remember to restrict it in production!" -ForegroundColor Red
    Write-Host ""
    
    # Test MongoDB connection
    Write-Host "🔄 Testing MongoDB connection..." -ForegroundColor Cyan
    node test-mongodb.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SUCCESS! MongoDB is now accessible!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Still cannot connect. Please add your IP to MongoDB Atlas." -ForegroundColor Red
        Write-Host "Your IP: $publicIP" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error checking IP: $_" -ForegroundColor Red
}
