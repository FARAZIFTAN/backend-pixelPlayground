# Gallery API Documentation

## Overview
Sistem Gallery untuk menyimpan dan mengelola foto hasil composite dengan fitur private/public sharing, views, dan likes.

---

## 📸 **Alur Kerja Gallery**

```
1. User buat composite → POST /api/composites
   ↓ (AUTO-SAVE)
2. Foto masuk ke Gallery PRIVATE → photos table
   ↓
3. User lihat My Gallery → GET /api/gallery/my-photos
   ↓
4. User pilih foto → PATCH /api/gallery/[id]/toggle-visibility
   ↓
5. Set PUBLIC → Foto muncul di Public Gallery
   ↓
6. User lain lihat → GET /api/gallery/public
   ↓
7. Views++ → POST /api/gallery/[id]/view
8. Likes++ → POST /api/gallery/[id]/like
```

---

## 🔐 **API Endpoints**

### 1. My Gallery (Private)
**GET** `/api/gallery/my-photos`

Mendapatkan semua foto user (private + public milik user).

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 12)
- `sortBy` (string: createdAt|views|likes, default: createdAt)
- `order` (string: asc|desc, default: desc)
- `visibility` (string: public|private|all, optional)

**Response Success:**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "_id": "...",
        "userId": "...",
        "title": "Graduation - 11/12/2025",
        "description": "Created from Graduation template",
        "imageUrl": "/uploads/composites/...",
        "thumbnailUrl": "/uploads/composites/...",
        "isPublic": false,
        "templateId": "...",
        "views": 0,
        "likes": 0,
        "createdAt": "2025-12-11T...",
        "updatedAt": "2025-12-11T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 2. Public Gallery (Explore)
**GET** `/api/gallery/public`

Browse semua foto PUBLIC dari semua user (tanpa auth).

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 12)
- `sortBy` (string: createdAt|views|likes, default: createdAt)
- `order` (string: asc|desc, default: desc)
- `templateId` (string, optional) - Filter by template

**Response Success:**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "_id": "...",
        "title": "Graduation - 11/12/2025",
        "description": "Created from Graduation template",
        "imageUrl": "/uploads/composites/...",
        "thumbnailUrl": "/uploads/composites/...",
        "isPublic": true,
        "templateId": "...",
        "views": 150,
        "likes": 23,
        "createdAt": "2025-12-11T...",
        "updatedAt": "2025-12-11T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 250,
      "totalPages": 21
    }
  }
}
```

**Note:** `userId` tidak ditampilkan di public gallery untuk privacy.

---

### 3. Toggle Visibility (PATCH)
**PATCH** `/api/gallery/[id]/toggle-visibility`

Toggle foto antara PUBLIC ↔ PRIVATE.

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Photo is now public",
  "data": {
    "photoId": "...",
    "isPublic": true
  }
}
```

---

### 4. Set Visibility (PUT)
**PUT** `/api/gallery/[id]/toggle-visibility`

Set specific visibility (PUBLIC atau PRIVATE).

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Body:**
```json
{
  "isPublic": true
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Photo is now public",
  "data": {
    "photoId": "...",
    "isPublic": true
  }
}
```

---

### 5. Like Photo
**POST** `/api/gallery/[id]/like`

Tambah like pada foto public.

**Headers:** (Optional)
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Photo liked",
  "data": {
    "photoId": "...",
    "likes": 24
  }
}
```

---

### 6. Unlike Photo
**DELETE** `/api/gallery/[id]/like`

Kurangi like pada foto public.

**Response Success:**
```json
{
  "success": true,
  "message": "Photo unliked",
  "data": {
    "photoId": "...",
    "likes": 23
  }
}
```

---

### 7. Increment View
**POST** `/api/gallery/[id]/view`

Tambah view counter saat foto dibuka.

**Response Success:**
```json
{
  "success": true,
  "data": {
    "photoId": "...",
    "views": 151
  }
}
```

---

## 🔄 **Auto-Save to Gallery**

Ketika user membuat composite (`POST /api/composites`), foto **otomatis disimpan** ke gallery sebagai **PRIVATE**.

**Modified Response:**
```json
{
  "success": true,
  "message": "Composite created successfully and saved to your gallery",
  "data": {
    "sessionId": "...",
    "userId": "...",
    "compositeUrl": "...",
    "isPublic": false
  }
}
```

---

## 📊 **Use Cases**

### Use Case 1: My Gallery Page
```javascript
// Get all my photos
const response = await fetch('/api/gallery/my-photos?page=1&limit=12', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Use Case 2: Public Gallery (Most Liked)
```javascript
// Get most liked photos
const response = await fetch('/api/gallery/public?sortBy=likes&order=desc&page=1');
```

### Use Case 3: Share Photo
```javascript
// 1. Set photo to public
await fetch(`/api/gallery/${photoId}/toggle-visibility`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ isPublic: true })
});

// 2. Share link: https://yoursite.com/gallery/public?photoId=...
```

### Use Case 4: View Photo Detail
```javascript
// When user opens photo, increment view
await fetch(`/api/gallery/${photoId}/view`, { method: 'POST' });
```

---

## 🎯 **Frontend Integration**

### Required Pages:
1. **My Gallery** (`/my-gallery`) - Private gallery page
2. **Public Gallery** (`/explore` or `/gallery`) - Public photos
3. **Photo Detail** (`/photo/[id]`) - Detail page with like/view

### Components Needed:
- `GalleryGrid` - Display photos in grid
- `PhotoCard` - Individual photo card with stats (views, likes)
- `VisibilityToggle` - Switch public/private
- `LikeButton` - Like/unlike button
- `PhotoModal` - Full size photo viewer

---

## ⚠️ **Important Notes**

1. ✅ **Auto-Save**: Setiap composite otomatis masuk gallery sebagai PRIVATE
2. ✅ **Privacy**: User harus MANUAL set PUBLIC untuk share
3. ✅ **View Counter**: Hanya foto PUBLIC yang bisa increment view
4. ✅ **Like Counter**: Hanya foto PUBLIC yang bisa dilike
5. ⚠️ **No userId in Public**: Public gallery tidak expose userId

---

## 🔒 **Security**

- ✅ Authentication required untuk My Gallery
- ✅ Authorization check (user hanya bisa edit foto sendiri)
- ✅ Public gallery tidak perlu auth
- ✅ Like/View tidak perlu auth (opsional)
- ✅ Private photos tidak bisa diakses di public endpoints

---

## 📈 **Future Enhancements**

1. Search by title/description
2. Filter by template
3. User profile gallery (public photos only)
4. Share to social media
5. Download high-res
6. Comments on photos
7. Report inappropriate content
8. Featured/trending photos
