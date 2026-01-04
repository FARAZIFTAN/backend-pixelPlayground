# Quick Payment Cleanup - Manual Method
# Copy your token from browser (F12 > Application > Session Storage > token)

Write-Host "=== Quick Payment Cleanup ===" -ForegroundColor Cyan
Write-Host "`nInstructions:" -ForegroundColor Yellow
Write-Host "1. Open browser DevTools (F12)"
Write-Host "2. Go to: Application > Session Storage > http://localhost:8080"
Write-Host "3. Copy the 'token' value"
Write-Host "4. Paste it below`n"

$token = Read-Host "Paste your token here"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "`n❌ No token provided. Exiting..." -ForegroundColor Red
    exit
}

Write-Host "`n📡 Fetching your payments..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Get payments
    $getResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payments" -Method GET -Headers $headers
    
    Write-Host "✅ Found $($getResponse.payments.Count) total payments`n" -ForegroundColor Green
    
    # Filter pending payments
    $pending = $getResponse.payments | Where-Object { $_.status -in @('pending_payment', 'pending_verification') }
    
    if ($pending.Count -eq 0) {
        Write-Host "✅ No pending payments. You're all set!" -ForegroundColor Green
        Write-Host "`n💡 You can now click 'Upgrade Sekarang' to create new payment." -ForegroundColor Cyan
        exit
    }
    
    Write-Host "📋 Pending Payments:" -ForegroundColor Yellow
    foreach ($p in $pending) {
        Write-Host "`n  Payment ID: $($p._id)"
        Write-Host "  Package: $($p.packageName) ($($p.packageType))"
        Write-Host "  Amount: Rp $($p.amount)"
        Write-Host "  Status: $($p.status)"
        
        # Check if old type
        if ($p.packageType -notin @('pro')) {
            Write-Host "  ⚠️  OLD TYPE - Deleting..." -ForegroundColor Red
            
            try {
                $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payments/$($p._id)/cancel" -Method DELETE -Headers $headers
                Write-Host "  ✅ Deleted successfully!" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "  ✅ Valid 'pro' payment" -ForegroundColor Green
        }
    }
    
    Write-Host "`n✅ Cleanup complete! Refresh your browser." -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure backend is running on http://localhost:3001" -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
