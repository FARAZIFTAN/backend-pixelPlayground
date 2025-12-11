# Delete Composite Feature

## Overview
Fitur delete untuk menghapus foto composite dari gallery beserta file-nya dari database dan filesystem.

## Implementation

### Frontend (MyGallery.tsx)
1. **Delete Button**: Tombol trash icon merah di setiap card foto
2. **Confirmation Dialog**: Dialog konfirmasi dengan preview foto yang akan dihapus
3. **Loading State**: Spinner saat proses delete berlangsung
4. **Success/Error Handling**: Toast notification untuk feedback

### Backend API
**Endpoint**: `DELETE /api/composites/[id]`

**Authentication**: Bearer token required

**Process**:
1. Verify user ownership
2. Delete composite image file from filesystem
3. Delete thumbnail file (if exists)
4. Delete from Photo collection (gallery)
5. Update PhotoSession reference
6. Delete composite from database

**Response**:
```json
{
  "success": true,
  "message": "Composite deleted successfully"
}
```

## Testing

### Manual Test
1. Login ke aplikasi
2. Buka "My Gallery"
3. Klik tombol trash (merah) pada foto
4. Konfirmasi delete di dialog
5. Foto akan hilang dari gallery

### API Test
```powershell
.\test-delete-composite.ps1
```

Script akan:
- Login dengan akun admin
- Ambil daftar composite
- Tanya konfirmasi untuk delete
- Delete composite pertama
- Verify bahwa composite sudah terhapus (404)

## Security
- ✅ JWT authentication required
- ✅ Owner verification (user can only delete their own photos)
- ✅ File system cleanup
- ✅ Database cleanup (cascading delete)

## Error Handling
- 401: Unauthorized (no token or invalid token)
- 404: Composite not found or unauthorized
- 500: Server error during deletion

## Files Modified/Created

### Frontend
- `src/services/api.ts` - Added deleteComposite method
- `src/pages/MyGallery.tsx` - Added delete button and confirmation dialog

### Backend
- `src/app/api/composites/[id]/route.ts` - New DELETE endpoint

### Testing
- `test-delete-composite.ps1` - PowerShell test script
