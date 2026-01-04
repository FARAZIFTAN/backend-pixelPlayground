# 📊 Analisis Penggunaan Database KaryaKlik

## 📋 Executive Summary

**Total Tabel:** 13 tabel  
**Status:** ✅ **SEMUA TABEL AKTIF DIGUNAKAN**  
**Tabel Deprecated:** 1 tabel (Photo - masih digunakan untuk backward compatibility)

---

## ✅ STATUS PENGGUNAAN SETIAP TABEL

### 🟢 TABEL INTI (CORE) - 6 Tabel

#### 1. **User** ✅ AKTIF DIGUNAKAN
**Status:** Sangat Aktif  
**Jumlah Endpoint:** 20+ endpoints  
**Fungsi Utama:**
- Authentication & Authorization (login, register, verify)
- User Management (profile, settings, password)
- Admin Management (user CRUD, block, delete)
- Premium Management (upgrade, status tracking)

**API Endpoints:**
- `/api/auth/*` - Login, register, verify, reset password
- `/api/users/*` - Profile, settings, password, upgrade
- `/api/admin/users/*` - User management
- `/api/users/[id]/*` - User details, activities, premium status

**Relasi:**
- Parent untuk: Payment, PhotoSession, CapturedPhoto, FinalComposite, UserGeneratedFrame, UserSubmittedFrame, UsageLimit, Notification, AnalyticsEvent

---

#### 2. **Template** ✅ AKTIF DIGUNAKAN
**Status:** Sangat Aktif  
**Jumlah Endpoint:** 9+ endpoints  
**Fungsi Utama:**
- Template Gallery (public & premium templates)
- AI Template Creation & Storage
- Template Statistics & Analytics
- Frame Approval System

**API Endpoints:**
- `/api/templates` - GET all templates, POST new template
- `/api/templates/[id]` - GET, PUT, DELETE template
- `/api/templates/[id]/stats` - Template usage statistics
- `/api/ai/save-frame` - Save AI-generated templates
- `/api/admin/frame-submissions` - Approve/reject user-submitted frames
- `/api/composites/*` - Used in composite creation

**Relasi:**
- Referenced by: PhotoSession, FinalComposite, Photo (deprecated), AnalyticsEvent

---

#### 3. **PhotoSession** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 8+ endpoints  
**Fungsi Utama:**
- Photo Booth Session Management
- Track user photo-taking sessions
- Link captured photos to final composites
- Session lifecycle (start, active, completed, cancelled)

**API Endpoints:**
- `/api/sessions` - GET user sessions, POST new session
- `/api/sessions/[id]` - GET, PUT, DELETE session
- `/api/photos/upload` - Upload photos to session
- `/api/composites` - Create composite from session
- `/api/users/[id]/activities` - User session history

**Relasi:**
- Child of: User, Template
- Parent of: CapturedPhoto, FinalComposite

---

#### 4. **CapturedPhoto** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 3+ endpoints  
**Fungsi Utama:**
- Store individual photos from photo booth
- Maintain photo order in sessions
- Link photos to specific sessions

**API Endpoints:**
- `/api/photos/upload` - Upload captured photos
- `/api/sessions` - List photos in session
- `/api/sessions/[id]` - Get session with captured photos

**Relasi:**
- Child of: PhotoSession, User
- Used in: FinalComposite creation

---

#### 5. **FinalComposite** ✅ AKTIF DIGUNAKAN
**Status:** Sangat Aktif  
**Jumlah Endpoint:** 11+ endpoints  
**Fungsi Utama:**
- Store final composite images (hasil jadi)
- Gallery management (public/private)
- Share functionality
- Analytics & dashboard statistics

**API Endpoints:**
- `/api/composites` - GET all composites, POST new composite
- `/api/composites/[id]` - GET, DELETE composite
- `/api/composites/upload` - Upload composite manually
- `/api/share/[id]` - Share composite publicly
- `/api/share/public/[id]` - View shared composite
- `/api/dashboard/stats` - Dashboard statistics
- `/api/dashboard/activity` - Recent activity
- `/api/templates/[id]/stats` - Template usage stats
- `/api/users/[id]/activities` - User composite history

**Relasi:**
- Child of: PhotoSession, User, Template
- Used in: Dashboard, Gallery, Analytics

---

#### 6. **Photo (Deprecated)** ⚠️ MASIH DIGUNAKAN
**Status:** Deprecated tapi masih aktif untuk backward compatibility  
**Jumlah Endpoint:** 18+ endpoints (legacy)  
**Fungsi Utama:**
- Legacy gallery system
- User photo management (old system)
- Public gallery display

**API Endpoints:**
- `/api/photos` - Legacy photo listing
- `/api/photos/[id]` - GET, PUT, DELETE photo
- `/api/photos/[id]/like` - Like photo
- `/api/photos/[id]/view` - Track views
- `/api/gallery/*` - Gallery endpoints
- `/api/users/delete` - Cascade delete photos

**⚠️ Catatan:**
- Masih digunakan untuk backward compatibility
- Fitur baru menggunakan FinalComposite
- Bisa dihapus setelah migrasi data lengkap

---

### 💰 TABEL PAYMENT & PREMIUM - 2 Tabel

#### 7. **Payment** ✅ AKTIF DIGUNAKAN
**Status:** Sangat Aktif  
**Jumlah Endpoint:** 7+ endpoints  
**Fungsi Utama:**
- Pro Package Purchase Management
- Payment Proof Upload & Verification
- Admin Payment Approval/Rejection
- Payment History Tracking

**API Endpoints:**
- `/api/payments` - GET user payments, POST new payment
- `/api/payments/[id]/cancel` - Cancel payment
- `/api/payments/upload-proof` - Upload payment proof
- `/api/admin/payments` - List all payments (admin)
- `/api/admin/payments/[id]/approve` - Approve payment
- `/api/admin/payments/[id]/reject` - Reject payment
- `/api/admin/payments/cleanup-old` - Cleanup old pending payments

**Relasi:**
- Child of: User
- Triggers: UsageLimit update, User premium status update

---

#### 8. **UsageLimit** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 4+ endpoints  
**Fungsi Utama:**
- Track daily usage limits (AI generation, frame upload)
- Enforce free vs pro limits
- Reset daily limits automatically

**API Endpoints:**
- `/api/ai/generate-frame` - Check & update AI generation limit
- `/api/user-frames` - Check & update frame upload limit
- `/api/admin/payments/[id]/approve` - Update limits on payment approval
- `/api/admin/payments` - View user limits

**Relasi:**
- Child of: User
- Updated by: Payment approval, AI generation, Frame upload

**Limits:**
- **Free User:** AI Generation = 0/day, Frame Upload = 0/day
- **Pro User:** AI Generation = unlimited, Frame Upload = unlimited

---

### 🎨 TABEL USER GENERATED CONTENT - 2 Tabel

#### 9. **UserGeneratedFrame** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 2+ endpoints  
**Fungsi Utama:**
- Store user's custom AI-generated frames
- Personal frame library for pro users
- Frame reuse and favorites

**API Endpoints:**
- `/api/user-frames` - GET user frames, POST new frame (Pro only)
- `/api/user-frames/[id]` - GET, DELETE user frame

**Relasi:**
- Child of: User
- Controlled by: UsageLimit (Pro feature)

**⚠️ Catatan:**
- Pro-only feature
- Requires active premium subscription
- Limited by UsageLimit

---

#### 10. **UserSubmittedFrame** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 5+ endpoints  
**Fungsi Utama:**
- User frame submission for approval
- Admin frame approval workflow
- Convert approved frames to public templates

**API Endpoints:**
- `/api/user-submissions/frames` - GET user submissions, POST new submission
- `/api/user-submissions/frames/[id]` - GET submission details
- `/api/admin/frame-submissions` - List all submissions (admin)
- `/api/admin/frame-submissions/[id]/approve` - Approve submission → Create Template
- `/api/admin/frame-submissions/[id]/reject` - Reject submission

**Relasi:**
- Child of: User
- Creates: Template (when approved)
- Admin approval required

**Workflow:**
1. User submits frame → `status: pending`
2. Admin reviews → Approve or Reject
3. If approved → Create new Template entry
4. If rejected → Store rejection reason

---

### 📈 TABEL SYSTEM & ANALYTICS - 3 Tabel

#### 11. **AnalyticsEvent** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 6+ endpoints  
**Fungsi Utama:**
- Track user behavior & events
- Template usage analytics
- Dashboard statistics
- Auto-cleanup old events (90 days TTL)

**API Endpoints:**
- `/api/analytics/track` - Track custom events
- `/api/analytics` - Get analytics summary
- `/api/templates/[id]/stats` - Template-specific analytics
- `/api/users/[id]/activities` - User activity tracking

**Event Types:**
- `template_view` - Template viewed
- `composite_created` - Composite created
- `frame_generated` - AI frame generated
- `payment_created` - Payment initiated
- Custom events

**Relasi:**
- References: User, Template
- TTL: Auto-delete after 90 days

---

#### 12. **Notification** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 4+ endpoints  
**Fungsi Utama:**
- User notifications (in-app)
- Admin notifications
- System alerts
- Read/unread tracking

**API Endpoints:**
- `/api/notifications` - GET user notifications
- `/api/notifications/mark-read` - Mark notifications as read
- Used by: `notificationService` (lib/notificationService.ts)

**Notification Types:**
- `template` - Template-related notifications
- `user` - User-related notifications
- `system` - System notifications
- `analytics` - Analytics alerts

**Relasi:**
- Child of: User
- Created by: System events, Admin actions

**Triggered by:**
- New user registration
- Payment approval/rejection
- Frame submission approval/rejection
- System alerts

---

#### 13. **Feedback** ✅ AKTIF DIGUNAKAN
**Status:** Aktif  
**Jumlah Endpoint:** 2+ endpoints  
**Fungsi Utama:**
- Contact form submissions
- User feedback collection
- Admin feedback management

**API Endpoints:**
- `/api/feedback` - GET all feedback (admin), POST new feedback
- `/api/feedback/[id]` - GET, PUT, DELETE feedback

**Status Workflow:**
- `unread` - New feedback
- `read` - Admin viewed
- `replied` - Admin replied

**⚠️ Catatan:**
- Tidak memerlukan authentication untuk submit
- Public contact form
- Admin-only untuk view & manage

---

## 📊 STATISTIK PENGGUNAAN

| Tabel | Status | Endpoints | Kategori | Prioritas |
|-------|--------|-----------|----------|-----------|
| User | ✅ Sangat Aktif | 20+ | Core | Critical |
| Template | ✅ Sangat Aktif | 9+ | Core | Critical |
| PhotoSession | ✅ Aktif | 8+ | Core | High |
| CapturedPhoto | ✅ Aktif | 3+ | Core | High |
| FinalComposite | ✅ Sangat Aktif | 11+ | Core | Critical |
| Photo | ⚠️ Deprecated | 18+ | Legacy | Low (to remove) |
| Payment | ✅ Sangat Aktif | 7+ | Payment | Critical |
| UsageLimit | ✅ Aktif | 4+ | Payment | High |
| UserGeneratedFrame | ✅ Aktif | 2+ | User Content | Medium |
| UserSubmittedFrame | ✅ Aktif | 5+ | User Content | High |
| AnalyticsEvent | ✅ Aktif | 6+ | System | Medium |
| Notification | ✅ Aktif | 4+ | System | High |
| Feedback | ✅ Aktif | 2+ | System | Low |

---

## 🔗 PETA RELASI DATABASE

```
                                    ┌──────────┐
                                    │   USER   │ (Central Hub)
                                    └─────┬────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
            ┌───────▼────────┐    ┌──────▼──────┐      ┌──────▼──────┐
            │    Payment     │    │ PhotoSession│      │  Template   │
            │   (Pro Pkg)    │    │  (Session)  │      │  (Frames)   │
            └───────┬────────┘    └──────┬──────┘      └──────┬──────┘
                    │                     │                     │
                    ▼                     ▼                     │
            ┌───────────────┐    ┌────────────────┐           │
            │  UsageLimit   │    │ CapturedPhoto  │           │
            │  (Daily Limits)│   │  (Raw Photos)  │           │
            └───────────────┘    └────────┬───────┘           │
                                          │                    │
                                          ▼                    │
                                 ┌─────────────────┐          │
                                 │ FinalComposite  │◄─────────┘
                                 │  (Hasil Jadi)   │
                                 └─────────────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ AnalyticsEvent  │
                                 │  (Tracking)     │
                                 └─────────────────┘

            User Generated Content:
            ┌──────────────────────┐    ┌────────────────────────┐
            │ UserGeneratedFrame   │    │ UserSubmittedFrame     │
            │  (Pro User Frames)   │    │  (Pending Approval)    │
            └──────────────────────┘    └───────────┬────────────┘
                                                    │
                                                    ▼ (approved)
                                            ┌───────────────┐
                                            │   Template    │
                                            └───────────────┘

            System Tables:
            ┌──────────────────┐    ┌──────────────────┐
            │   Notification   │    │     Feedback     │
            │  (User Alerts)   │    │  (Contact Form)  │
            └──────────────────┘    └──────────────────┘

            Legacy (Deprecated):
            ┌──────────────────┐
            │      Photo       │ ⚠️
            │   (Old Gallery)  │
            └──────────────────┘
```

---

## ✅ KESIMPULAN

### 1. **Semua 13 Tabel Aktif Digunakan**
Tidak ada tabel yang tidak terpakai. Setiap tabel memiliki endpoint API dan fungsi yang jelas.

### 2. **Tabel Deprecated**
- **Photo**: Masih digunakan untuk backward compatibility (18+ endpoints aktif)
- **Rekomendasi**: Migrasi data ke FinalComposite, lalu hapus

### 3. **Tabel Paling Kritis**
1. **User** - 20+ endpoints (authentication, authorization, management)
2. **FinalComposite** - 11+ endpoints (gallery, sharing, dashboard)
3. **Template** - 9+ endpoints (frame library, AI generation)
4. **Payment** - 7+ endpoints (pro package system)

### 4. **Tabel dengan Fungsi Khusus**
- **UsageLimit**: Enforce free vs pro limits (daily reset)
- **AnalyticsEvent**: Auto-cleanup after 90 days (TTL index)
- **Notification**: Real-time user alerts
- **Feedback**: Public contact form (no auth required)

### 5. **Relasi Antar Tabel**
Semua tabel saling terhubung dengan baik:
- **User** sebagai central hub (parent dari 9 tabel)
- **Template** digunakan di 4 tabel lain
- **PhotoSession** menghubungkan photos → composite
- **Payment** trigger update ke User & UsageLimit

---

## 🎯 REKOMENDASI

### Prioritas Tinggi
1. ✅ **Pertahankan semua tabel** - semua aktif digunakan
2. ⚠️ **Rencanakan migrasi Photo → FinalComposite**
   - Buat script migrasi data
   - Test backward compatibility
   - Gradual deprecation

### Prioritas Sedang
3. 📊 **Monitor AnalyticsEvent size** - dengan TTL 90 hari
4. 🔔 **Add notification deduplication** - cek sudah ada di index
5. 🎨 **UserGeneratedFrame usage tracking** - monitor adoption

### Prioritas Rendah
6. 📝 **Feedback auto-archive** - setelah 1 tahun
7. 🧹 **Regular cleanup old PhotoSessions** - cancelled sessions
8. 📈 **Add more analytics events** - for better insights

---

## 📝 CATATAN TAMBAHAN

### Database Performance
- ✅ Semua tabel memiliki index yang tepat
- ✅ Foreign keys properly defined
- ✅ TTL index untuk auto-cleanup (AnalyticsEvent)
- ✅ Compound indexes untuk query optimization

### Data Integrity
- ✅ Enum validation untuk status fields
- ✅ Required fields validation
- ✅ Cascade delete handling
- ✅ Soft delete untuk User (isDeleted flag)

### Scalability
- ✅ Photo/composite storage di filesystem (bukan DB)
- ✅ Thumbnail generation untuk performance
- ✅ Public/private visibility control
- ✅ Pagination support di semua list endpoints

---

**Dokumentasi ini dibuat pada:** January 4, 2026  
**Database Version:** MongoDB with Mongoose ODM  
**Total Tables:** 13 (all active)  
**Total API Endpoints:** 100+ endpoints
