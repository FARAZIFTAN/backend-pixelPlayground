# Quick Start - Testing Pro Account System

## 🚀 Start Development Servers

### Backend
```powershell
cd c:\KAMPUS\PROJECT3\APK\backend-pixelPlayground
npm run dev
# Server akan jalan di http://localhost:3001
```

### Frontend
```powershell
cd c:\KAMPUS\PROJECT3\APK\frontend-pixelPlayground
npm run dev
# Server akan jalan di http://localhost:8080
```

---

## 👤 Test Users

### Regular User (untuk testing payment flow)
```
Email: user@test.com
Password: password123
```

### Admin User (untuk approval)
```
Email: admin@karyaklik.com
Password: admin123
```

⚠️ **Note**: Jika admin belum ada, gunakan script ini untuk create:
```javascript
// Run di backend-pixelPlayground folder
node create-admin-user.js
```

---

## 🧪 Complete Test Flow (5 Minutes)

### Step 1: User Creates Payment (2 min)
1. Login sebagai **user@test.com**
2. Klik menu **"My Gallery"** atau **"AI Template Creator"**
3. Akan redirect ke `/upgrade-pro`
4. Pilih salah satu paket:
   - **Pro Basic** (Rp 99.000/bulan): 20 AI/day, 10 uploads/day
   - **Pro Plus** (Rp 199.000/bulan): 50 AI/day, 25 uploads/day
   - **Pro Enterprise** (Rp 499.000/bulan): Unlimited
5. Klik **"Pilih Paket Ini"**
6. ✅ Verify: Bank details muncul (BCA, 1234567890, KaryaKlik)

### Step 2: Upload Payment Proof (1 min)
1. Prepare gambar screenshot transfer (JPG/PNG, max 5MB)
   - Bisa pakai gambar apa saja untuk testing
2. Drag file ke upload area ATAU klik untuk browse
3. ✅ Verify: Preview muncul
4. Klik **"Upload Bukti Pembayaran"**
5. ✅ Verify: 
   - Toast success muncul
   - Status badge berubah: **"Menunggu Verifikasi"** (biru)
   - Image preview ditampilkan

### Step 3: Admin Approves Payment (1 min)
1. **Logout** user, **Login** sebagai **admin@karyaklik.com**
2. Navigate ke **Admin Panel** → **"Payments"** (menu sidebar)
   - Direct URL: http://localhost:8080/admin/payments
3. Klik tab **"Pending"**
4. Find payment yang baru saja dibuat
5. Klik **"View Proof"** untuk verify screenshot
6. Klik **"Approve"**
7. (Optional) Tambah admin notes: "Verified - OK"
8. Klik **"Approve Payment"**
9. ✅ Verify:
   - Toast success: "Payment approved successfully"
   - Status badge berubah: **"Disetujui"** (hijau)
   - Card hilang dari "Pending" tab
   - Muncul di "Approved" tab

### Step 4: Test Pro Access (1 min)
1. **Logout** admin, **Login** kembali sebagai **user@test.com**
2. Check **My Account** page:
   - ✅ Badge **"Pro Member"** muncul
   - ✅ Premium expiry date terlihat (1 bulan dari sekarang)
3. Go to **AI Template Creator**:
   - ✅ Bisa akses (tidak redirect lagi)
   - ✅ Generate frame berhasil
4. Go to **My Gallery**:
   - ✅ Bisa akses
   - ✅ Upload frame berhasil

### Step 5: Test Usage Limits (Optional, 5 min)
1. Still logged in sebagai **user@test.com** dengan Pro Basic
2. Go to **AI Template Creator**
3. Generate frames **20 kali** (sesuai limit Basic)
4. Pada generation ke-21:
   - ✅ Error muncul: **"Daily AI generation limit reached"**
   - ✅ Status code: 429
   - ✅ Message: "You've used 20/20..."
5. Coba lagi **besok** (atau ubah date sistem):
   - ✅ Counter reset otomatis
   - ✅ Bisa generate lagi

---

## 🔴 Test Rejection Flow (Optional)

### Admin Rejects Payment
1. Admin login → Payments → Pending
2. Klik payment yang ingin ditolak
3. Klik **"Reject"**
4. **Wajib** isi **rejection reason**:
   ```
   Nominal transfer tidak sesuai. Harap transfer Rp 99.000 bukan Rp 90.000.
   ```
5. (Optional) Tambah admin notes
6. Klik **"Reject Payment"**
7. ✅ Verify:
   - Status: **"Ditolak"** (merah)
   - Rejection reason terlihat di card

### User Re-uploads Proof
1. User login kembali
2. Go to `/upgrade-pro`
3. Payment card tampil dengan status **"Ditolak"**
4. Rejection reason terlihat
5. Klik **"Upload Bukti Baru"**
6. Upload gambar baru
7. ✅ Status kembali ke **"Menunggu Verifikasi"**
8. Admin bisa approve lagi

---

## 🐛 Troubleshooting

### Backend Errors
```powershell
# Check backend logs
cd c:\KAMPUS\PROJECT3\APK\backend-pixelPlayground
npm run dev

# Common issues:
# 1. MongoDB not connected → Check MONGODB_URI di .env
# 2. Port 3001 in use → Kill process atau ganti port
# 3. Upload folder missing → Create manually:
mkdir -p public/uploads/payment-proofs
```

### Frontend Errors
```powershell
# Check browser console
# Common issues:
# 1. API_BASE_URL wrong → Check .env.local:
#    VITE_API_BASE_URL=http://localhost:3001/api
# 2. CORS error → Pastikan backend jalan di port 3001
# 3. Auth token expired → Logout & login lagi
```

### Database Check
```javascript
// Check payment in MongoDB
// Use MongoDB Compass atau CLI:
db.payments.find({ userId: ObjectId("...") })
db.usagelimits.find({ userId: ObjectId("...") })
```

### File Upload Issues
```powershell
# Check file permissions (Windows)
cd c:\KAMPUS\PROJECT3\APK\backend-pixelPlayground\public\uploads
icacls payment-proofs

# If folder doesn't exist:
mkdir public\uploads\payment-proofs
```

---

## 📊 Expected Console Logs

### When User Creates Payment
```
Backend console:
✓ POST /api/payments 201
  Created payment: { _id: '...', packageType: 'basic', amount: 99000 }

Frontend console:
✓ Payment created successfully
```

### When User Uploads Proof
```
Backend console:
✓ POST /api/payments/upload-proof 200
  File saved: /uploads/payment-proofs/1234567890-proof.jpg
  Payment status: pending_verification

Frontend console:
✓ Bukti pembayaran berhasil diupload
```

### When Admin Approves
```
Backend console:
✓ PUT /api/admin/payments/:id/approve 200
  Payment approved: { _id: '...' }
  User premium activated: { userId: '...', isPremium: true }
  Usage limit created: { packageType: 'basic', aiLimit: 20, uploadLimit: 10 }

Frontend console:
✓ Payment approved successfully
```

### When Limit Exceeded
```
Backend console:
⚠ POST /api/ai/generate-frame 429
  AI generation limit exceeded: User ... has used 20/20 (basic)

Frontend console:
✗ Daily AI generation limit reached
```

---

## ✅ Success Indicators

Jika semua berjalan dengan baik, kamu akan melihat:

✅ **User Flow**
- [ ] Redirect to /upgrade-pro from protected pages
- [ ] Package selection works
- [ ] Bank details displayed
- [ ] File upload successful
- [ ] Payment status updates real-time

✅ **Admin Flow**
- [ ] Can see all payments
- [ ] Tab filtering works (All/Pending/Approved/Rejected)
- [ ] View proof modal works
- [ ] Approve button activates Pro account
- [ ] Reject button requires reason
- [ ] Payments disappear from Pending after action

✅ **Pro Account**
- [ ] isPremium = true in database
- [ ] premiumExpiresAt set correctly
- [ ] UsageLimit document created
- [ ] Can access previously locked features

✅ **Limit Enforcement**
- [ ] AI generation blocked after limit
- [ ] Frame upload blocked after limit
- [ ] Error message shows current usage
- [ ] Limits reset next day
- [ ] Unlimited works for Enterprise

---

## 🎯 Next Steps After Testing

1. **Production Setup**:
   - Update bank account details di `Payment.ts` model
   - Set proper MONGODB_URI
   - Configure file upload path untuk production

2. **Email Notifications** (Optional):
   - Send email saat payment approved
   - Send email saat payment rejected
   - Daily limit warning

3. **Analytics** (Optional):
   - Track revenue per package
   - Monitor conversion rate
   - Popular package analysis

4. **Documentation**:
   - Add user guide untuk payment flow
   - Create FAQ tentang Pro account
   - Document admin procedures

---

## 📞 Need Help?

- Check full documentation: `PRO-ACCOUNT-SYSTEM.md`
- Backend APIs reference: All routes in `src/app/api/payments/` and `src/app/api/admin/payments/`
- Frontend components: `src/pages/UpgradePro.tsx` and `src/pages/admin/PaymentManagement.tsx`
- Database models: `src/models/Payment.ts` and `src/models/UsageLimit.ts`

**Happy Testing!** 🚀
