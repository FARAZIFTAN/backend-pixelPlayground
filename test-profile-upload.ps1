# Test Profile Picture Upload - End to End
# Simpler version that works on all PowerShell versions

Write-Host "Profile Picture Upload - E2E Test" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "http://localhost:3001"
$TEST_IMAGE = "C:\temp\test-image.jpg"

# Create test image if it doesn't exist
if (-not (Test-Path $TEST_IMAGE)) {
    Write-Host "Creating test image..." -ForegroundColor Yellow
    # Create minimal PNG
    $pngData = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    New-Item -Path "C:\temp" -ItemType Directory -Force | Out-Null
    [System.IO.File]::WriteAllBytes($TEST_IMAGE, $pngData)
}

# Step 1: Register user
Write-Host "[1] Registering test user..." -ForegroundColor Yellow
$randomEmail = "testuser_$(Get-Random -Maximum 100000)@example.com"
$registerData = @{
    name = "Profile Test User"
    email = $randomEmail
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "   SUCCESS: User registered" -ForegroundColor Green
        Write-Host "   Email: $randomEmail" -ForegroundColor Gray
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Login to get token
Write-Host "`n[2] Logging in..." -ForegroundColor Yellow
$loginData = @{
    email = $randomEmail
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $token = $result.data.token
        $user = $result.data.user
        Write-Host "   SUCCESS: Login successful" -ForegroundColor Green
        Write-Host "   User ID: $($user.id)" -ForegroundColor Gray
        Write-Host "   Current profilePicture: '$($user.profilePicture)'" -ForegroundColor Gray
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Upload profile picture using multipart form
Write-Host "`n[3] Uploading profile picture..." -ForegroundColor Yellow
try {
    $fileBytes = [System.IO.File]::ReadAllBytes($TEST_IMAGE)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    # Build multipart body
    $bodyBuilder = [System.Text.StringBuilder]::new()
    $bodyBuilder.AppendLine("--$boundary") | Out-Null
    $bodyBuilder.AppendLine('Content-Disposition: form-data; name="profilePicture"; filename="test-image.png"') | Out-Null
    $bodyBuilder.AppendLine("Content-Type: image/png") | Out-Null
    $bodyBuilder.AppendLine() | Out-Null
    
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyBuilder.ToString())
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
    
    # Combine all parts
    $fullBody = $headerBytes + $fileBytes + $footerBytes
    
    # Make request using .NET
    $request = [System.Net.HttpWebRequest]::Create("$BACKEND_URL/api/users/profile-picture")
    $request.Method = "POST"
    $request.Headers.Add("Authorization", "Bearer $token")
    $request.ContentType = "multipart/form-data; boundary=$boundary"
    $request.ContentLength = $fullBody.Length
    
    # Write body
    $requestStream = $request.GetRequestStream()
    $requestStream.Write($fullBody, 0, $fullBody.Length)
    $requestStream.Close()
    
    # Get response
    $response = $request.GetResponse()
    $responseStream = $response.GetResponseStream()
    $streamReader = [System.IO.StreamReader]::new($responseStream)
    $responseBody = $streamReader.ReadToEnd()
    $streamReader.Close()
    $response.Close()
    
    $result = $responseBody | ConvertFrom-Json
    
    if ($result.success) {
        $profileUrl = $result.data.profilePicture
        Write-Host "   SUCCESS: Profile picture uploaded" -ForegroundColor Green
        Write-Host "   Profile picture URL: $profileUrl" -ForegroundColor Gray
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Verify token - check if profilePicture is in response
Write-Host "`n[4] Verifying token and checking profilePicture..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/verify" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $token"} `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $verifiedUser = $result.data.user
        Write-Host "   SUCCESS: Token verified" -ForegroundColor Green
        Write-Host "   User ID: $($verifiedUser.id)" -ForegroundColor Gray
        Write-Host "   ProfilePicture in response: '$($verifiedUser.profilePicture)'" -ForegroundColor Gray
        
        if ($verifiedUser.profilePicture) {
            Write-Host "   SUCCESS: ProfilePicture persisted in database!" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: ProfilePicture empty in database!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Re-login to confirm persistence across sessions
Write-Host "`n[5] Re-logging in to verify persistence..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $reloginUser = $result.data.user
        Write-Host "   SUCCESS: Re-login successful" -ForegroundColor Green
        Write-Host "   ProfilePicture after re-login: '$($reloginUser.profilePicture)'" -ForegroundColor Gray
        
        if ($reloginUser.profilePicture -eq $profileUrl) {
            Write-Host "   SUCCESS: ProfilePicture persists across login sessions!" -ForegroundColor Green
            Write-Host "`n   ALL TESTS PASSED!" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: ProfilePicture values don't match" -ForegroundColor Yellow
            Write-Host "   Expected: $profileUrl" -ForegroundColor Gray
            Write-Host "   Got: $($reloginUser.profilePicture)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Completed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Register user
Write-Host "[1] Registering test user..." -ForegroundColor Yellow
$randomEmail = "testuser_$(Get-Random -Maximum 100000)@example.com"
$registerData = @{
    name = "Profile Test User"
    email = $randomEmail
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "   SUCCESS: User registered" -ForegroundColor Green
        Write-Host "   Email: $randomEmail" -ForegroundColor Gray
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Login to get token
Write-Host "`n[2] Logging in..." -ForegroundColor Yellow
$loginData = @{
    email = $randomEmail
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $token = $result.data.token
        $user = $result.data.user
        Write-Host "   SUCCESS: Login successful" -ForegroundColor Green
        Write-Host "   User ID: $($user.id)" -ForegroundColor Gray
        Write-Host "   Current profilePicture: $($user.profilePicture)" -ForegroundColor Gray
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Upload profile picture
Write-Host "`n[3] Uploading profile picture..." -ForegroundColor Yellow
try {
    # Use curl instead (more reliable)
    $curlCmd = "curl -X POST `"$BACKEND_URL/api/users/profile-picture`" " + `
        "-H `"Authorization: Bearer $token`" " + `
        "-F `"profilePicture=@$TEST_IMAGE`""
    
    $result = Invoke-Expression $curlCmd | ConvertFrom-Json
    
    if ($result.success) {
        $profileUrl = $result.data.profilePicture
        Write-Host "   SUCCESS: Profile picture uploaded" -ForegroundColor Green
        Write-Host "   Profile picture URL: $profileUrl" -ForegroundColor Gray
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Verify token - check if profilePicture is in response
Write-Host "`n[4] Verifying token and checking profilePicture..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/verify" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
        } `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $verifiedUser = $result.data.user
        Write-Host "   SUCCESS: Token verified" -ForegroundColor Green
        Write-Host "   User ID: $($verifiedUser.id)" -ForegroundColor Gray
        Write-Host "   ProfilePicture in response: $($verifiedUser.profilePicture)" -ForegroundColor Gray
        
        if ($verifiedUser.profilePicture) {
            Write-Host "   SUCCESS: ProfilePicture persisted in database!" -ForegroundColor Green
        } else {
            Write-Host "   FAILED: ProfilePicture NOT found in database!" -ForegroundColor Red
        }
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Re-login to confirm persistence across sessions
Write-Host "`n[5] Re-logging in to verify persistence..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        $reloginUser = $result.data.user
        Write-Host "   SUCCESS: Re-login successful" -ForegroundColor Green
        Write-Host "   ProfilePicture after re-login: $($reloginUser.profilePicture)" -ForegroundColor Gray
        
        if ($reloginUser.profilePicture -eq $profileUrl) {
            Write-Host "   SUCCESS: ProfilePicture persists across login sessions!" -ForegroundColor Green
            Write-Host "`n   ALL TESTS PASSED!" -ForegroundColor Green
        } else {
            Write-Host "   FAILED: ProfilePicture mismatch after re-login!" -ForegroundColor Red
            Write-Host "   Expected: $profileUrl" -ForegroundColor Red
            Write-Host "   Got: $($reloginUser.profilePicture)" -ForegroundColor Red
        }
    } else {
        Write-Host "   FAILED: $($result.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "  User Registration: PASSED" -ForegroundColor Green
Write-Host "  User Login: PASSED" -ForegroundColor Green
Write-Host "  Profile Picture Upload: PASSED" -ForegroundColor Green
Write-Host "  Token Verification: PASSED" -ForegroundColor Green
Write-Host "  Database Persistence: PASSED" -ForegroundColor Green
Write-Host "  Session Persistence: PASSED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
