# Test Payment Flow - Quick Fix
Write-Host "=== Testing Payment Flow ===" -ForegroundColor Cyan

# Get token from session (check browser dev tools)
Write-Host "`n1. Please paste your auth token (from browser sessionStorage):"
$token = Read-Host "Token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token is required" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Getting user payments..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/payments" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Found $($data.payments.Count) payments" -ForegroundColor Green
    
    # Show pending payments
    $pendingPayments = $data.payments | Where-Object { $_.status -in @('pending_payment', 'pending_verification') }
    
    if ($pendingPayments.Count -gt 0) {
        Write-Host "`n📋 Pending Payments:" -ForegroundColor Yellow
        foreach ($payment in $pendingPayments) {
            Write-Host "  - ID: $($payment._id)" -ForegroundColor White
            Write-Host "    Type: $($payment.packageType)" -ForegroundColor Gray
            Write-Host "    Status: $($payment.status)" -ForegroundColor Gray
            Write-Host "    Amount: Rp $($payment.amount)" -ForegroundColor Gray
            
            # Check if old package type
            if ($payment.packageType -notin @('pro')) {
                Write-Host "    ⚠️  OLD PACKAGE TYPE - Will be deleted" -ForegroundColor Red
                
                # Delete this payment
                Write-Host "`n3. Deleting old payment..." -ForegroundColor Yellow
                try {
                    $deleteResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/payments/$($payment._id)/cancel" `
                        -Method DELETE `
                        -Headers @{
                            "Authorization" = "Bearer $token"
                            "Content-Type" = "application/json"
                        }
                    
                    Write-Host "✅ Payment deleted successfully" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Failed to delete: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "`n✅ No pending payments found" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
