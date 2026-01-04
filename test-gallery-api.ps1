# Test Gallery API
# Pastikan server backend sudah running

$BASE_URL = "http://localhost:3000"

# Login dulu untuk mendapatkan token
Write-Host "=== Testing Gallery API ===" -ForegroundColor Cyan

# Ganti dengan credentials user yang sudah ada
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "`n1. Login to get token..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    $token = $loginResponse.data.token
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    Write-Host "Please update credentials in script" -ForegroundColor Yellow
    exit
}

# Headers for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Get My Gallery
Write-Host "`n2. Getting My Gallery (private photos)..." -ForegroundColor Yellow
try {
    $myPhotos = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/my-photos?page=1&limit=5" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ My Gallery retrieved" -ForegroundColor Green
    Write-Host "Total photos: $($myPhotos.data.pagination.total)" -ForegroundColor Gray
    
    if ($myPhotos.data.photos.Count -gt 0) {
        $firstPhoto = $myPhotos.data.photos[0]
        $photoId = $firstPhoto._id
        Write-Host "First photo: $($firstPhoto.title)" -ForegroundColor Gray
        Write-Host "Photo ID: $photoId" -ForegroundColor Gray
        Write-Host "Is Public: $($firstPhoto.isPublic)" -ForegroundColor Gray
        Write-Host "Views: $($firstPhoto.views), Likes: $($firstPhoto.likes)" -ForegroundColor Gray
    } else {
        Write-Host "No photos in gallery yet" -ForegroundColor Yellow
        Write-Host "Create a composite first to test gallery features" -ForegroundColor Yellow
        exit
    }
} catch {
    Write-Host "❌ Failed to get my gallery: $_" -ForegroundColor Red
    exit
}

# Test 2: Toggle Visibility (make it public)
Write-Host "`n3. Toggle photo visibility to PUBLIC..." -ForegroundColor Yellow
try {
    $toggleResponse = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/$photoId/toggle-visibility" `
        -Method Patch `
        -Headers $headers
    
    Write-Host "✅ $($toggleResponse.message)" -ForegroundColor Green
    Write-Host "Is Public: $($toggleResponse.data.isPublic)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to toggle visibility: $_" -ForegroundColor Red
}

# Test 3: Get Public Gallery
Write-Host "`n4. Getting Public Gallery..." -ForegroundColor Yellow
try {
    $publicGallery = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/public?sortBy=createdAt&limit=5" `
        -Method Get
    
    Write-Host "✅ Public Gallery retrieved" -ForegroundColor Green
    Write-Host "Total public photos: $($publicGallery.data.pagination.total)" -ForegroundColor Gray
    
    if ($publicGallery.data.photos.Count -gt 0) {
        Write-Host "`nPublic Photos:" -ForegroundColor Cyan
        foreach ($photo in $publicGallery.data.photos) {
            Write-Host "  - $($photo.title) | Views: $($photo.views) | Likes: $($photo.likes)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Failed to get public gallery: $_" -ForegroundColor Red
}

# Test 4: Increment View
Write-Host "`n5. Incrementing view count..." -ForegroundColor Yellow
try {
    $viewResponse = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/$photoId/view" `
        -Method Post
    
    Write-Host "✅ View incremented" -ForegroundColor Green
    Write-Host "Total views: $($viewResponse.data.views)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to increment view: $_" -ForegroundColor Red
}

# Test 5: Like Photo
Write-Host "`n6. Liking photo..." -ForegroundColor Yellow
try {
    $likeResponse = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/$photoId/like" `
        -Method Post
    
    Write-Host "✅ Photo liked" -ForegroundColor Green
    Write-Host "Total likes: $($likeResponse.data.likes)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to like photo: $_" -ForegroundColor Red
}

# Test 6: Get Most Liked Photos
Write-Host "`n7. Getting most liked photos..." -ForegroundColor Yellow
try {
    $mostLiked = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/public?sortBy=likes&order=desc&limit=3" `
        -Method Get
    
    Write-Host "✅ Most liked photos retrieved" -ForegroundColor Green
    if ($mostLiked.data.photos.Count -gt 0) {
        Write-Host "`nTop Liked Photos:" -ForegroundColor Cyan
        foreach ($photo in $mostLiked.data.photos) {
            Write-Host "  - $($photo.title) | Likes: $($photo.likes) | Views: $($photo.views)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Failed to get most liked: $_" -ForegroundColor Red
}

# Test 7: Set Visibility to PRIVATE
Write-Host "`n8. Setting photo back to PRIVATE..." -ForegroundColor Yellow
try {
    $setPrivate = @{
        isPublic = $false
    } | ConvertTo-Json
    
    $privateResponse = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/$photoId/toggle-visibility" `
        -Method Put `
        -Headers $headers `
        -Body $setPrivate
    
    Write-Host "✅ $($privateResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set private: $_" -ForegroundColor Red
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host "`nAPI Documentation: See GALLERY-API.md" -ForegroundColor Yellow
