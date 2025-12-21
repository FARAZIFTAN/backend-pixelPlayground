# 📊 Panduan Melihat Status Premium User (Admin)

## 🎯 Cara Mengetahui User Premium atau Bukan

### 1️⃣ **Dashboard Stats Cards** (Paling Cepat)
Begitu masuk ke halaman User Management, Anda langsung melihat 5 kartu statistik:

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Users  │ Admins       │ Active       │ ⭐ PREMIUM   │ Free Users   │
│    150       │     5        │    142       │     45       │    105       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**Kartu PREMIUM Users** berwarna **GOLD/KUNING** - langsung terlihat jumlah user premium!

---

### 2️⃣ **Filter Berdasarkan Subscription** (Untuk Menyaring)

Di bagian Search & Filter, ada **3 dropdown**:

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search...     │ All Roles ▼ │ All Subscriptions ▼  │
└─────────────────────────────────────────────────────────┘
```

**Dropdown "All Subscriptions"** memiliki 3 pilihan:
- ✅ **All Subscriptions** - Tampilkan semua user
- ⭐ **Premium Only** - Hanya tampilkan user premium
- 👤 **Free Only** - Hanya tampilkan user gratis

**Cara Pakai:**
1. Klik dropdown "All Subscriptions"
2. Pilih "Premium Only"
3. Tabel akan otomatis filter hanya menampilkan premium users!

---

### 3️⃣ **Tabel Users - Visual Indicator** (Paling Jelas)

Di tabel daftar user, ada **3 cara** mengetahui status premium:

#### A. **Badge Premium** (Kolom Premium)
```
┌─────────┬──────────┬────────┬──────────────┬──────────┐
│  User   │   Role   │ Status │   Premium    │  Joined  │
├─────────┼──────────┼────────┼──────────────┼──────────┤
│ John    │   User   │ Active │ ⭐ Premium   │ Jan 2024 │
│ Sarah   │   User   │ Active │ 👤 Free      │ Feb 2024 │
└─────────┴──────────┴────────┴──────────────┴──────────┘
```

**Ciri-ciri Premium:**
- ✅ Badge **KUNING** dengan teks "Premium"
- ✅ Icon ⭐ (Award/Trophy)
- ❌ Badge **ABU-ABU** dengan teks "Free" = BUKAN Premium

#### B. **Background Row Berwarna**
Premium users memiliki **background kuning muda** (yellow-500/5) di seluruh row tabel.

#### C. **Icon Avatar & Crown**
- **Avatar Premium**: Gradient kuning-orange dengan ring kuning
- **Avatar Free**: Gradient biru-ungu
- **Crown Icon**: Icon ⭐ muncul di samping nama user premium

---

### 4️⃣ **User Detail Dialog** (Informasi Lengkap)

Klik tombol **👁️ View** pada user, akan muncul detail popup dengan section **Subscription Status**:

#### **Premium User:**
```
┌────────────────────────────────────────────────────┐
│  ⭐ Subscription Status            [🟢 ACTIVE]     │
│                                                     │
│  Premium Member                                     │
│  ├─ Expiry Date: 25 Januari 2026                  │
│  └─ Days Remaining: 34 days (hijau)               │
└────────────────────────────────────────────────────┘
```

**Ciri-ciri:**
- Background **KUNING GRADIENT** (yellow-orange)
- Badge **ACTIVE** hijau
- Menampilkan **tanggal expired**
- Counter **sisa hari**:
  - **HIJAU** = Masih > 7 hari
  - **MERAH** = Kurang dari 7 hari (segera expired!)

#### **Free User:**
```
┌────────────────────────────────────────────────────┐
│  👤 Subscription Status                             │
│                                                     │
│  Free Account                                       │
│  ℹ️  User is currently on a free plan with         │
│     limited features                                │
└────────────────────────────────────────────────────┘
```

**Ciri-ciri:**
- Background **ABU-ABU** (gray)
- Tidak ada badge ACTIVE
- Info box biru menjelaskan user di plan gratis

---

## 🎨 Kode Warna Visual

### Premium Users:
- 🟡 **Kuning/Gold**: Background, badge, avatar gradient
- ⭐ **Award Icon**: Trophy/crown icon
- 🟢 **Hijau**: Status ACTIVE, sisa hari > 7
- 🔴 **Merah**: Warning jika < 7 hari lagi expired

### Free Users:
- ⚪ **Abu-abu**: Badge, background
- 👤 **User Icon**: Icon user biasa
- 🔵 **Biru**: Info box plan gratis

---

## 📋 Checklist: Apakah User Premium?

Gunakan checklist ini untuk cek cepat:

**✅ User PREMIUM jika:**
- [ ] Badge di kolom Premium bertuliskan "⭐ Premium" dengan warna kuning
- [ ] Background row tabel sedikit kuning
- [ ] Avatar berwarna gradient kuning-orange dengan ring
- [ ] Ada icon ⭐ di samping nama
- [ ] Di detail view ada badge "ACTIVE" hijau
- [ ] Tampil tanggal expired premium
- [ ] Section subscription berwarna gradient kuning

**❌ User BUKAN Premium (Free) jika:**
- [ ] Badge di kolom Premium bertuliskan "👤 Free" dengan warna abu-abu
- [ ] Background row tabel normal (hitam/gelap)
- [ ] Avatar berwarna gradient biru-ungu
- [ ] Tidak ada icon crown
- [ ] Di detail view tidak ada badge ACTIVE
- [ ] Tidak ada tanggal expired
- [ ] Section subscription berwarna abu-abu dengan info box biru

---

## 🚀 Workflow Rekomendasi

### Untuk Melihat Semua Premium Users:
1. Buka **User Management**
2. Lihat kartu **"Premium Users"** (kuning) untuk jumlah total
3. Klik dropdown **"All Subscriptions"** → Pilih **"Premium Only"**
4. Tabel akan otomatis filter, hanya menampilkan premium users

### Untuk Cek Status 1 User Tertentu:
1. Gunakan **Search Bar** ketik nama/email user
2. Lihat **badge Premium** di kolom Premium
3. Atau klik **👁️ View** untuk detail lengkap termasuk expired date

### Untuk Monitor Premium yang Hampir Expired:
1. Filter: "Premium Only"
2. Klik **👁️ View** satu per satu
3. Perhatikan **"Days Remaining"**:
   - **Hijau** = Aman
   - **Merah** = Segera expired (< 7 hari)

---

## 💡 Tips Pro

1. **Sorting:** Klik kolom "Premium" di header tabel untuk sort premium/free users
2. **Bulk Check:** Gunakan filter "Premium Only" + export (jika ada fitur export)
3. **Quick Count:** Lihat jumlah hasil filter di header tabel: "Users List (45)"
4. **Color Blind Mode:** Jika sulit bedakan warna, fokus pada:
   - Text "Premium" vs "Free"
   - Icon ⭐ vs icon biasa
   - Badge "ACTIVE" di detail view

---

## 📸 Screenshot Reference

**Dashboard View:**
```
 ╔═══════════════════════════════════════════════════════════════╗
 ║  USER MANAGEMENT                                              ║
 ╠═══════════════════════════════════════════════════════════════╣
 ║                                                                ║
 ║  [Total: 150]  [Admins: 5]  [Active: 142]  [⭐ Premium: 45]  ║
 ║                                                                ║
 ║  🔍 Search...    [All Roles ▼]  [All Subscriptions ▼]        ║
 ║                                                                ║
 ║  ┌────────────────────────────────────────────────────────┐  ║
 ║  │ User          │ Role │ Status │ Premium    │ Actions   │  ║
 ║  ├────────────────────────────────────────────────────────┤  ║
 ║  │ 🟡 John Doe   │ User │ Active │ ⭐ Premium │ 👁️ 🚫 ✏️  │  ║ ← PREMIUM
 ║  │ ⚫ Sarah Lee   │ User │ Active │ 👤 Free    │ 👁️ 🚫 ✏️  │  ║ ← FREE
 ║  └────────────────────────────────────────────────────────┘  ║
 ╚═══════════════════════════════════════════════════════════════╝
```

---

## 🔧 Technical Info (Untuk Developer)

**Field Database:**
- `isPremium`: Boolean (true/false)
- `premiumExpiresAt`: Date (tanggal expired)

**API Endpoint:**
- GET `/api/users/all` - List semua users (include isPremium, premiumExpiresAt)
- GET `/api/users/:id` - Detail user (include subscription info)

**Frontend State:**
```typescript
interface User {
  isPremium: boolean;
  premiumExpiresAt?: string;
  // ... other fields
}
```

---

**✅ Dengan panduan ini, admin dapat dengan mudah mengidentifikasi status premium user dalam hitungan detik!**
