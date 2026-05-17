# 🧹 Refactor Plan — Arctic Clarity (v2 - Optimized)
> Dibuat berdasarkan audit source code dan evaluasi kritis performa, keamanan (race condition), serta arsitektur database.
> Urutan dikerjakan dari yang paling berdampak luas ke yang paling spesifik.

---

## Plan 1 — `src/lib/formatters.js`
**Dampak: 10 file** | Effort: ~30 menit | Prioritas: 🔴 Tinggi

### Masalah
Fungsi format (Rupiah dan tanggal) ditulis ulang di 10 tempat berbeda. Selain masalah *maintenance*, melakukan `new Intl.NumberFormat` berulang kali di dalam loop render cukup memakan resource (kurang optimal secara performa).

### Solusi: buat `src/lib/formatters.js` dengan pola *Singleton*

```js
// src/lib/formatters.js

const LOCALE = 'id-ID'
const CURRENCY = 'IDR'

// Instansiasi di luar fungsi (Singleton) agar performa lebih ringan
const rupiahFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

const rupiahCompactFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
})

const angkaFormatter = new Intl.NumberFormat(LOCALE)

/**
 * Format angka ke Rupiah penuh (contoh: "Rp 15.000.000")
 */
export const formatRupiah = (amount) => rupiahFormatter.format(amount ?? 0)

/**
 * Format angka ke Rupiah ringkas (contoh: "Rp 15 jt")
 */
export const formatRupiahCompact = (amount) => rupiahCompactFormatter.format(amount ?? 0)

/**
 * Format angka biasa (contoh: "15.000.000")
 */
export const formatAngka = (number) => angkaFormatter.format(number ?? 0)

/**
 * Format tanggal
 */
export const formatTanggal = (isoString, options = {}) =>
  new Date(isoString).toLocaleDateString(LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric', ...options,
  })

/**
 * Format tanggal + jam
 */
export const formatTanggalJam = (isoString) =>
  new Date(isoString).toLocaleDateString(LOCALE, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
```

---

## Plan 2 — Pisahkan data buyer dari kolom `notes` di Checkout
**Dampak: database + 2 file** | Effort: ~1 jam | Prioritas: 🔴 Tinggi

### Masalah
Data pembeli online digabung jadi string di kolom `notes` (misal: `Alamat: X | No. HP: Y | Nama: Z`). Ini sangat rapuh, tidak bisa di-_query_, dan bisa merusak UI jika teks berantakan (mengandung karakter pemisah). Ini isu arsitektur database krusial.

### Solusi — migrasi Supabase + update kode

**Langkah 1: Tambah kolom di tabel `transactions` via Supabase Dashboard / SQL**
```sql
ALTER TABLE transactions
  ADD COLUMN buyer_name    TEXT,
  ADD COLUMN buyer_phone   TEXT,
  ADD COLUMN buyer_address TEXT;
```

**Langkah 2: Update `Checkout.jsx`**
```jsx
const { data: transaction } = await supabase
  .from('transactions')
  .insert([{
    user_id: user?.id,
    total_amount: totalAmount,
    // ...
    buyer_name: formData.name,
    buyer_phone: formData.phone,
    buyer_address: formData.address,
    notes: formData.notes || null, // notes murni untuk catatan tambahan
  }])
```

**Langkah 3: Update `OnlineOrders.jsx`**
```jsx
// Ganti parsing string notes dengan pemanggilan kolom langsung
<p>{order.buyer_name}</p>
<p>{order.buyer_phone}</p>
<p>{order.buyer_address}</p>
```

---

## Plan 3 — `src/lib/stockUtils.js` (Hanya via RPC)
**Dampak: 2 file** | Effort: ~20 menit | Prioritas: 🔴 Tinggi

### Masalah
Pengurangan stok tersebar dan beberapa menggunakan logika manual (`select` lalu `update`) di JS. Logika manual sangat rentan terhadap **Race Condition** saat dibeli bersamaan.

### Solusi: Panggil secara atomik menggunakan RPC
Pastikan ada function RPC di Supabase `decrement_stock`. Jika tidak ada, wajib dibuat. Hapus logika *fallback* manual di *client-side*.

```js
// src/lib/stockUtils.js
import { supabase } from './supabase'

/**
 * Kurangi stok dengan atomic operation. Jika gagal, return error (jangan hitung manual).
 */
export const decrementStockBatch = async (items) => {
  const errors = []

  for (const item of items) {
    const { error: rpcError } = await supabase.rpc('decrement_stock', {
      product_id: item.product_id,
      amount: item.quantity,
    })

    if (rpcError) {
      errors.push({ product_id: item.product_id, error: rpcError.message })
    }
  }

  return { success: errors.length === 0, errors }
}
```

---

## Plan 4 — `src/lib/statusUtils.js`
**Dampak: 3 file** | Effort: ~20 menit | Prioritas: 🟡 Menengah

### Masalah
Fungsi pelabelan status ditulis tiga kali dengan output yang tidak konsisten.

### Solusi
Sentralisasi fungsi status ke `src/lib/statusUtils.js`.
*(Sama seperti detail pada plan awal)*

---

## Plan 5 — Komponen `<PageLoader>` dan `<EmptyState>`
**Dampak: 11 file** | Effort: ~30 menit | Prioritas: 🟡 Menengah

### Masalah
Pola UI loading dan empty state ditulis berulang.

### Solusi
Buat dan gunakan komponen reusable `PageLoader.jsx`, `InlineLoader.jsx`, dan `EmptyState.jsx`.
*(Sama seperti detail pada plan awal)*

---

## Plan 6 — Ganti `Math.random()` untuk file upload dengan Fallback UUID
**Dampak: 2 file** | Effort: 5 menit | Prioritas: 🟡 Menengah

### Masalah
`Math.random()` bisa bentrok. `crypto.randomUUID()` elegan, namun hanya bekerja di *Secure Context* (HTTPS/localhost). Jika diakses di IP lokal HP tanpa HTTPS, fungsi ini crash (`undefined`).

### Solusi
Tambahkan *fallback* agar tetap jalan di semua *environment*.

**Checkout.jsx & ProductDetails.jsx:**
```jsx
// Helper fungsi untuk generate ID
const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const fileName = `${generateUniqueId()}.${fileExt}`
```

---

## Plan 7 — Ganti semua `alert()` dengan `react-hot-toast`
**Dampak: 8 file, 16 pemanggilan alert** | Effort: ~45 menit | Prioritas: 🟡 Menengah

### Solusi
Sama seperti plan awal, gunakan `react-hot-toast` untuk menggantikan eksekusi sinkronus `alert()` yang memblokir UI dan memiliki visual kurang menarik.

---

## Plan 8 — Bersihkan `console.log` debug
**Dampak: 3 file** | Effort: 10 menit | Prioritas: 🟢 Rendah

### Solusi
Sembunyikan log di belakang pengecekan `import.meta.env.DEV` atau ganti ke `console.error` bila dirasa krusial.

---

## Plan 9 — Seragamkan nama tabel servis: hapus `useServiceOrders`
**Dampak: 1 file** | Effort: 10 menit | Prioritas: 🟢 Rendah

### Solusi
Hapus _hook dead code_ `useServiceOrders` dari `useSupabase.js` jika memang semua komponen sudah diarahkan ke tabel `service_jobs`.

---

## Ringkasan Urutan Pengerjaan Baru

| # | Plan | File baru/ubah | Effort | Prioritas |
|---|------|---------------|--------|-----------|
| 1 | `formatters.js` (Singleton) | 1 baru + 10 ubah | 30 mnt | 🔴 Tinggi |
| 2 | Kolom buyer di DB (Arsitektur) | migrasi SQL + 2 ubah | 1 jam | 🔴 Tinggi |
| 3 | `stockUtils.js` (Atomic RPC Only) | 1 baru + 2 ubah | 20 mnt | 🔴 Tinggi |
| 4 | `statusUtils.js` | 1 baru + 3 ubah | 20 mnt | 🟡 Menengah |
| 5 | `PageLoader` + `EmptyState` | 3 baru + 11 ubah | 30 mnt | 🟡 Menengah |
| 6 | Upload ID Fallback | 2 ubah | 5 mnt | 🟡 Menengah |
| 7 | `react-hot-toast` | install + 8 ubah | 45 mnt | 🟡 Menengah |
| 8 | Hapus `console.log` | 3 ubah | 10 mnt | 🟢 Rendah |
| 9 | Hapus `useServiceOrders` | 1 ubah | 10 mnt | 🟢 Rendah |
