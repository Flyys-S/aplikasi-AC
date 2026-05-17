# 🧹 Refactor Plan — Arctic Clarity
> Dibuat berdasarkan audit source code. Urutan dikerjakan dari yang paling berdampak luas ke yang paling spesifik.

---

## Plan 1 — `src/lib/formatters.js`
**Dampak: 10 file** | Effort: ~30 menit

### Masalah
Fungsi `formatPrice` dan `Intl.NumberFormat` ditulis **ulang di 10 tempat berbeda**:

| File | Bentuk |
|------|--------|
| `Inventory.jsx` | `const formatPrice = (price) => new Intl.NumberFormat(...)` |
| `Catalog.jsx` | Sama persis |
| `Checkout.jsx` | Sama persis |
| `ProductDetails.jsx` | Sama persis |
| `Transactions.jsx` | Inline langsung di JSX |
| `InvoiceDetail.jsx` | Inline, 4 variasi berbeda dalam satu file |
| `NewTransaction.jsx` | Inline, format berbeda (`Rp` hardcoded) |
| `SalesDashboard.jsx` | `notation: 'compact'` — berbeda lagi |
| `CustomerDetail.jsx` | Mix antara `compact` dan `currency` |
| `OnlineOrders.jsx` | Inline `Rp` + format angka biasa |

Masalahnya: jika format Rupiah perlu diubah (misalnya tambah desimal, atau ganti locale), harus edit 10 file satu per satu.

### Solusi: buat `src/lib/formatters.js`

```js
// src/lib/formatters.js

const LOCALE = 'id-ID'
const CURRENCY = 'IDR'

/**
 * Format angka ke Rupiah penuh
 * Contoh: 15000000 → "Rp 15.000.000"
 */
export const formatRupiah = (amount) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

/**
 * Format angka ke Rupiah ringkas untuk dashboard
 * Contoh: 15000000 → "Rp 15 jt"
 */
export const formatRupiahCompact = (amount) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount ?? 0)

/**
 * Format angka biasa dengan titik pemisah ribuan
 * Contoh: 15000000 → "15.000.000"
 */
export const formatAngka = (number) =>
  new Intl.NumberFormat(LOCALE).format(number ?? 0)

/**
 * Format tanggal ke format Indonesia
 * Contoh: "2026-05-10T08:00:00" → "10 Mei 2026"
 */
export const formatTanggal = (isoString, options = {}) =>
  new Date(isoString).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })

/**
 * Format tanggal + jam
 * Contoh: "2026-05-10T08:30:00" → "10 Mei, 08:30"
 */
export const formatTanggalJam = (isoString) =>
  new Date(isoString).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
```

### Cara migrasi per file

**Inventory.jsx, Catalog.jsx, Checkout.jsx, ProductDetails.jsx** — hapus fungsi `formatPrice` lokal, ganti import:
```jsx
// Hapus ini:
const formatPrice = (price) => { return new Intl.NumberFormat(...) }

// Tambah di atas file:
import { formatRupiah } from '../lib/formatters'

// Ganti semua pemanggilan:
formatPrice(product.price)  →  formatRupiah(product.price)
```

**Transactions.jsx, CustomerDetail.jsx, InvoiceDetail.jsx** — ganti inline:
```jsx
// Hapus ini:
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(txn.total_amount)

// Ganti dengan:
formatRupiah(txn.total_amount)
```

**SalesDashboard.jsx, CustomerDetail.jsx (bagian compact):**
```jsx
new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(stats.totalSales)
→
formatRupiahCompact(stats.totalSales)
```

**InvoiceDetail.jsx, NewTransaction.jsx, OnlineOrders.jsx (bagian angka saja):**
```jsx
new Intl.NumberFormat('id-ID').format(item.subtotal)
→
formatAngka(item.subtotal)
```

**Tanggal di Transactions.jsx, CustomerDetail.jsx, SalesDashboard.jsx:**
```jsx
new Date(txn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
→
formatTanggalJam(txn.created_at)
```

---

## Plan 2 — `src/lib/stockUtils.js`
**Dampak: 2 file** | Effort: ~20 menit

### Masalah
Pengurangan stok ada di **dua tempat dengan logika berbeda**:

**`NewTransaction.jsx`** — pakai RPC dulu, lalu fallback manual jika gagal:
```js
await supabase.rpc('decrement_stock', { product_id, amount })
  .catch(() => {
    // fallback manual
    supabase.from('products').select('stock').eq('id', product_id)...
  })
```

**`OnlineOrders.jsx`** — langsung manual, tidak pakai RPC sama sekali:
```js
const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
const newStock = Math.max(0, product.stock - item.quantity)
await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id)
```

Risikonya: kalau RPC `decrement_stock` diupdate di Supabase, `OnlineOrders` tidak tahu dan tetap pakai cara lama. Race condition juga mungkin terjadi jika dua transaksi bersamaan.

### Solusi: buat `src/lib/stockUtils.js`

```js
// src/lib/stockUtils.js
import { supabase } from './supabase'

/**
 * Kurangi stok untuk daftar item transaksi.
 * Coba pakai RPC dulu (atomic), fallback ke manual jika RPC tidak ada.
 *
 * @param {Array} items - Array of { product_id, quantity }
 * @returns {Promise<{ success: boolean, errors: Array }>}
 */
export const decrementStockBatch = async (items) => {
  const errors = []

  for (const item of items) {
    const { error: rpcError } = await supabase.rpc('decrement_stock', {
      product_id: item.product_id,
      amount: item.quantity,
    })

    if (rpcError) {
      // Fallback: manual update
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()

      if (fetchError || !product) {
        errors.push({ product_id: item.product_id, error: fetchError?.message || 'Produk tidak ditemukan' })
        continue
      }

      const newStock = Math.max(0, product.stock - item.quantity)
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id)

      if (updateError) {
        errors.push({ product_id: item.product_id, error: updateError.message })
      }
    }
  }

  return { success: errors.length === 0, errors }
}
```

### Cara migrasi

**NewTransaction.jsx** — hapus blok loop for, ganti dengan:
```jsx
import { decrementStockBatch } from '../lib/stockUtils'

// Ganti blok for (const item of items) { ... } dengan:
const { success, errors } = await decrementStockBatch(itemsPayload)
if (!success) {
  console.warn('Sebagian stok gagal diupdate:', errors)
}
```

**OnlineOrders.jsx** — hapus blok for loop manual, ganti dengan:
```jsx
import { decrementStockBatch } from '../lib/stockUtils'

// Ganti blok for (const item of order.items) { ... } dengan:
const stockItems = order.items.map(item => ({
  product_id: item.product_id,
  quantity: item.quantity,
}))
await decrementStockBatch(stockItems)
```

---

## Plan 3 — `src/lib/statusUtils.js`
**Dampak: 3 file** | Effort: ~20 menit

### Masalah
Fungsi `getStatusLabel` ditulis **tiga kali** dengan output yang tidak konsisten:

| File | Output |
|------|--------|
| `Transactions.jsx` | `{ label, color, bg }` — objek dengan warna hardcoded |
| `ServiceMaintenance.jsx` | String saja — `'Selesai'`, `'Menunggu'`, dll |
| `Inventory.jsx` | String saja — `'Habis'`, `'Menipis'`, `'Tersedia'` |

Karena formatnya berbeda, tidak bisa langsung digabung. Yang perlu diseragamkan adalah outputnya.

### Solusi: buat `src/lib/statusUtils.js`

```js
// src/lib/statusUtils.js

/**
 * Status transaksi → label + warna untuk badge
 */
export const getTransactionStatus = (status) => {
  const map = {
    completed:            { label: 'Selesai',    color: 'var(--color-success, #008756)',   bg: 'rgba(0,135,86,0.1)' },
    pending_verification: { label: 'Verifikasi', color: 'var(--color-warning, #f5a623)',  bg: 'rgba(245,166,35,0.1)' },
    cancelled:            { label: 'Batal',      color: 'var(--color-error, #ff4444)',    bg: 'rgba(255,68,68,0.1)' },
  }
  return map[status] ?? { label: status, color: '#666', bg: '#eee' }
}

/**
 * Status pekerjaan servis → label string
 */
export const getServiceStatus = (status) => {
  const map = {
    completed:   'Selesai',
    in_progress: 'Dalam Pengerjaan',
    cancelled:   'Dibatalkan',
    pending:     'Menunggu',
  }
  return map[status] ?? status
}

/**
 * Stok produk → label + warna untuk badge
 */
export const getStockStatus = (stock) => {
  if (stock <= 0)  return { label: 'Habis',    color: 'var(--color-error, #ff4444)',   bg: 'rgba(255,68,68,0.1)' }
  if (stock <= 5)  return { label: 'Menipis',  color: 'var(--color-warning, #f5a623)', bg: 'rgba(245,166,35,0.1)' }
  return               { label: 'Tersedia', color: 'var(--color-success, #008756)',   bg: 'rgba(0,135,86,0.1)' }
}
```

### Cara migrasi

**Transactions.jsx:**
```jsx
import { getTransactionStatus } from '../lib/statusUtils'
// Hapus fungsi getStatusLabel lokal
// const status = getStatusLabel(txn.status) → const status = getTransactionStatus(txn.status)
```

**ServiceMaintenance.jsx:**
```jsx
import { getServiceStatus } from '../lib/statusUtils'
// Hapus fungsi getStatusLabel lokal
// getStatusLabel(job.status) → getServiceStatus(job.status)
```

**Inventory.jsx:**
```jsx
import { getStockStatus } from '../lib/statusUtils'
// Hapus fungsi getStatusLabel lokal
// getStatusLabel(product.stock) → getStockStatus(product.stock).label
// (atau pakai .color / .bg untuk styling badge)
```

---

## Plan 4 — Komponen `<PageLoader>` dan `<EmptyState>`
**Dampak: 11 file** | Effort: ~30 menit

### Masalah
Pola loading dan empty state ditulis ulang di setiap halaman. Contoh aktual dari source:

```jsx
// SalesDashboard.jsx
if (loading) return (
  <div className="dashboard-container fade-in" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
    <Loader2 className="spinner" size={32} />
  </div>
)

// CustomerDetail.jsx — hampir sama tapi ada teks tambahan
if (loading) return (
  <div className="dashboard-container fade-in" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div style={{ textAlign: 'center' }}>
      <Loader2 className="spinner" size={32} />
      <p style={{ marginTop:'12px', color:'#666' }}>Memuat profil pelanggan...</p>
    </div>
  </div>
)

// Transactions.jsx — inline di dalam halaman
{loading ? (
  <div style={{ textAlign:'center', padding:'40px' }}>
    <Loader2 className="spinner" size={32} />
    <p>Memuat data...</p>
  </div>
) : ...}
```

Ditulis di: SalesDashboard, CustomerDetail, Transactions, Inventory, Catalog, OnlineOrders, ProductDetails, ServiceMaintenance, InvoiceDetail, UserManagement, Customers (11 file).

### Solusi

**`src/components/PageLoader.jsx`:**
```jsx
import { Loader2 } from 'lucide-react'

/**
 * Dipakai untuk loading full-page (return awal komponen)
 */
const PageLoader = ({ text = 'Memuat...' }) => (
  <div
    className="dashboard-container fade-in"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <div style={{ textAlign: 'center' }}>
      <Loader2 className="spinner" size={32} />
      {text && <p style={{ marginTop: '12px', color: '#999', fontSize: '14px' }}>{text}</p>}
    </div>
  </div>
)

export default PageLoader
```

**`src/components/InlineLoader.jsx`:**
```jsx
import { Loader2 } from 'lucide-react'

/**
 * Dipakai di dalam halaman (bukan full-page)
 */
const InlineLoader = ({ text = 'Memuat data...' }) => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <Loader2 className="spinner" size={32} />
    <p style={{ color: '#999', marginTop: '8px', fontSize: '14px' }}>{text}</p>
  </div>
)

export default InlineLoader
```

**`src/components/EmptyState.jsx`:**
```jsx
const EmptyState = ({ icon: Icon, text, subtext }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
    {Icon && <Icon size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />}
    <p style={{ fontSize: '15px', fontWeight: '500', color: '#666' }}>{text}</p>
    {subtext && <p style={{ fontSize: '13px', marginTop: '4px' }}>{subtext}</p>}
  </div>
)

export default EmptyState
```

### Cara migrasi (contoh Transactions.jsx)

```jsx
// Sebelum — 8 baris
{loading ? (
  <div style={{ textAlign:'center', padding:'40px' }}>
    <Loader2 className="spinner" size={32} />
    <p>Memuat data...</p>
  </div>
) : filteredTransactions.length > 0 ? (
  ...
) : (
  <div style={{ textAlign:'center', padding:'60px 20px', color:'#999' }}>
    <ShoppingBag size={48} style={{ opacity:0.2, marginBottom:'16px' }} />
    <p>Belum ada transaksi yang sesuai.</p>
  </div>
)}

// Sesudah — 3 baris
{loading ? (
  <InlineLoader text="Memuat transaksi..." />
) : filteredTransactions.length > 0 ? (
  ...
) : (
  <EmptyState icon={ShoppingBag} text="Belum ada transaksi yang sesuai." />
)}
```

---

## Plan 5 — Ganti `Math.random()` dengan `crypto.randomUUID()`
**Dampak: 2 file** | Effort: 5 menit

### Masalah
Nama file upload dibuat dengan `Math.random()` yang menghasilkan angka desimal seperti `0.7382918`. Bisa tabrakan jika upload bersamaan, dan formatnya tidak konsisten.

### File yang terdampak
- `Checkout.jsx` baris 42
- `ProductDetails.jsx` baris 62

### Solusi

**Checkout.jsx:**
```jsx
// Sebelum
const fileName = `${Math.random()}.${fileExt}`
const filePath = `payments/${fileName}`

// Sesudah
const fileName = `${crypto.randomUUID()}.${fileExt}`
const filePath = `payments/${fileName}`
```

**ProductDetails.jsx:**
```jsx
// Sebelum
const fileName = `${id}-${Math.random()}.${fileExt}`

// Sesudah
const fileName = `${id}-${crypto.randomUUID()}.${fileExt}`
```

`crypto.randomUUID()` sudah tersedia di semua browser modern dan Node.js 14.17+. Tidak perlu install package apapun.

---

## Plan 6 — Ganti semua `alert()` dengan `react-hot-toast`
**Dampak: 8 file, 16 pemanggilan alert** | Effort: ~45 menit

### Masalah
Ada **16 pemanggilan `alert()`** di seluruh aplikasi:

| File | Jumlah |
|------|--------|
| `NewTransaction.jsx` | 4x |
| `ServiceMaintenance.jsx` | 4x |
| `Checkout.jsx` | 3x |
| `OnlineOrders.jsx` | 3x |
| `ProductDetails.jsx` | 3x |
| `UserManagement.jsx` | 1x |
| `AuthContext.jsx` | 1x |

`alert()` memblokir seluruh UI, tidak bisa di-style, dan tampilannya berbeda di tiap browser/OS.

### Setup (lakukan sekali)

```bash
npm install react-hot-toast
```

**`src/main.jsx`** — tambah `<Toaster>` sekali di root:
```jsx
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      {/* ... app lainnya */}
    </AuthProvider>
  </React.StrictMode>
)
```

### Cara migrasi per tipe pesan

```jsx
import toast from 'react-hot-toast'

// Sukses
alert('Transaksi berhasil disimpan!')
→ toast.success('Transaksi berhasil disimpan!')

// Error
alert('Gagal: ' + error.message)
→ toast.error('Gagal: ' + error.message)

// Validasi (warning)
alert('Mohon lengkapi semua data.')
→ toast('Mohon lengkapi semua data.', { icon: '⚠️' })

// Loading (untuk proses async panjang)
const toastId = toast.loading('Memproses pesanan...')
// ... setelah selesai:
toast.success('Berhasil!', { id: toastId })
// atau:
toast.error('Gagal!', { id: toastId })
```

### Contoh lengkap di Checkout.jsx

```jsx
// Sebelum
const handleSubmit = async () => {
  if (!formData.name || !formData.phone || !formData.address || !formData.payment_proof_url) {
    alert('Mohon lengkapi semua data dan unggah bukti transfer.')
    return
  }
  try {
    setLoading(true)
    // ... proses ...
    localStorage.removeItem('arctic_cart')
    setSuccess(true)
  } catch (error) {
    alert('Gagal memproses pesanan: ' + error.message)
  }
}

// Sesudah
const handleSubmit = async () => {
  if (!formData.name || !formData.phone || !formData.address || !formData.payment_proof_url) {
    toast('Mohon lengkapi semua data dan unggah bukti transfer.', { icon: '⚠️' })
    return
  }
  const toastId = toast.loading('Memproses pesanan...')
  try {
    setLoading(true)
    // ... proses ...
    localStorage.removeItem('arctic_cart')
    toast.success('Pesanan berhasil dikirim!', { id: toastId })
    setSuccess(true)
  } catch (error) {
    toast.error('Gagal memproses pesanan: ' + error.message, { id: toastId })
  }
}
```

---

## Plan 7 — Bersihkan `console.log` debug
**Dampak: 3 file** | Effort: 10 menit

### File dan baris yang harus diubah

| File | Baris | Isi |
|------|-------|-----|
| `AuthContext.jsx` | 20, 34, 41, 51, 73, 95 | Semua log auth & role |
| `BottomNavigation.jsx` | 9 | Log role saat render |
| `Login.jsx` | 10, 11 | Log URL dan hash |

### Solusi — bungkus dengan env check

```jsx
// Sebelum (di mana saja)
console.log('Fetching role for user:', userId)

// Sesudah
if (import.meta.env.DEV) {
  console.log('Fetching role for user:', userId)
}
```

Atau, untuk yang harus tetap ada di production untuk debugging kritis, ganti dengan level yang lebih tepat:
```jsx
// Auth error yang mungkin perlu dilacak di production
console.error('Error fetching user role:', error)  // tetap pakai error, bukan log
```

**Yang langsung bisa dihapus total** (tidak ada nilai):
```jsx
// BottomNavigation.jsx baris 9 — hapus saja
console.log('BottomNavigation Render - Role:', role, 'isAdmin:', isAdmin)
```

---

## Plan 8 — Pisahkan data buyer dari kolom `notes` di Checkout
**Dampak: database + 2 file** | Effort: ~1 jam (termasuk migrasi Supabase)

### Masalah
Data pembeli online saat ini digabung jadi satu string di kolom `notes`:

```js
// Checkout.jsx baris aktual
notes: `Alamat: ${formData.address} | No. HP: ${formData.phone} | Nama: ${formData.name}`
```

Masalah dengan pendekatan ini:
1. Tidak bisa di-query/filter berdasarkan nama atau HP pembeli
2. `OnlineOrders.jsx` harus parsing string ini secara manual untuk menampilkan data
3. Jika format string berubah, halaman yang menampilkan data bisa rusak

### Solusi — migrasi Supabase + update kode

**Langkah 1: Tambah kolom di tabel `transactions` via Supabase Dashboard**
```sql
ALTER TABLE transactions
  ADD COLUMN buyer_name    TEXT,
  ADD COLUMN buyer_phone   TEXT,
  ADD COLUMN buyer_address TEXT;
```

**Langkah 2: Update `Checkout.jsx`**
```jsx
// Sebelum
const { data: transaction } = await supabase
  .from('transactions')
  .insert([{
    user_id: user?.id,
    total_amount: totalAmount,
    payment_method: 'Transfer Bank',
    status: 'pending_verification',
    is_online: true,
    payment_proof_url: formData.payment_proof_url,
    notes: `Alamat: ${formData.address} | No. HP: ${formData.phone} | Nama: ${formData.name}`
  }])

// Sesudah
const { data: transaction } = await supabase
  .from('transactions')
  .insert([{
    user_id: user?.id,
    total_amount: totalAmount,
    payment_method: 'Transfer Bank',
    status: 'pending_verification',
    is_online: true,
    payment_proof_url: formData.payment_proof_url,
    buyer_name: formData.name,
    buyer_phone: formData.phone,
    buyer_address: formData.address,
    notes: formData.notes || null,  // notes sekarang opsional untuk catatan tambahan
  }])
```

**Langkah 3: Update `OnlineOrders.jsx`** — ganti display data buyer dari parsing string ke kolom langsung:
```jsx
// Sebelum (jika ada parsing string)
// order.notes.split('|').find(...)

// Sesudah
<p>{order.buyer_name}</p>
<p>{order.buyer_phone}</p>
<p>{order.buyer_address}</p>
```

---

## Plan 9 — Seragamkan nama tabel servis: hapus `useServiceOrders`
**Dampak: 1 file** | Effort: 10 menit

### Masalah
Ada **inkonsistensi nama tabel** di seluruh kode:

| File | Tabel yang dipakai |
|------|-------------------|
| `useSupabase.js` hook `useServiceOrders` | `service_orders` |
| `SalesDashboard.jsx` | `service_jobs` |
| `ServiceMaintenance.jsx` | `service_jobs` |
| `CustomerDetail.jsx` | `service_jobs` |

Hook `useServiceOrders` di `useSupabase.js` tidak dipakai di halaman manapun — semua halaman query langsung ke `service_jobs`.

### Solusi

1. **Cek di Supabase Dashboard** — tabel mana yang benar-benar ada dan berisi data: `service_orders` atau `service_jobs`
2. Jika `service_jobs` yang aktif → **hapus `useServiceOrders`** dari `useSupabase.js`
3. Jika keduanya ada → tentukan satu dan migrasi data

```js
// useSupabase.js — hapus seluruh blok ini jika tidak dipakai:
export const useServiceOrders = () => {
  // ... seluruh hook ini
}
```

---

## Ringkasan Urutan Pengerjaan

| # | Plan | File baru/ubah | Effort | Prioritas |
|---|------|---------------|--------|-----------|
| 1 | `formatters.js` | 1 baru + 10 ubah | 30 mnt | 🔴 Tinggi |
| 2 | `stockUtils.js` | 1 baru + 2 ubah | 20 mnt | 🔴 Tinggi |
| 3 | `statusUtils.js` | 1 baru + 3 ubah | 20 mnt | 🔴 Tinggi |
| 4 | `PageLoader` + `EmptyState` | 3 baru + 11 ubah | 30 mnt | 🟡 Menengah |
| 5 | `crypto.randomUUID()` | 2 ubah | 5 mnt | 🟡 Menengah |
| 6 | `react-hot-toast` | install + 8 ubah | 45 mnt | 🟡 Menengah |
| 7 | Hapus `console.log` | 3 ubah | 10 mnt | 🟡 Menengah |
| 8 | Kolom buyer di DB | migrasi SQL + 2 ubah | 1 jam | 🟢 Rendah |
| 9 | Hapus `useServiceOrders` | 1 ubah | 10 mnt | 🟢 Rendah |
