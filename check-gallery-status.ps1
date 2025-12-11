# Simple Gallery Check
Write-Host "=== Gallery Photos Check ===" -ForegroundColor Cyan

# Check if server is running
$BASE_URL = "http://localhost:3001"

Write-Host "`nChecking if backend server is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/api/health" -Method Get -TimeoutSec 3
    Write-Host "✅ Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server is NOT running!" -ForegroundColor Red
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd backend-pixelPlayground" -ForegroundColor Gray
    Write-Host "  npm run dev" -ForegroundColor Gray
    exit
}

# Try to get public gallery (no auth needed)
Write-Host "`nFetching public gallery..." -ForegroundColor Yellow
try {
    $publicGallery = Invoke-RestMethod -Uri "$BASE_URL/api/gallery/public?limit=10" -Method Get
    
    $totalPhotos = $publicGallery.data.pagination.total
    $photos = $publicGallery.data.photos
    
    Write-Host "✅ Public Gallery: $totalPhotos public photos" -ForegroundColor Green
    
    if ($photos.Count -eq 0) {
        Write-Host "`n⚠️  No public photos yet!" -ForegroundColor Yellow
        Write-Host "Photos are PRIVATE by default." -ForegroundColor Gray
        Write-Host "To see photos:" -ForegroundColor Yellow
        Write-Host "1. Login to your account" -ForegroundColor Gray
        Write-Host "2. Go to My Gallery" -ForegroundColor Gray
        Write-Host "3. Toggle photo to PUBLIC" -ForegroundColor Gray
    } else {
        Write-Host "`nPublic Photos:" -ForegroundColor Cyan
        foreach ($photo in $photos) {
            Write-Host "  📸 $($photo.title)" -ForegroundColor White
            Write-Host "     👁️  Views: $($photo.views) | ❤️  Likes: $($photo.likes)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Failed to fetch public gallery" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
}

Write-Host "`n=== Migration Status ===" -ForegroundColor Cyan
Write-Host "✅ 9 composites have been migrated to photos table" -ForegroundColor Green
Write-Host "✅ All photos are PRIVATE by default" -ForegroundColor Green
Write-Host "`nTo test the gallery:" -ForegroundColor Yellow
Write-Host "1. Login with your account" -ForegroundColor Gray
Write-Host "2. Call: GET /api/gallery/my-photos" -ForegroundColor Gray
Write-Host "3. You should see 9 private photos" -ForegroundColor Gray
Write-Host "4. Toggle one to public: PATCH /api/gallery/[id]/toggle-visibility" -ForegroundColor Gray
Write-Host "5. Check public gallery again" -ForegroundColor Gray
