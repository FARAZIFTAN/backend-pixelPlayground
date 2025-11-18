# Login as admin and get token
Write-Host "Logging in as admin..." -ForegroundColor Cyan

$loginData = @{
    email = "admin@gmail.com"
    password = "admin1234"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json

    if ($result.success) {
        $token = $result.data.token
        Write-Host "Login successful! Token received." -ForegroundColor Green

        # Now get all templates including inactive ones
        Write-Host "Getting all templates (including inactive)..." -ForegroundColor Cyan
        $headers = @{
            "Authorization" = "Bearer $token"
        }

        $templatesResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/templates?isActive=false" -Method GET -Headers $headers -UseBasicParsing
        $templatesResult = $templatesResponse.Content | ConvertFrom-Json

        if ($templatesResult.success) {
            Write-Host "All templates:" -ForegroundColor Green
            foreach ($template in $templatesResult.data.templates) {
                Write-Host "  - $($template.name) (Active: $($template.isActive), ID: $($template._id))" -ForegroundColor White
            }

            # Find Graduation template
            $graduationTemplate = $templatesResult.data.templates | Where-Object { $_.name -eq "Graduation" }
            if ($graduationTemplate) {
                Write-Host "Found Graduation template with ID: $($graduationTemplate._id)" -ForegroundColor Yellow

                # Update Graduation template to active
                Write-Host "Updating Graduation template to active..." -ForegroundColor Cyan
                $updateData = @{
                    isActive = $true
                } | ConvertTo-Json

                $updateResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/templates/$($graduationTemplate._id)" -Method PUT -Body $updateData -ContentType "application/json" -Headers $headers -UseBasicParsing
                $updateResult = $updateResponse.Content | ConvertFrom-Json

                if ($updateResult.success) {
                    Write-Host "Graduation template updated to active!" -ForegroundColor Green
                } else {
                    Write-Host "Failed to update template: $($updateResult.message)" -ForegroundColor Red
                }
            } else {
                Write-Host "Graduation template not found!" -ForegroundColor Red
            }
        } else {
            Write-Host "Failed to get templates: $($templatesResult.message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Login failed: $($result.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}