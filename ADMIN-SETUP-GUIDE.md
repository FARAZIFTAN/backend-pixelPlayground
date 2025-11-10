# 🔐 Admin Setup Guide

## Overview
Sistem ini mendukung role-based authentication dengan 2 level akses:
- **User**: Akses biasa (default untuk semua registrasi)
- **Admin**: Akses penuh ke admin panel

---

## 📋 Yang Sudah Ditambahkan

### Backend Changes:

1. **User Model** (`src/models/User.ts`)
   - ✅ Tambah field `role` dengan enum ['user', 'admin']
   - ✅ Default role: 'user'

2. **JWT Payload** (`src/lib/jwt.ts`)
   - ✅ Include `role` dalam token

3. **Auth Routes**
   - ✅ Login route mengembalikan role
   - ✅ Register route mengembalikan role
   - ✅ Verify route mengembalikan role

4. **Middleware**
   - ✅ `src/middleware/auth.ts` - Verify JWT token dengan role
   - ✅ `src/middleware/admin.ts` - Verify admin role

5. **Admin Creation Script**
   - ✅ `scripts/create-admin.js` - Script untuk membuat admin pertama

### Frontend Changes:

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - ✅ Tambah `role` di User interface
   - ✅ Tambah `isAdmin` property
   - ✅ Handle role dari API response

2. **Protected Routes**
   - ✅ `src/components/ProtectedRoute.tsx` - Untuk user yang login
   - ✅ `src/components/ProtectedAdminRoute.tsx` - Khusus admin

---

## 🚀 Cara Membuat Admin Pertama

### Metode 1: Menggunakan Script (Recommended)

1. **Buka Terminal di folder backend:**
   ```powershell
   cd C:\KAMPUS\PROJECT3\APK\backend-pixelPlayground
   ```

2. **Jalankan script create-admin:**
   ```powershell
   node scripts/create-admin.js
   ```

3. **Isi data admin:**
   ```
   Admin Name: Admin KaryaKlik
   Admin Email: admin@karyaklik.com
   Admin Password: admin12345
   ```

4. **Selesai!** Admin sudah dibuat dan bisa login.

---

### Metode 2: Manual di MongoDB Atlas

1. **Login ke MongoDB Atlas** (https://cloud.mongodb.com)

2. **Pilih Cluster** → **Browse Collections**

3. **Pilih Database**: `karyaklik`

4. **Pilih Collection**: `users`

5. **Find user yang ingin dijadikan admin**

6. **Edit document**, tambahkan/ubah field:
   ```json
   {
     "role": "admin"
   }
   ```

7. **Save** dan selesai!

---

### Metode 3: Menggunakan MongoDB Compass

1. **Connect ke MongoDB** dengan connection string

2. **Navigasi ke**: `karyaklik` → `users`

3. **Find user** yang ingin dijadikan admin

4. **Edit document**, tambahkan field:
   ```json
   {
     "role": "admin"
   }
   ```

5. **Save** dan selesai!

---

## 🔧 Implementasi di Frontend

### 1. Update App.tsx untuk Admin Routes

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";

// Import admin pages
import AdminLayout from "@/components/admin/AdminLayout";
// ... import admin pages lainnya

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected user routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          
          {/* Protected ADMIN routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 2. Gunakan `isAdmin` dari AuthContext

```tsx
import { useAuth } from "@/contexts/AuthContext";

function SomeComponent() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAdmin && (
        <Link to="/admin">Go to Admin Panel</Link>
      )}
      
      <p>Welcome, {user?.name}</p>
      <p>Role: {user?.role}</p>
    </div>
  );
}
```

### 3. Conditional Rendering berdasarkan Role

```tsx
const Navbar = () => {
  const { isAdmin, user } = useAuth();
  
  return (
    <nav>
      <Link to="/">Home</Link>
      
      {isAdmin && (
        <>
          <Link to="/admin/dashboard">Admin Dashboard</Link>
          <Link to="/admin/users">Manage Users</Link>
        </>
      )}
      
      {user && <span>Role: {user.role}</span>}
    </nav>
  );
};
```

---

## 🔒 Membuat Protected Admin API Routes

Contoh membuat API route yang hanya bisa diakses admin:

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse } from '@/middleware/admin';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  // Verify admin
  const admin = await verifyAdmin(request);
  
  if (!admin) {
    return forbiddenResponse('Admin access only');
  }

  try {
    await connectDB();
    
    // Get all users (admin only)
    const users = await User.find().select('-password');
    
    return NextResponse.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error fetching users' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Testing

### 1. Test Login sebagai User Biasa:
```
Email: user@example.com
Password: password123
Expected: Login berhasil, role: "user", TIDAK bisa akses /admin
```

### 2. Test Login sebagai Admin:
```
Email: admin@karyaklik.com
Password: admin12345
Expected: Login berhasil, role: "admin", BISA akses /admin
```

### 3. Test API dengan Postman:

**Login sebagai Admin:**
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@karyaklik.com",
  "password": "admin12345"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "...",
      "name": "Admin KaryaKlik",
      "email": "admin@karyaklik.com",
      "role": "admin"  ← IMPORTANT!
    }
  }
}
```

**Akses Admin API:**
```http
GET http://localhost:3001/api/admin/users
Authorization: Bearer jwt_token_here

Expected: Success jika admin, 403 Forbidden jika bukan admin
```

---

## 📊 Database Schema

```javascript
User Schema:
{
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 8 chars),
  role: String (enum: ['user', 'admin'], default: 'user'), // ← NEW!
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔑 Default Admin Credentials (Setelah Create)

Jika Anda menjalankan script dengan input contoh:
- **Email**: `admin@karyaklik.com`
- **Password**: `admin12345`
- **Role**: `admin`

**⚠️ PENTING**: Ganti password default setelah login pertama kali!

---

## 🛡️ Security Best Practices

1. **Jangan hardcode admin credentials** di kode
2. **Gunakan password yang kuat** untuk admin
3. **Limit failed login attempts** (bisa ditambahkan nanti)
4. **Enable 2FA untuk admin** (optional, bisa ditambahkan)
5. **Log semua admin actions** untuk audit trail
6. **Ganti JWT secret** di production
7. **Gunakan HTTPS** di production

---

## 🐛 Troubleshooting

### Problem: "Access denied. Admin only."
**Solution**: 
- Cek apakah user memiliki role "admin" di database
- Cek apakah JWT token include field "role"
- Verify token di jwt.io untuk melihat payload

### Problem: Token tidak include role
**Solution**:
- Pastikan backend sudah direstart setelah update code
- Login ulang untuk mendapatkan token baru dengan role

### Problem: ProtectedAdminRoute redirect ke home
**Solution**:
- Cek `isAdmin` di console: `console.log(user?.role)`
- Pastikan user.role === 'admin'
- Pastikan AuthContext sudah update dengan `isAdmin` property

---

## 📝 Next Steps

1. ✅ Create admin user dengan script
2. ✅ Test login sebagai admin
3. ⏳ Implement admin API routes (manage users, etc.)
4. ⏳ Build admin dashboard UI
5. ⏳ Add admin features (CRUD operations)

---

## 🎉 Selesai!

Fitur admin sudah siap digunakan. Silakan buat admin pertama dengan menjalankan script:

```powershell
node scripts/create-admin.js
```

Kemudian login dengan credentials admin yang sudah dibuat!
