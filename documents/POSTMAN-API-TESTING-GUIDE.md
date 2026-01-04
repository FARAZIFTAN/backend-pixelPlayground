# 📮 Panduan Testing API KaryaKlik dengan Postman

> **Dokumentasi lengkap untuk testing semua API endpoint KaryaKlik menggunakan Postman**  
> **Last Updated:** January 4, 2026

---

## 📑 Daftar Isi

1. [Setup Awal](#1-setup-awal)
2. [Authentication Flow](#2-authentication-flow)
3. [User Endpoints](#3-user-endpoints)
4. [Template Endpoints](#4-template-endpoints)
5. [Photo Booth Endpoints](#5-photo-booth-endpoints)
6. [Payment Endpoints](#6-payment-endpoints)
7. [Admin Endpoints](#7-admin-endpoints)
8. [Tips & Troubleshooting](#8-tips--troubleshooting)

---

## 1. 🚀 Setup Awal

### 1.1 Install Postman

**Download & Install:**
1. Download Postman dari: https://www.postman.com/downloads/
2. Install aplikasi
3. Buat akun Postman (gratis) atau skip login

### 1.2 Pastikan Backend Berjalan

**Cek server backend:**
```powershell
# Di terminal backend
cd C:\KAMPUS\PROJECT3\APK\backend-pixelPlayground
npm run dev
```

**Output yang benar:**
```
✓ Ready in 1.2s
○ Local:        http://localhost:3001
```

### 1.3 Setup Environment di Postman

**Buat Environment Variable:**

1. Klik **"Environments"** di sidebar kiri Postman
2. Klik **"+"** untuk create new environment
3. Nama: `KaryaKlik Local`
4. Tambahkan variables:

| Variable Name | Initial Value | Current Value |
|---------------|---------------|---------------|
| `baseUrl` | `http://localhost:3001` | `http://localhost:3001` |
| `token` | (kosongkan) | (kosongkan) |
| `userId` | (kosongkan) | (kosongkan) |

5. **Save** environment
6. **Select** environment "KaryaKlik Local" dari dropdown di kanan atas

### 1.4 Buat Collection Baru

1. Klik **"Collections"** di sidebar kiri
2. Klik **"+"** atau **"Create Collection"**
3. Nama: `KaryaKlik API`
4. Deskripsi: `API Testing untuk aplikasi KaryaKlik`

---

## 2. 🔐 Authentication Flow

### 2.1 Register User Baru

**Endpoint:** `POST {{baseUrl}}/api/auth/register`

**Request Body (raw JSON):**
```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "Password123!",
  "phone": "081234567890"
}
```

**Steps:**
1. Buat **New Request** di collection
2. Nama: `Register User`
3. Method: **POST**
4. URL: `{{baseUrl}}/api/auth/register`
5. Tab **Body** → **raw** → **JSON**
6. Paste request body di atas
7. **Send**

**Response Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "677a1234567890abcdef1234",
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "user",
      "isPremium": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ PENTING: Simpan token untuk request selanjutnya!**

---

### 2.2 Login

**Endpoint:** `POST {{baseUrl}}/api/auth/login`

**Request Body:**
```json
{
  "email": "testuser@example.com",
  "password": "Password123!"
}
```

**Steps:**
1. New Request: `Login User`
2. Method: **POST**
3. URL: `{{baseUrl}}/api/auth/login`
4. Body → raw → JSON
5. Paste request body
6. **Send**

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "677a1234567890abcdef1234",
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "user",
      "isPremium": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**📝 Menyimpan Token Otomatis:**

Tambahkan **Test Script** di tab **Tests**:
```javascript
// Parse response
const response = pm.response.json();

// Simpan token ke environment
if (response.success && response.data.token) {
    pm.environment.set("token", response.data.token);
    pm.environment.set("userId", response.data.user._id);
    console.log("✅ Token saved:", response.data.token);
}
```

Sekarang setiap kali login, token otomatis tersimpan!

---

### 2.3 Verify Token

**Endpoint:** `GET {{baseUrl}}/api/auth/verify`

**Headers:**
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |

**Steps:**
1. New Request: `Verify Token`
2. Method: **GET**
3. URL: `{{baseUrl}}/api/auth/verify`
4. Tab **Headers** → Add:
   - Key: `Authorization`
   - Value: `Bearer {{token}}`
5. **Send**

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "677a1234567890abcdef1234",
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "user",
      "isPremium": false
    }
  }
}
```

---

### 2.4 Login Admin (untuk testing admin endpoints)

**Endpoint:** `POST {{baseUrl}}/api/auth/login`

**Request Body:**
```json
{
  "email": "admin@karyaklik.com",
  "password": "Admin123!"
}
```

**⚠️ Pastikan sudah ada admin user di database!**

Jika belum, buat dengan script:
```bash
cd C:\KAMPUS\PROJECT3\APK\backend-pixelPlayground
node scripts/create-admin.js
```

---

## 3. 👤 User Endpoints

### 3.1 Get User Profile

**Endpoint:** `GET {{baseUrl}}/api/users/profile`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Steps:**
1. New Request: `Get Profile`
2. Method: **GET**
3. URL: `{{baseUrl}}/api/users/profile`
4. Headers → Authorization: `Bearer {{token}}`
5. **Send**

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "677a1234567890abcdef1234",
      "name": "Test User",
      "email": "testuser@example.com",
      "phone": "081234567890",
      "role": "user",
      "isPremium": false,
      "profilePicture": null
    }
  }
}
```

---

### 3.2 Update Profile

**Endpoint:** `PUT {{baseUrl}}/api/users/profile`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Test User Updated",
  "phone": "081234567899"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "name": "Test User Updated",
      "phone": "081234567899"
    }
  }
}
```

---

### 3.3 Change Password

**Endpoint:** `PUT {{baseUrl}}/api/users/password`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

---

### 3.4 Upload Profile Picture

**Endpoint:** `POST {{baseUrl}}/api/users/profile-picture`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:**
- Type: **form-data**
- Key: `profilePicture` (type: File)
- Value: [Select image file]

**Steps:**
1. New Request: `Upload Profile Picture`
2. Method: **POST**
3. URL: `{{baseUrl}}/api/users/profile-picture`
4. Headers → Authorization: `Bearer {{token}}`
5. Body → **form-data**
6. Add key: `profilePicture` → Type: **File**
7. Click **Select Files** → Choose image (JPG/PNG)
8. **Send**

**Response:**
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "profilePicture": "/uploads/profiles/1234567890-profile.jpg"
  }
}
```

---

## 4. 🖼️ Template Endpoints

### 4.1 Get All Templates

**Endpoint:** `GET {{baseUrl}}/api/templates`

**Query Parameters (optional):**
- `category` - Filter by category (Birthday, Wedding, etc)
- `isPremium` - Filter by premium status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:**
```
GET {{baseUrl}}/api/templates?category=Birthday&isPremium=false&page=1&limit=10
```

**Headers:**
```
Authorization: Bearer {{token}} (optional untuk public templates)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "677a1234567890abcdef5678",
        "name": "Birthday Party Frame",
        "category": "Birthday",
        "thumbnail": "/uploads/templates/birthday-thumb.jpg",
        "frameUrl": "/uploads/templates/birthday-frame.svg",
        "isPremium": false,
        "frameCount": 4,
        "isActive": true
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

---

### 4.2 Get Template by ID

**Endpoint:** `GET {{baseUrl}}/api/templates/:id`

**Example:**
```
GET {{baseUrl}}/api/templates/677a1234567890abcdef5678
```

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "677a1234567890abcdef5678",
      "name": "Birthday Party Frame",
      "description": "Fun birthday frame with 4 photos",
      "category": "Birthday",
      "frameCount": 4,
      "layoutPositions": [
        {
          "x": 50,
          "y": 50,
          "width": 200,
          "height": 200,
          "borderRadius": 10,
          "rotation": 0
        }
      ]
    }
  }
}
```

---

## 5. 📸 Photo Booth Endpoints

### 5.1 Create Photo Session

**Endpoint:** `POST {{baseUrl}}/api/sessions`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateId": "677a1234567890abcdef5678",
  "sessionName": "My Birthday Photos",
  "metadata": {
    "deviceInfo": "iPhone 13 Pro",
    "location": "Jakarta"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session": {
      "_id": "677a1234567890abcdef9999",
      "userId": "677a1234567890abcdef1234",
      "templateId": "677a1234567890abcdef5678",
      "sessionName": "My Birthday Photos",
      "status": "active",
      "capturedPhotos": [],
      "startedAt": "2026-01-04T10:00:00.000Z"
    }
  }
}
```

**📝 Simpan sessionId:**
```javascript
// Tab Tests
const response = pm.response.json();
if (response.success && response.data.session) {
    pm.environment.set("sessionId", response.data.session._id);
}
```

---

### 5.2 Upload Photo to Session

**Endpoint:** `POST {{baseUrl}}/api/photos/upload`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| `sessionId` | Text | `{{sessionId}}` |
| `photo` | File | [Select image] |
| `order` | Text | `1` |

**Steps:**
1. New Request: `Upload Photo`
2. Method: **POST**
3. URL: `{{baseUrl}}/api/photos/upload`
4. Headers → Authorization: `Bearer {{token}}`
5. Body → **form-data**
6. Add keys seperti tabel di atas
7. **Send**

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "photo": {
      "_id": "677a1234567890abcdefaaaa",
      "sessionId": "677a1234567890abcdef9999",
      "userId": "677a1234567890abcdef1234",
      "photoUrl": "/uploads/photos/1234567890-photo.jpg",
      "thumbnailUrl": "/uploads/photos/1234567890-thumb.jpg",
      "order": 1
    }
  }
}
```

**💡 Upload beberapa foto:**
- Ulangi request dengan `order: 2`, `order: 3`, dst
- Atau batch upload jika API support

---

### 5.3 Create Composite (Hasil Akhir)

**Endpoint:** `POST {{baseUrl}}/api/composites`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionId": "{{sessionId}}",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Composite created successfully",
  "data": {
    "composite": {
      "_id": "677a1234567890abcdefbbbb",
      "sessionId": "677a1234567890abcdef9999",
      "userId": "677a1234567890abcdef1234",
      "templateId": "677a1234567890abcdef5678",
      "compositeUrl": "/uploads/composites/1234567890-composite.jpg",
      "thumbnailUrl": "/uploads/composites/1234567890-thumb.jpg",
      "isPublic": true,
      "likes": 0,
      "views": 0
    }
  }
}
```

---

### 5.4 Get My Gallery

**Endpoint:** `GET {{baseUrl}}/api/composites`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "composites": [
      {
        "_id": "677a1234567890abcdefbbbb",
        "compositeUrl": "/uploads/composites/1234567890-composite.jpg",
        "thumbnailUrl": "/uploads/composites/1234567890-thumb.jpg",
        "isPublic": true,
        "likes": 5,
        "views": 120,
        "createdAt": "2026-01-04T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 5.5 Get Public Gallery

**Endpoint:** `GET {{baseUrl}}/api/gallery/public`

**No authentication required!**

**Query Parameters:**
- `page`, `limit`, `sort` (likes, views, createdAt)

**Response:**
```json
{
  "success": true,
  "data": {
    "composites": [...]
  }
}
```

---

## 6. 💳 Payment Endpoints

### 6.1 Create Payment (Beli Pro)

**Endpoint:** `POST {{baseUrl}}/api/payments`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "packageName": "KaryaKlik Pro",
  "packageType": "pro",
  "amount": 50000,
  "durationMonths": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment": {
      "_id": "677a1234567890abcdefcccc",
      "userId": "677a1234567890abcdef1234",
      "packageName": "KaryaKlik Pro",
      "amount": 50000,
      "status": "pending_payment",
      "bankName": "Bank BCA",
      "bankAccountNumber": "1234567890",
      "bankAccountName": "PT KaryaKlik Indonesia"
    }
  }
}
```

**📝 Simpan paymentId:**
```javascript
const response = pm.response.json();
if (response.success && response.data.payment) {
    pm.environment.set("paymentId", response.data.payment._id);
}
```

---

### 6.2 Upload Payment Proof

**Endpoint:** `POST {{baseUrl}}/api/payments/upload-proof`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| `paymentId` | Text | `{{paymentId}}` |
| `paymentProof` | File | [Select bukti transfer image] |

**Response:**
```json
{
  "success": true,
  "message": "Payment proof uploaded successfully",
  "data": {
    "payment": {
      "_id": "677a1234567890abcdefcccc",
      "status": "pending_verification",
      "paymentProofUrl": "/uploads/payments/1234567890-proof.jpg",
      "paymentProofUploadedAt": "2026-01-04T11:00:00.000Z"
    }
  }
}
```

---

### 6.3 Get My Payments

**Endpoint:** `GET {{baseUrl}}/api/payments`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "677a1234567890abcdefcccc",
        "packageName": "KaryaKlik Pro",
        "amount": 50000,
        "status": "pending_verification",
        "createdAt": "2026-01-04T10:45:00.000Z"
      }
    ]
  }
}
```

---

## 7. 🔧 Admin Endpoints

**⚠️ Semua admin endpoints membutuhkan admin token!**

### 7.1 Get All Users (Admin)

**Endpoint:** `GET {{baseUrl}}/api/users/all`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `page`, `limit`, `role`, `isPremium`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "677a1234567890abcdef1234",
        "name": "Test User",
        "email": "testuser@example.com",
        "role": "user",
        "isPremium": false,
        "isActive": true,
        "createdAt": "2026-01-04T09:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1
    }
  }
}
```

---

### 7.2 Get All Payments (Admin)

**Endpoint:** `GET {{baseUrl}}/api/admin/payments`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `status` - Filter by status (pending_verification, approved, rejected)

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "677a1234567890abcdefcccc",
        "user": {
          "name": "Test User",
          "email": "testuser@example.com"
        },
        "amount": 50000,
        "status": "pending_verification",
        "paymentProofUrl": "/uploads/payments/proof.jpg"
      }
    ]
  }
}
```

---

### 7.3 Approve Payment

**Endpoint:** `PUT {{baseUrl}}/api/admin/payments/:id/approve`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Example:**
```
PUT {{baseUrl}}/api/admin/payments/{{paymentId}}/approve
```

**Request Body (optional):**
```json
{
  "adminNotes": "Verified, payment approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {
    "payment": {
      "_id": "677a1234567890abcdefcccc",
      "status": "approved",
      "approvedAt": "2026-01-04T11:30:00.000Z"
    },
    "user": {
      "isPremium": true,
      "premiumExpiresAt": "2026-02-04T11:30:00.000Z"
    }
  }
}
```

---

### 7.4 Reject Payment

**Endpoint:** `PUT {{baseUrl}}/api/admin/payments/:id/reject`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "rejectionReason": "Bukti transfer tidak valid",
  "adminNotes": "Mohon upload bukti transfer yang lebih jelas"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment rejected",
  "data": {
    "payment": {
      "_id": "677a1234567890abcdefcccc",
      "status": "rejected",
      "rejectionReason": "Bukti transfer tidak valid",
      "rejectedAt": "2026-01-04T11:35:00.000Z"
    }
  }
}
```

---

### 7.5 Get Frame Submissions (Admin)

**Endpoint:** `GET {{baseUrl}}/api/admin/frame-submissions`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `status` - pending, approved, rejected

---

### 7.6 Approve Frame Submission

**Endpoint:** `PUT {{baseUrl}}/api/admin/frame-submissions/:id/approve`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "isPremium": false,
  "category": "Custom"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Frame approved and added to templates",
  "data": {
    "submission": {
      "status": "approved"
    },
    "template": {
      "_id": "677a1234567890abcdefdddd",
      "name": "User Custom Frame"
    }
  }
}
```

---

## 8. 💡 Tips & Troubleshooting

### 8.1 Setup Collection-Level Authorization

Agar tidak perlu tambah header Authorization di setiap request:

1. Klik collection "KaryaKlik API"
2. Tab **Authorization**
3. Type: **Bearer Token**
4. Token: `{{token}}`
5. **Save**

Sekarang semua request dalam collection otomatis menggunakan token!

---

### 8.2 Pre-request Script untuk Auto-Login

Jika token expired, auto-login ulang:

**Collection Pre-request Script:**
```javascript
// Cek apakah token ada
const token = pm.environment.get("token");

if (!token) {
    console.log("⚠️ No token found, please login first");
}
```

---

### 8.3 Common Errors & Solutions

#### ❌ Error 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Solusi:**
1. Pastikan sudah login
2. Token tersimpan di environment variable
3. Header Authorization: `Bearer {{token}}` (ada spasi setelah Bearer)

---

#### ❌ Error 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden - Admin access required"
}
```

**Solusi:**
- Endpoint memerlukan admin token
- Login dengan akun admin

---

#### ❌ Error 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [...]
}
```

**Solusi:**
- Cek request body format (JSON valid)
- Pastikan semua required fields ada
- Cek tipe data (string, number, boolean)

---

#### ❌ Error 500 Internal Server Error

**Solusi:**
1. Cek console backend (terminal npm run dev)
2. Cek MongoDB sudah running
3. Cek koneksi database

---

### 8.4 Testing Workflow Complete

**Complete Flow untuk test semua fitur:**

```
1. Register → Login → Save token
2. Get Templates → Pilih template
3. Create Session → Upload Photos → Create Composite
4. View Gallery (private & public)
5. Create Payment → Upload Proof
6. [Admin] Approve Payment
7. Verify user jadi Premium
8. Test Pro features (AI generation, frame upload)
```

---

### 8.5 Export & Import Collection

**Export Collection:**
1. Right-click collection "KaryaKlik API"
2. Export
3. Save as JSON

**Import Collection:**
1. Import button
2. Upload JSON file
3. Select environment

**🎁 Bonus:** Bisa share collection dengan tim!

---

## 📊 Checklist Testing

### User Flow:
- [ ] Register user baru
- [ ] Login & save token
- [ ] Get profile
- [ ] Update profile
- [ ] Upload profile picture
- [ ] Change password

### Photo Booth Flow:
- [ ] Get templates
- [ ] Create session
- [ ] Upload 4 photos
- [ ] Create composite
- [ ] View my gallery
- [ ] View public gallery

### Payment Flow:
- [ ] Create payment
- [ ] Upload payment proof
- [ ] Check payment status

### Admin Flow:
- [ ] Login as admin
- [ ] View all users
- [ ] View all payments
- [ ] Approve payment
- [ ] View frame submissions
- [ ] Approve/reject frame

---

## 🎯 Quick Reference

### Base URL
```
http://localhost:3001
```

### Authentication Header
```
Authorization: Bearer {{token}}
```

### Common Response Codes
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

**Happy Testing! 🚀**

Jika ada pertanyaan atau error, cek:
1. Terminal backend (error logs)
2. Postman console (network errors)
3. MongoDB connection status

---

**Dibuat oleh:** GitHub Copilot  
**Tanggal:** January 4, 2026  
**Version:** 1.0
