# 🎨 PixelPlayground Backend

Backend API untuk PixelPlayground - Authentication & User Management menggunakan Next.js, MongoDB Atlas, dan JWT.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (atau MongoDB local)
- npm atau yarn atau pnpm

## 🔧 Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Environment Variables**

Copy `.env.local.example` ke `.env.local` dan isi dengan data Anda:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pixelplayground

# JWT Secret (generate random string)
JWT_SECRET=your-super-secret-jwt-key

# JWT Expiration
JWT_EXPIRE=7d
```

**Cara mendapatkan MongoDB Atlas URI:**
1. Login ke [MongoDB Atlas](https://cloud.mongodb.com)
2. Create Cluster (jika belum ada)
3. Database Access → Add New User
4. Network Access → Add IP Address (0.0.0.0/0 untuk development)
5. Connect → Connect your application → Copy connection string
6. Replace `<password>` dengan password user Anda

3. **Run Development Server**
```bash
npm run dev
```

Backend akan running di: **http://localhost:3001**

## 📡 API Endpoints

### Authentication

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully! Please login.",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-10T..."
    }
  }
}
```

#### 2. Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-10T..."
    }
  }
}
```

#### 3. Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <your-jwt-token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-10T...",
      "updatedAt": "2025-11-10T..."
    }
  }
}
```

## 📁 Project Structure

```
backend-pixelPlayground/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── register/route.ts    # Register endpoint
│   │   │       ├── login/route.ts       # Login endpoint
│   │   │       └── verify/route.ts      # Verify token endpoint
│   │   └── page.tsx                     # Homepage
│   ├── lib/
│   │   ├── mongodb.ts                   # MongoDB connection
│   │   └── jwt.ts                       # JWT utilities
│   ├── models/
│   │   └── User.ts                      # User schema (Mongoose)
│   └── middleware/
│       └── auth.ts                      # Auth middleware
├── .env.local                           # Environment variables (tidak di-commit)
├── .env.local.example                   # Template environment variables
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## 🔐 Security Features

- ✅ Password hashing dengan bcrypt (salt rounds: 10)
- ✅ JWT token authentication dengan expiration
- ✅ Email validation dengan regex
- ✅ Password minimum 8 characters
- ✅ CORS configuration untuk frontend
- ✅ Protected API endpoints dengan middleware
- ✅ MongoDB injection prevention (Mongoose ODM)
- ✅ **Role-based authentication** (user & admin)

## 👨‍💼 Admin Features

Backend ini sudah mendukung **role-based authentication** dengan 2 level:
- **user**: User biasa (default)
- **admin**: Administrator dengan akses penuh

### 🚀 Cara Membuat Admin

**Metode 1: Menggunakan Script (Recommended)**
```bash
node scripts/create-admin.js
```
Ikuti prompt untuk memasukkan nama, email, dan password admin.

**Metode 2: Manual di MongoDB Atlas**
1. Login ke MongoDB Atlas
2. Browse Collections → `users`
3. Edit user, tambahkan field: `"role": "admin"`

📚 **Dokumentasi Lengkap**: Lihat [ADMIN-SETUP-GUIDE.md](./ADMIN-SETUP-GUIDE.md)

### API Response dengan Role

Login/Register/Verify sekarang mengembalikan `role`:
```json
{
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"  // ← NEW!
  }
}
```

### Protected Admin Routes

Gunakan `verifyAdmin` middleware untuk route khusus admin:
```typescript
import { verifyAdmin, forbiddenResponse } from '@/middleware/admin';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  
  if (!admin) {
    return forbiddenResponse('Admin access only');
  }
  
  // Admin-only logic here
}
```

## 🌐 CORS Configuration

Backend sudah dikonfigurasi untuk menerima request dari:
- `http://localhost:5173` (Frontend Vite)

Untuk menambah origin lain, edit `next.config.js`:
```javascript
{ key: "Access-Control-Allow-Origin", value: "http://your-frontend-url" }
```

## 🧪 Testing API

Gunakan **Postman**, **Thunder Client**, atau **curl**:

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Verify (ganti YOUR_TOKEN dengan token dari login)
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Add environment variables di Vercel Dashboard
4. Deploy!

### Railway / Render
1. Connect GitHub repository
2. Add environment variables
3. Deploy

**⚠️ IMPORTANT**: Jangan lupa update `MONGODB_URI` dan `JWT_SECRET` di production!

## 📝 Environment Variables Explanation

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key untuk JWT signing | `your-random-secret-key-min-32-chars` |
| `JWT_EXPIRE` | JWT token expiration time | `7d` (7 days), `1h` (1 hour), `30d` (30 days) |

## 🧪 Quick Testing

### Automated Test (PowerShell)
```powershell
.\test-api.ps1
```

### Manual Test (Browser)

1. **Health Check:**
   ```
   http://localhost:3001/api/health
   ```

2. **Register User:**
   ```http
   POST http://localhost:3001/api/auth/register
   Content-Type: application/json

   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123"
   }
   ```

3. **Login:**
   ```http
   POST http://localhost:3001/api/auth/login
   Content-Type: application/json

   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

4. **Verify Token:**
   ```http
   GET http://localhost:3001/api/auth/verify
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

## 🆘 Troubleshooting

### Error: "Cannot find module 'mongoose'"
```bash
npm install
```

### Error: "MONGODB_URI is not defined"
Check `.env.local` file sudah dibuat dan terisi dengan benar.

### Error: MongoDB Connection Failed
- Pastikan IP Address sudah ditambahkan di MongoDB Atlas Network Access
- Check username & password di connection string sudah benar
- Pastikan database name sudah sesuai

### Error: CORS Policy
Edit `next.config.js` dan tambahkan frontend URL Anda di allowed origins.

### Backend running but no MongoDB message
- MongoDB connection lazy-loads saat ada request pertama
- Akses `/api/health` untuk trigger connection
- Atau test register/login langsung

## 👨‍💻 Developer

**PixelPlayground Team**
- Project: KaryaKlik
- Frontend: React + Vite + TypeScript
- Backend: Next.js + MongoDB + JWT

## 📄 License

Private Project - All Rights Reserved
