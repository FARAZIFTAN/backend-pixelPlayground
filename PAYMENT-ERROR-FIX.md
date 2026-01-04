# Payment Error 400/500 - Troubleshooting Guide

## 🔴 Problem
Error terjadi saat klik "Upgrade Sekarang":
- `Failed to load resource: 400 (Bad Request)` - Ada pending payment lama
- `Failed to load resource: 500 (Internal Server Error)` - Payment lama menggunakan package type yang invalid (basic/plus/enterprise)

## ✅ Solution Implemented

### 1. **Auto-Cleanup Old Payments** (Frontend)
Frontend sekarang otomatis mendeteksi dan menghapus payment lama saat user klik "Upgrade Sekarang".

**Code Location:** `frontend-pixelPlayground/src/pages/UpgradePro.tsx` lines 100-145

**How it works:**
- Saat error "already have pending payment" terjadi
- Check apakah payment tersebut menggunakan package type lama (basic/plus/enterprise)
- Jika iya, otomatis hapus payment lama
- Tampilkan toast notification "Old Payment Removed"
- User bisa klik "Upgrade Sekarang" lagi

### 2. **Force Cancel for Old Package Types** (Backend)
Cancel endpoint sekarang bisa force delete payment dengan package type lama.

**Code Location:** `backend-pixelPlayground/src/app/api/payments/[id]/cancel/route.ts` lines 48-55

**How it works:**
- Normal: Hanya bisa cancel payment dengan status `pending_payment`
- Special case: Bisa force cancel payment apapun jika package type bukan 'pro'

### 3. **Better Error Logging** (Backend)
Payment creation API sekarang memberikan error detail yang lebih jelas.

**Code Location:** `backend-pixelPlayground/src/app/api/payments/route.ts` lines 92-100

**What's logged:**
- Full error object
- Error message
- Error stack trace
- Payment creation details (userId, packageName, packageType, amount)

## 🛠️ Manual Cleanup (If Needed)

### Method 1: Using PowerShell Script (Recommended)

1. **Get your token:**
   - Open browser (http://localhost:8080)
   - Press F12 (DevTools)
   - Go to: Application > Session Storage > http://localhost:8080
   - Copy the `token` value

2. **Run cleanup script:**
   ```powershell
   cd C:\KAMPUS\PROJECT3\APK\backend-pixelPlayground
   .\quick-cleanup-payment.ps1
   ```

3. **Paste your token** when prompted

4. **Script will:**
   - List all your payments
   - Auto-delete old package type payments
   - Show success/error for each operation

### Method 2: Using Browser Console

1. Open browser DevTools (F12) > Console
2. Run this code:
   ```javascript
   // Get all payments
   fetch('http://localhost:3001/api/payments', {
     headers: {
       'Authorization': `Bearer ${sessionStorage.getItem('token')}`
     }
   })
   .then(r => r.json())
   .then(data => {
     console.log('Your payments:', data.payments);
     
     // Find old payments
     const oldPayments = data.payments.filter(p => 
       !['pro'].includes(p.packageType) && 
       ['pending_payment', 'pending_verification'].includes(p.status)
     );
     
     console.log('Old payments to delete:', oldPayments);
     
     // Delete each old payment
     oldPayments.forEach(async (payment) => {
       const response = await fetch(`http://localhost:3001/api/payments/${payment._id}/cancel`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
           'Content-Type': 'application/json'
         }
       });
       const result = await response.json();
       console.log(`Deleted ${payment._id}:`, result);
     });
   });
   ```

### Method 3: Using Cancel Button (UI)

1. Refresh halaman upgrade pro
2. Jika ada pending payment lama, akan muncul section "Upload Bukti Pembayaran"
3. Klik tombol **"Batalkan Pembayaran"** (warna merah) di bawah
4. Confirm dialog
5. Payment akan terhapus
6. Klik "Upgrade Sekarang" lagi untuk buat payment baru

## 📊 Expected Flow (After Fix)

### First Click on "Upgrade Sekarang":
1. ❌ Error 400: "You already have pending payment"
2. ✅ Frontend detects old payment (packageType: 'basic'/'plus'/'enterprise')
3. ✅ Auto calls DELETE /api/payments/:id/cancel
4. ✅ Shows toast: "Old Payment Removed"
5. ✅ Reloads payment list (now empty)

### Second Click on "Upgrade Sekarang":
1. ✅ Creates new payment (packageType: 'pro')
2. ✅ Shows payment section
3. ✅ User can upload bukti pembayaran
4. ✅ Amount shows: Rp 150.000
5. ✅ Package shows: KaryaKlik Pro

## 🔍 Verification

### Check if cleanup worked:
```powershell
# In PowerShell terminal
$token = "<your-token>"
Invoke-RestMethod -Uri "http://localhost:3001/api/payments" `
  -Headers @{"Authorization"="Bearer $token"} | 
  Select-Object -ExpandProperty payments | 
  Where-Object { $_.status -in @('pending_payment', 'pending_verification') }
```

**Expected output:** 
- Empty array `[]` = No pending payments (good!)
- Or payment with `packageType: "pro"` only

## 📝 Notes

- Package types: Only `'pro'` is valid now
- Old types: `'basic'`, `'plus'`, `'enterprise'` are deprecated
- Auto-cleanup: Only deletes pending payments (status: pending_payment or pending_verification)
- Approved payments: Old approved payments stay in history (not deleted)

## 🚀 Final Steps

1. **Refresh browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Run cleanup script** (optional, if auto-cleanup didn't work)
3. **Click "Upgrade Sekarang"**
4. **Verify payment shows:**
   - Package: KaryaKlik Pro
   - Amount: Rp 150.000
   - Bank: Bank BCA (1234567890)
5. **Upload bukti transfer**
6. **Wait for admin approval**

## ✅ Success Indicators

- No more error 400/500
- Payment section appears immediately
- Shows "KaryaKlik Pro" package
- Shows correct price: Rp 150.000
- Upload button works
- Cancel button available (red button)

## 🆘 If Still Not Working

1. **Check backend logs:**
   - Look for `[POST /api/payments/create] Error:` messages
   - Check error details in terminal

2. **Check MongoDB:**
   - Verify MONGODB_URI is correct
   - Check if database connection is working

3. **Clear all sessions:**
   ```javascript
   // In browser console
   sessionStorage.clear();
   localStorage.clear();
   location.reload();
   ```
   Then login again

4. **Contact developer with:**
   - Full error message from browser console
   - Backend error logs
   - Your user email
   - Screenshot of error
