# 📚 Penjelasan 13 Tabel Database KaryaKlik

> **Project:** KaryaKlik - Photo Booth Frame Application  
> **Database:** MongoDB with Mongoose ODM  
> **Total Tables:** 13 Tabel (Semua Aktif Digunakan)  
> **Last Updated:** January 4, 2026

---

## 📑 Daftar Isi

1. [Tabel Inti (Core)](#tabel-inti-core---6-tabel)
2. [Tabel Payment & Premium](#tabel-payment--premium---2-tabel)
3. [Tabel User Generated Content](#tabel-user-generated-content---2-tabel)
4. [Tabel System & Analytics](#tabel-system--analytics---3-tabel)
5. [Diagram Relasi](#diagram-relasi)

---

## 🎯 Tabel Inti (Core) - 6 Tabel

### 1. 👤 **User** - Tabel Pengguna

**Fungsi Utama:**  
Menyimpan data pengguna aplikasi, termasuk informasi akun, role, dan status premium.

**Field Penting:**
- `name`, `email`, `password` - Data akun
- `googleId` - Login via Google OAuth
- `role` - Enum: `user` atau `admin`
- `isPremium` - Status premium user
- `premiumExpiresAt` - Tanggal kadaluarsa premium
- `profilePicture` - URL foto profil
- `isActive`, `isDeleted` - Status akun
- `loginHistory` - Riwayat login user

**Digunakan untuk:**
- ✅ Autentikasi & Otorisasi
- ✅ Manajemen profil pengguna
- ✅ Sistem premium membership
- ✅ Admin user management

**Relasi:**
- Parent (1:N) untuk: Payment, PhotoSession, CapturedPhoto, FinalComposite, UserGeneratedFrame, UserSubmittedFrame, UsageLimit, Notification, AnalyticsEvent, Photo

---

### 2. 🖼️ **Template** - Tabel Frame/Template

**Fungsi Utama:**  
Menyimpan template/frame foto yang tersedia untuk digunakan user.

**Field Penting:**
- `name` - Nama template
- `category` - Kategori (Birthday, Wedding, Education, dll)
- `thumbnail`, `frameUrl` - Preview & file SVG frame
- `isPremium` - Apakah template khusus Pro user
- `frameCount` - Jumlah foto dalam frame (2-9)
- `layoutPositions` - Posisi & ukuran setiap foto dalam frame
- `visibility` - Enum: `public` atau `private`
- `isAIGenerated` - Dibuat oleh AI atau manual
- `isActive` - Template masih aktif atau tidak

**Digunakan untuk:**
- ✅ Gallery template untuk user
- ✅ AI template generation
- ✅ Photo booth frame selection
- ✅ Template statistics & analytics

**Relasi:**
- Digunakan oleh (1:N): PhotoSession, FinalComposite, Photo, AnalyticsEvent

---

### 3. 📸 **PhotoSession** - Tabel Sesi Foto

**Fungsi Utama:**  
Menyimpan sesi pengambilan foto user (photo booth session).

**Field Penting:**
- `userId` - User yang membuat session
- `templateId` - Template yang digunakan
- `sessionName` - Nama sesi
- `status` - Enum: `active`, `completed`, `cancelled`
- `capturedPhotos` - Array ID foto yang diambil
- `finalComposite` - ID hasil composite akhir
- `metadata` - Device info, location, total photos, durasi
- `startedAt`, `completedAt` - Waktu mulai & selesai

**Digunakan untuk:**
- ✅ Tracking sesi photo booth user
- ✅ Menghubungkan foto individu dengan hasil akhir
- ✅ User activity history
- ✅ Session management

**Relasi:**
- Child of: User, Template
- Parent of: CapturedPhoto, FinalComposite

---

### 4. 📷 **CapturedPhoto** - Tabel Foto Individual

**Fungsi Utama:**  
Menyimpan foto-foto individual yang diambil user dalam satu session.

**Field Penting:**
- `sessionId` - Sesi dimana foto ini diambil
- `userId` - Pemilik foto
- `photoUrl` - URL foto asli
- `thumbnailUrl` - URL thumbnail
- `order` - Urutan foto (1, 2, 3, ...)
- `metadata` - Width, height, fileSize, format, capturedAt

**Digunakan untuk:**
- ✅ Menyimpan foto mentah dari photo booth
- ✅ Maintain urutan foto dalam session
- ✅ Digunakan untuk membuat final composite

**Relasi:**
- Child of: PhotoSession, User

---

### 5. 🎨 **FinalComposite** - Tabel Hasil Akhir

**Fungsi Utama:**  
Menyimpan hasil akhir composite (foto yang sudah digabung dengan frame).

**Field Penting:**
- `sessionId` - Session yang menghasilkan composite ini
- `userId` - Pemilik composite
- `templateId` - Template yang digunakan
- `compositeUrl` - URL hasil akhir
- `thumbnailUrl` - URL thumbnail
- `isPublic` - Bisa dilihat di gallery publik atau tidak
- `likes`, `views` - Jumlah like & view
- `metadata` - Width, height, fileSize, format, photosUsed

**Digunakan untuk:**
- ✅ Gallery user (My Gallery)
- ✅ Public gallery (Explore)
- ✅ Sharing functionality
- ✅ Dashboard & analytics
- ✅ Template usage statistics

**Relasi:**
- Child of: PhotoSession, User, Template

---

### 6. 🗂️ **Photo (Deprecated)** - Tabel Foto Lama

**Fungsi Utama:**  
Tabel legacy untuk menyimpan foto (sistem lama sebelum ada PhotoSession & FinalComposite).

**Field Penting:**
- `userId` - Pemilik foto
- `title`, `description` - Info foto
- `imageUrl`, `thumbnailUrl` - URL foto
- `isPublic` - Visibility
- `templateId` - Template yang digunakan
- `views`, `likes` - Engagement metrics

**Status:** ⚠️ **DEPRECATED** tapi masih digunakan untuk backward compatibility

**Digunakan untuk:**
- ✅ Backward compatibility dengan data lama
- ✅ Legacy gallery endpoints
- ⚠️ Tidak digunakan untuk fitur baru

**Rekomendasi:** Migrasi ke FinalComposite

**Relasi:**
- Child of: User, Template

---

## 💰 Tabel Payment & Premium - 2 Tabel

### 7. 💳 **Payment** - Tabel Pembayaran

**Fungsi Utama:**  
Menyimpan transaksi pembayaran paket premium (Pro).

**Field Penting:**
- `userId` - User yang membeli
- `packageName` - "KaryaKlik Pro"
- `packageType` - "pro"
- `amount` - Harga paket
- `durationMonths` - Durasi (biasanya 1 bulan)
- `bankName`, `bankAccountNumber`, `bankAccountName` - Info rekening tujuan
- `paymentProofUrl` - Bukti transfer
- `status` - Enum: `pending_payment`, `pending_verification`, `approved`, `rejected`
- `rejectionReason`, `adminNotes` - Catatan admin
- `approvedBy`, `approvedAt` - Admin yang approve & waktu approve
- `rejectedBy`, `rejectedAt` - Admin yang reject & waktu reject

**Workflow:**
1. User create payment → `status: pending_payment`
2. User upload bukti transfer → `status: pending_verification`
3. Admin review → Approve atau Reject
4. Jika approved → User `isPremium: true`, update `UsageLimit`

**Digunakan untuk:**
- ✅ Pro package purchase
- ✅ Payment verification system
- ✅ Admin payment approval
- ✅ Payment history tracking

**Relasi:**
- Child of: User
- Triggers update: User (isPremium), UsageLimit

---

### 8. ⏱️ **UsageLimit** - Tabel Limit Penggunaan

**Fungsi Utama:**  
Tracking & enforce limit harian untuk fitur premium (AI generation & frame upload).

**Field Penting:**
- `userId` - User yang dilimit
- `date` - Tanggal (format: YYYY-MM-DD) → reset setiap hari
- `aiGenerationCount` - Jumlah AI frame yang sudah dibuat hari ini
- `aiGenerationLimit` - Limit AI generation (Free: 0, Pro: unlimited)
- `frameUploadCount` - Jumlah frame custom yang diupload hari ini
- `frameUploadLimit` - Limit frame upload (Free: 0, Pro: unlimited)
- `packageType` - Enum: `free` atau `pro`

**Limits:**
```
FREE USER:
- AI Generation: 0/day (tidak bisa)
- Frame Upload: 0/day (tidak bisa)

PRO USER:
- AI Generation: Unlimited
- Frame Upload: Unlimited
```

**Digunakan untuk:**
- ✅ Enforce daily limits
- ✅ Prevent abuse
- ✅ Differentiate free vs pro users
- ✅ Auto-reset setiap hari (berdasarkan field `date`)

**Relasi:**
- Child of: User
- Updated by: AI generation, frame upload actions

---

## 🎨 Tabel User Generated Content - 2 Tabel

### 9. 🖌️ **UserGeneratedFrame** - Frame Buatan User (Private)

**Fungsi Utama:**  
Menyimpan frame custom yang dibuat user dengan AI untuk penggunaan pribadi.

**Field Penting:**
- `userId` - User yang membuat
- `name`, `description` - Info frame
- `thumbnail`, `frameUrl` - Preview & SVG frame
- `frameCount` - Jumlah foto dalam frame (2-6)
- `layoutPositions` - Layout foto dalam frame
- `frameSpec` - Spesifikasi frame (layout, colors, gradient)
- `isActive` - Frame masih aktif
- `isFavorite` - User tandai sebagai favorit
- `usageCount` - Berapa kali frame digunakan

**Fitur:**
- ✅ **Pro-only feature**
- ✅ Personal frame library
- ✅ Reuse custom frames
- ✅ Favorite management

**Digunakan untuk:**
- ✅ Simpan AI-generated frames untuk reuse
- ✅ Personal frame collection
- ✅ Track frame usage

**Relasi:**
- Child of: User
- Access controlled by: UsageLimit (Pro feature)

---

### 10. 📤 **UserSubmittedFrame** - Frame Submit untuk Approval

**Fungsi Utama:**  
User submit frame custom untuk di-approve admin menjadi template publik.

**Field Penting:**
- `userId` - User yang submit
- `name`, `description` - Info frame
- `frameUrl`, `thumbnail` - SVG & preview
- `frameCount` - Jumlah foto dalam frame (1-9)
- `layout` - Enum: `vertical`, `horizontal`, `grid`
- `frameSpec`, `layoutPositions` - Spesifikasi frame
- `status` - Enum: `pending`, `approved`, `rejected`
- `isPremium` - Apakah akan jadi template premium
- `rejectionReason` - Alasan ditolak
- `approvedAt`, `approvedBy` - Waktu & admin yang approve

**Workflow:**
1. Pro user submit frame → `status: pending`
2. Admin review di admin panel
3. Admin approve → Create entry di `Template` table
4. Admin reject → Update `status: rejected` + `rejectionReason`

**Digunakan untuk:**
- ✅ User contribution system
- ✅ Community-generated templates
- ✅ Admin approval workflow
- ✅ Expand template library

**Relasi:**
- Child of: User
- Creates (when approved): Template

---

## 📊 Tabel System & Analytics - 3 Tabel

### 11. 📈 **AnalyticsEvent** - Event Tracking

**Fungsi Utama:**  
Tracking semua event/aktivitas user untuk analytics & business intelligence.

**Field Penting:**
- `userId` - User yang melakukan event (optional)
- `sessionId` - Session terkait (optional)
- `eventType` - Jenis event (misal: `template_view`, `composite_created`)
- `eventCategory` - Kategori event
- `templateId` - Template terkait (optional)
- `metadata` - Data tambahan event
- `deviceInfo` - Info device user
- `ipAddress` - IP address
- `referrer` - From mana user datang
- `timestamp` - Kapan event terjadi

**Event Types:**
- `template_view` - User lihat template
- `composite_created` - User buat composite
- `frame_generated` - AI generate frame
- `payment_created` - Payment dibuat
- Dan event custom lainnya

**Special Features:**
- ✅ **TTL Index**: Auto-delete events older than 90 days
- ✅ Anonymous tracking (userId optional)
- ✅ Compound indexes untuk fast queries

**Digunakan untuk:**
- ✅ Dashboard statistics
- ✅ Template popularity tracking
- ✅ User behavior analysis
- ✅ Business intelligence

**Relasi:**
- References: User, Template
- Auto-cleanup: 90 days

---

### 12. 🔔 **Notification** - Notifikasi User

**Fungsi Utama:**  
Menyimpan notifikasi untuk user (in-app notifications).

**Field Penting:**
- `userId` - User yang menerima notifikasi
- `title` - Judul notifikasi
- `message` - Isi notifikasi
- `type` - Enum: `template`, `user`, `system`, `analytics`
- `isRead` - Sudah dibaca atau belum
- `data` - Data tambahan (JSON)

**Notification Types:**
- `template` - Notifikasi terkait template (approval, dll)
- `user` - Notifikasi terkait user (premium status, dll)
- `system` - System notifications
- `analytics` - Analytics alerts

**Triggered by:**
- ✅ User registration (welcome notification)
- ✅ Payment approved/rejected
- ✅ Frame submission approved/rejected
- ✅ System announcements
- ✅ Admin actions

**Digunakan untuk:**
- ✅ In-app notifications
- ✅ User engagement
- ✅ Important alerts
- ✅ Activity updates

**Relasi:**
- Child of: User

---

### 13. 💬 **Feedback** - Form Kontak

**Fungsi Utama:**  
Menyimpan feedback/pesan dari contact form.

**Field Penting:**
- `name` - Nama pengirim
- `email` - Email pengirim
- `message` - Isi pesan
- `status` - Enum: `unread`, `read`, `replied`

**Features:**
- ✅ **Public contact form** (tidak perlu login)
- ✅ Admin dapat manage & reply
- ✅ Simple feedback system

**Status Workflow:**
1. User kirim feedback → `status: unread`
2. Admin baca → `status: read`
3. Admin reply → `status: replied`

**Digunakan untuk:**
- ✅ Contact form publik
- ✅ User feedback collection
- ✅ Support system sederhana

**Relasi:**
- Standalone (tidak ada foreign key)

---

## 🔗 Diagram Relasi

```
                            ┌─────────────┐
                            │    USER     │ ◄── Central Hub
                            │  (Pengguna) │
                            └──────┬──────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   PAYMENT    │          │ PHOTO SESSION│          │   TEMPLATE   │
│ (Pembayaran) │          │  (Sesi Foto) │          │   (Frame)    │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │                         │                          │
       │                         │                          │
       ▼                         ▼                          │
┌──────────────┐          ┌──────────────┐                 │
│ USAGE LIMIT  │          │CAPTURED PHOTO│                 │
│(Daily Limits)│          │(Foto Mentah) │                 │
└──────────────┘          └──────┬───────┘                 │
                                 │                          │
                                 ▼                          │
                          ┌──────────────┐                 │
                          │FINAL COMPOSITE│◄───────────────┘
                          │ (Hasil Jadi) │
                          └──────────────┘

User Generated Content:
┌────────────────────────┐    ┌────────────────────────┐
│ USER GENERATED FRAME   │    │ USER SUBMITTED FRAME   │
│   (Private Library)    │    │  (Public Submission)   │
└────────────────────────┘    └───────────┬────────────┘
                                          │
                                          ▼ (approved)
                                  ┌───────────────┐
                                  │   TEMPLATE    │
                                  └───────────────┘

System Tables:
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ANALYTICS EVENT │    │  NOTIFICATION  │    │    FEEDBACK    │
│   (Tracking)   │    │   (Alerts)     │    │ (Contact Form) │
└────────────────┘    └────────────────┘    └────────────────┘

Legacy:
┌────────────────┐
│ PHOTO (Old) ⚠️ │
│  (Deprecated)  │
└────────────────┘
```

---

## 📋 Summary Relasi Antar Tabel

### User (Parent untuk 10 tabel):
1. User → Payment (1:N)
2. User → PhotoSession (1:N)
3. User → CapturedPhoto (1:N)
4. User → FinalComposite (1:N)
5. User → Photo (1:N) - deprecated
6. User → UserGeneratedFrame (1:N)
7. User → UserSubmittedFrame (1:N)
8. User → UsageLimit (1:N)
9. User → Notification (1:N)
10. User → AnalyticsEvent (1:N)

### Template (Digunakan oleh 4 tabel):
1. Template → PhotoSession (1:N)
2. Template → FinalComposite (1:N)
3. Template → Photo (1:N) - deprecated
4. Template → AnalyticsEvent (1:N)

### PhotoSession (Menghubungkan foto ke hasil):
1. PhotoSession → CapturedPhoto (1:N)
2. PhotoSession → FinalComposite (1:1)

### Payment (Trigger updates):
1. Payment → User.isPremium (update)
2. Payment → UsageLimit (create/update)

### UserSubmittedFrame (Workflow):
1. UserSubmittedFrame → Template (create when approved)

---

## 🎯 Kategori Tabel

### **Core Business Logic (6 tabel):**
- User, Template, PhotoSession, CapturedPhoto, FinalComposite, Photo

### **Monetization (2 tabel):**
- Payment, UsageLimit

### **User Content (2 tabel):**
- UserGeneratedFrame, UserSubmittedFrame

### **System & Support (3 tabel):**
- AnalyticsEvent, Notification, Feedback

---

## ✅ Status Penggunaan

| Status | Jumlah | Tabel |
|--------|--------|-------|
| ✅ Sangat Aktif | 5 | User, Template, FinalComposite, Payment, Photo |
| ✅ Aktif | 7 | PhotoSession, CapturedPhoto, UsageLimit, UserGeneratedFrame, UserSubmittedFrame, AnalyticsEvent, Notification |
| ✅ Moderat | 1 | Feedback |
| ⚠️ Deprecated | 1 | Photo (masih dipakai) |

**Total:** 13/13 tabel aktif digunakan (100%)

---

## 🚀 Kesimpulan

1. ✅ **Semua 13 tabel aktif digunakan** dalam aplikasi
2. ✅ **Relasi antar tabel tertata dengan baik** dengan foreign keys yang jelas
3. ✅ **Database structure scalable** untuk pertumbuhan aplikasi
4. ✅ **Performance optimized** dengan indexes yang tepat
5. ⚠️ **1 tabel deprecated** (Photo) yang perlu di-migrasi ke FinalComposite

Database KaryaKlik memiliki struktur yang solid dan siap untuk production! 🎉

---

**Dibuat oleh:** GitHub Copilot  
**Tanggal:** January 4, 2026  
**Version:** 1.0
