# User-Generated Custom Frames Feature

## Overview
Fitur yang memungkinkan user membuat dan menyimpan custom frame menggunakan AI Template Creator. Frame yang dibuat hanya bisa dilihat oleh user yang membuat frame tersebut (private frames).

## Flow

### 1. Create Custom Frame
- User pergi ke **AI Template Creator** 
- Input deskripsi frame (contoh: "3 foto vertikal dengan warna biru gradient")
- AI generate frame spec dan visual frame
- User beri nama frame
- Click "Simpan Frame" → frame disimpan sebagai private frame

### 2. Use Custom Frame
- Di **Booth.tsx** (photo editor), user click "Ubah Frame"
- Frame Selector modal terbuka dengan 2 section:
  - **"My Custom Frames"** - Frame pribadi yang dibuat user (atas)
  - **"Available Templates"** - Public templates dari admin (bawah)
- User bisa pilih frame pribadi mereka atau template public
- Custom frame akan digunakan untuk photo booth session yang sama

## Technical Details

### Backend
- **Model**: `UserGeneratedFrame.ts` - Menyimpan frame data dengan userId
- **API Endpoints**:
  - `GET /api/user-frames` - Fetch semua custom frames milik user
  - `POST /api/user-frames` - Create custom frame baru
  - `GET /api/user-frames/:id` - Fetch custom frame by ID (ownership check)
  - `PATCH /api/user-frames/:id` - Update frame properties (ownership check)
  - `DELETE /api/user-frames/:id` - Delete custom frame (ownership check)

### Frontend
- **API Service**: `userFrameAPI` di `services/api.ts` dengan methods: getAll, create, getById, update, delete
- **AITemplateCreator.tsx** - Modified untuk save ke userFrameAPI (private) instead of aiAPI.saveFrame
- **Booth.tsx** - Modified untuk:
  - Load user custom frames saat buka frame selector
  - Display custom frames dalam section tersendiri dengan heart icon
  - Support menggunakan custom frame seperti template biasa

## Privacy & Security

✅ **Setiap custom frame hanya bisa dilihat oleh creator-nya**
- Backend verify ownership sebelum return frame data
- GET, PATCH, DELETE endpoints hanya work untuk pemilik frame
- Custom frames tidak muncul di template gallery user lain

✅ **Authentication required**
- Semua endpoint require JWT token via verifyAuth middleware
- User dapat diidentifikasi dari token

## Database

```typescript
// UserGeneratedFrame Model Fields
{
  name: string,                    // Nama frame (max 100 chars)
  description?: string,            // Optional deskripsi
  userId: string,                  // Reference ke user (indexed)
  thumbnail: string,               // Preview image (base64 SVG)
  frameUrl: string,                // Frame SVG data
  frameCount: number,              // 2-6 photos
  layoutPositions: Array,          // Position data untuk setiap foto slot
  frameSpec?: object,              // AI spec yang digunakan
  isActive: boolean,               // Apakah frame masih bisa digunakan
  isFavorite: boolean,             // Mark sebagai favorite
  usageCount: number,              // Tracking berapa kali dipakai
  createdAt: Date,
  updatedAt: Date
}
```

## User Experience

### Creating Custom Frame
1. Go to AI Template Creator
2. Describe desired frame
3. Review generated preview
4. Name your frame
5. Click "Simpan Frame" → Success notification
6. Frame sekarang tersimpan dan bisa digunakan kapan saja

### Using Custom Frame
1. In Booth, click "Ubah Frame"
2. See "My Custom Frames" section at top
3. Select your custom frame
4. Frame instantly applied to current photos
5. Continue editing or download

## Future Enhancements
- [ ] Edit existing custom frame (rename, re-describe)
- [ ] Share custom frame with other users (optional)
- [ ] Custom frame templates gallery
- [ ] Duplicate/clone existing frame
- [ ] Frame usage analytics
