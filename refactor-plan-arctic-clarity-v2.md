# 🧹 Refactor Plan — Arctic Clarity (v2 Final)
> Berdasarkan audit langsung source code. Setiap nomor baris, nama file, dan contoh kode akurat per kondisi saat ini.

---

## Plan 1 — `src/lib/formatters.js`
**Dampak: 10 file** | Effort: ~30 menit | Prioritas: 🔴 Tinggi

### Masalah
Fungsi format Rupiah dan tanggal ditulis ulang di 10 tempat. Selain susah dirawat, membuat `new Intl.NumberFormat(...)` di dalam komponen berarti objek itu dibuat ulang setiap render — cukup berat jika halaman render banyak baris.

| File | Bentuk saat ini |
|------|-----------------|
| `Inventory.jsx` | `const formatPrice = (price) => new Intl.NumberFormat(...)` (baris 38) |
| `Catalog.jsx` | Sama persis (baris 77) |
| `Checkout.jsx` | Sama persis (baris 116) |
| `ProductDetails.jsx` | Sama persis (baris 128) |
| `Transactions.jsx` | Inline di JSX (baris 118, 123) |
| `InvoiceDetail.jsx` | Inline, 4 variasi berbeda dalam satu file (baris 46, 122, 125, 135, 139) |
| `NewTransaction.jsx` | Inline, hardcode `Rp` (baris 235, 245) |
| `SalesDashboard.jsx` | `notation: 'compact'` (baris 109, 160) |
| `CustomerDetail.jsx` | Mix `compact` dan `currency` (baris 94, 123, 126) |
| `OnlineOrders.jsx` | Inline `Rp` + format angka (baris 131, 136) |

### Solusi: buat `src/lib/formatters.js` dengan pola Singleton

Objek `Intl.NumberFormat` diinstansiasi **sekali saat modul dimuat**, bukan setiap kali fungsi dipanggil.

```js
// src/lib/formatters.js

const LOCALE = 'id-ID'
const CURRENCY = 'IDR'

// Singleton — dibuat sekali, dipakai berkali-kali
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
 * Format angka ke Rupiah penuh
 * Contoh: 15000000 → "Rp 15.000.000"
 */
export const formatRupiah = (amount) => rupiahFormatter.format(amount ?? 0)

/**
 * Format angka ke Rupiah ringkas untuk dashboard/kartu statistik
 * Contoh: 15000000 → "Rp 15 jt"
 */
export const formatRupiahCompact = (amount) => rupiahCompactFormatter.format(amount ?? 0)

/**
 * Format angka biasa dengan titik pemisah ribuan (tanpa simbol Rp)
 * Contoh: 15000000 → "15.000.000"
 */
export const formatAngka = (number) => angkaFormatter.format(number ?? 0)

/**
 * Format tanggal Indonesia
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
 * Contoh: "2026-05-10T08:30:00" → "10 Mei, 08.30"
 */
export const formatTanggalJam = (isoString) =>
  new Date(isoString).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
```

### Migrasi per file

**`Inventory.jsx` (baris 38–40), `Catalog.jsx` (baris 77–80), `Checkout.jsx` (baris 116–119), `ProductDetails.jsx` (baris 128–131)**
Hapus fungsi lokal, tambah import:
```jsx
// Hapus:
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}

// Tambah di baris import atas:
import { formatRupiah } from '../lib/formatters'

// Ganti semua pemanggilan:
formatPrice(product.price)  →  formatRupiah(product.price)
```

**`Transactions.jsx` (baris 118, 123)**
```jsx
// Baris 118 — hapus ini:
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(txn.total_amount)
// Ganti:
formatRupiah(txn.total_amount)

// Baris 123 — hapus ini:
new Date(txn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
// Ganti:
formatTanggalJam(txn.created_at)
```

**`InvoiceDetail.jsx` (baris 46, 122, 125, 135, 139)**
```jsx
// Baris 46:
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(txn?.total_amount)
→ formatRupiah(txn?.total_amount)

// Baris 122, 125, 135:
new Intl.NumberFormat('id-ID').format(item.unit_price / item.subtotal / txn.total_amount)
→ formatAngka(item.unit_price) / formatAngka(item.subtotal) / formatAngka(txn.total_amount)

// Baris 139:
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(txn.total_amount)
→ formatRupiah(txn.total_amount)
```

**`NewTransaction.jsx` (baris 235, 245)**
```jsx
// Baris 235:
new Intl.NumberFormat('id-ID').format(item.subtotal)
→ formatAngka(item.subtotal)

// Baris 245:
Rp {new Intl.NumberFormat('id-ID').format(total)}
→ {formatRupiah(total)}
```

**`SalesDashboard.jsx` (baris 109, 160)**
```jsx
new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(stats.totalSales)
→ formatRupiahCompact(stats.totalSales)
```

**`CustomerDetail.jsx` (baris 94, 123, 126, 151)**
```jsx
// Baris 94 (compact):
new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(totalSpend)
→ formatRupiahCompact(totalSpend)

// Baris 123, 151 (tanggal):
new Date(txn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
→ formatTanggal(txn.created_at)

// Baris 126 (rupiah):
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(txn.total_amount)
→ formatRupiah(txn.total_amount)
```

**`OnlineOrders.jsx` (baris 119, 131, 136)**
```jsx
// Baris 119 (tanggal):
new Date(order.created_at).toLocaleString('id-ID')
→ formatTanggalJam(order.created_at)

// Baris 131:
new Intl.NumberFormat('id-ID').format(item.subtotal)
→ formatAngka(item.subtotal)

// Baris 136:
Rp {new Intl.NumberFormat('id-ID').format(order.total_amount)}
→ {formatRupiah(order.total_amount)}
```

---

## Plan 2 — Pisahkan data buyer dari kolom `notes`
**Dampak: migrasi Supabase + 2 file** | Effort: ~1 jam | Prioritas: 🔴 Tinggi

### Masalah
Data pembeli online digabung jadi satu string di kolom `notes` (`Checkout.jsx` baris aktual):
```js
notes: `Alamat: ${formData.address} | No. HP: ${formData.phone} | Nama: ${formData.name}`
```
Masalah nyata dari pendekatan ini:
- Tidak bisa filter/query transaksi berdasarkan nama atau nomor HP pembeli
- `OnlineOrders.jsx` tidak bisa tampilkan data pembeli dengan bersih
- Jika ada karakter `|` di alamat, string parsing rusak
- Tidak bisa kirim notifikasi otomatis ke nomor tertentu di masa depan

### Langkah 1 — Migrasi database di Supabase

Jalankan via SQL Editor di Supabase Dashboard:
```sql
ALTER TABLE transactions
  ADD COLUMN buyer_name    TEXT,
  ADD COLUMN buyer_phone   TEXT,
  ADD COLUMN buyer_address TEXT;
```

### Langkah 2 — Update `Checkout.jsx`

```jsx
// Sebelum (baris ~70–80):
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

// Sesudah:
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
    notes: formData.notes || null,
  }])
```

### Langkah 3 — Update `OnlineOrders.jsx`

Ganti tampilan info pembeli dari string `notes` ke kolom langsung:
```jsx
// Sebelum (jika ada parsing notes):
<p>{order.notes}</p>

// Sesudah — data bersih, bisa di-style per field:
<p style={{ fontWeight: '500' }}>{order.buyer_name}</p>
<p>
  <Phone size={12} /> {order.buyer_phone}
</p>
<p>
  <MapPin size={12} /> {order.buyer_address}
</p>
```

---

## Plan 3 — `src/lib/stockUtils.js`
**Dampak: 2 file** | Effort: ~20 menit | Prioritas: 🔴 Tinggi

### Masalah
Pengurangan stok ada di dua tempat dengan mekanisme berbeda dan keduanya **rentan race condition**:

**`NewTransaction.jsx` (baris 133–139)** — update manual pakai data dari state lokal:
```js
// Pakai `product.stock` dari state React, bukan dari DB saat ini
for (const item of cart) {
  const product = products.find(p => p.id === item.product_id)
  await supabase.from('products')
    .update({ stock: product.stock - item.quantity })  // ← data bisa sudah basi
    .eq('id', item.product_id)
}
```

**`OnlineOrders.jsx` (baris 58–68)** — select dulu, lalu update:
```js
// Jika dua admin approve order bersamaan, keduanya baca stok yang sama
// sebelum salah satu sempat update → stok tidak terpotong dua kali
const { data: product } = await supabase.from('products').select('stock')...
const newStock = Math.max(0, product.stock - item.quantity)
await supabase.from('products').update({ stock: newStock })...
```

Solusinya adalah RPC yang berjalan atomik di sisi database — tidak bisa terjadi race condition karena Postgres mengunci baris saat update.

### Prasyarat — pastikan RPC ada di Supabase

Cek di Supabase Dashboard → Database → Functions, apakah `decrement_stock` sudah ada. Jika belum, buat via SQL Editor:

```sql
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - amount)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
```

### Solusi: buat `src/lib/stockUtils.js`

Tidak ada fallback manual. Jika RPC gagal, return error dan biarkan pemanggil yang handle — jangan hitung stok di JavaScript.

```js
// src/lib/stockUtils.js
import { supabase } from './supabase'

/**
 * Kurangi stok sejumlah item secara atomik via RPC.
 * Jika RPC belum ada atau gagal, return error — jangan fallback ke update manual.
 *
 * @param {Array<{ product_id: string, quantity: number }>} items
 * @returns {Promise<{ success: boolean, errors: Array }>}
 */
export const decrementStockBatch = async (items) => {
  const errors = []

  for (const item of items) {
    const { error } = await supabase.rpc('decrement_stock', {
      product_id: item.product_id,
      amount: item.quantity,
    })

    if (error) {
      errors.push({ product_id: item.product_id, error: error.message })
    }
  }

  return { success: errors.length === 0, errors }
}
```

### Migrasi per file

**`NewTransaction.jsx` — ganti blok `for` update manual (baris 133–139):**
```jsx
import { decrementStockBatch } from '../lib/stockUtils'

// Hapus:
for (const item of cart) {
  const product = products.find(p => p.id === item.product_id)
  await supabase.from('products')
    .update({ stock: product.stock - item.quantity })
    .eq('id', item.product_id)
}

// Ganti dengan:
const stockItems = cart.map(item => ({
  product_id: item.product_id,
  quantity: item.quantity,
}))
const { success, errors } = await decrementStockBatch(stockItems)
if (!success) {
  throw new Error('Sebagian stok gagal diperbarui: ' + errors.map(e => e.error).join(', '))
}
```

**`OnlineOrders.jsx` — ganti blok `for` approve order (baris 58–68):**
```jsx
import { decrementStockBatch } from '../lib/stockUtils'

// Hapus:
for (const item of order.items) {
  const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
  const newStock = Math.max(0, product.stock - item.quantity)
  await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id)
}

// Ganti dengan:
const stockItems = order.items.map(item => ({
  product_id: item.product_id,
  quantity: item.quantity,
}))
const { success, errors } = await decrementStockBatch(stockItems)
if (!success) {
  throw new Error('Stok gagal diperbarui: ' + errors.map(e => e.error).join(', '))
}
```

---

## Plan 4 — `src/lib/statusUtils.js`
**Dampak: 3 file** | Effort: ~20 menit | Prioritas: 🟡 Menengah

### Masalah
Fungsi `getStatusLabel` ditulis tiga kali dengan output yang tidak konsisten:

| File | Output | Baris |
|------|--------|-------|
| `Transactions.jsx` | `{ label, color, bg }` — objek dengan hex hardcoded | 39–46 |
| `ServiceMaintenance.jsx` | String saja — `'Selesai'`, `'Menunggu'` | 130–137 |
| `Inventory.jsx` | String saja — `'Habis'`, `'Menipis'`, `'Tersedia'` | 51–55 |

### Solusi: buat `src/lib/statusUtils.js`

```js
// src/lib/statusUtils.js

/**
 * Status transaksi → label + warna untuk badge
 * Output: { label: string, color: string, bg: string }
 */
export const getTransactionStatus = (status) => {
  const map = {
    completed:            { label: 'Selesai',    color: '#008756', bg: 'rgba(0,135,86,0.1)' },
    pending_verification: { label: 'Verifikasi', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
    cancelled:            { label: 'Batal',      color: '#ff4444', bg: 'rgba(255,68,68,0.1)' },
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
 * Output: { label: string, color: string, bg: string }
 */
export const getStockStatus = (stock) => {
  if (stock <= 0) return { label: 'Habis',    color: '#ff4444', bg: 'rgba(255,68,68,0.1)' }
  if (stock <= 5) return { label: 'Menipis',  color: '#f5a623', bg: 'rgba(245,166,35,0.1)' }
  return              { label: 'Tersedia', color: '#008756', bg: 'rgba(0,135,86,0.1)' }
}
```

### Migrasi per file

**`Transactions.jsx` (baris 39–46):**
```jsx
import { getTransactionStatus } from '../lib/statusUtils'

// Hapus fungsi getStatusLabel lokal
// Semua pemanggilan:
const status = getStatusLabel(txn.status)  →  const status = getTransactionStatus(txn.status)
// Pemakaian di JSX tidak berubah karena output-nya sama { label, color, bg }
```

**`ServiceMaintenance.jsx` (baris 130–137):**
```jsx
import { getServiceStatus } from '../lib/statusUtils'

// Hapus fungsi getStatusLabel lokal
getStatusLabel(job.status)  →  getServiceStatus(job.status)
```

**`Inventory.jsx` (baris 51–55):**
```jsx
import { getStockStatus } from '../lib/statusUtils'

// Hapus fungsi getStatusLabel lokal
// Jika hanya butuh label string:
getStatusLabel(product.stock)  →  getStockStatus(product.stock).label

// Jika ingin sekalian styling badge (opsional upgrade):
const { label, color, bg } = getStockStatus(product.stock)
// <span style={{ color, backgroundColor: bg }}>{label}</span>
```

---

## Plan 5 — Komponen `<PageLoader>`, `<InlineLoader>`, dan `<EmptyState>`
**Dampak: 11 file** | Effort: ~30 menit | Prioritas: 🟡 Menengah

### Masalah
Pola loading dan empty state ditulis ulang di setiap halaman:

| File | Tipe loading | Baris |
|------|-------------|-------|
| `SalesDashboard.jsx` | Full-page `if (loading) return` | 57 |
| `CustomerDetail.jsx` | Full-page `if (loading) return` | 43 |
| `InvoiceDetail.jsx` | Full-page `if (loading) return` | 52 |
| `ProductDetails.jsx` | Full-page `if (loading) return` | 119 |
| `Inventory.jsx` | Inline di JSX | 86 |
| `Catalog.jsx` | Inline di JSX | 121 |
| `OnlineOrders.jsx` | Inline di JSX | 105 |
| `ServiceMaintenance.jsx` | Inline di JSX | 215 |
| `Transactions.jsx` | Inline di JSX | 77 |
| `UserManagement.jsx` | Inline di JSX | 33 |
| `Customers.jsx` | Pakai CSS class, berbeda sendiri | 43 |

### Solusi

**`src/components/PageLoader.jsx`** — untuk `if (loading) return`:
```jsx
import { Loader2 } from 'lucide-react'

const PageLoader = ({ text = 'Memuat...' }) => (
  <div
    className="dashboard-container fade-in"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <div style={{ textAlign: 'center' }}>
      <Loader2 className="spinner" size={32} />
      {text && (
        <p style={{ marginTop: '12px', color: '#999', fontSize: '14px' }}>{text}</p>
      )}
    </div>
  </div>
)

export default PageLoader
```

**`src/components/InlineLoader.jsx`** — untuk loading di dalam halaman:
```jsx
import { Loader2 } from 'lucide-react'

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
    {Icon && (
      <Icon
        size={48}
        style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }}
      />
    )}
    <p style={{ fontSize: '15px', fontWeight: '500', color: '#666' }}>{text}</p>
    {subtext && <p style={{ fontSize: '13px', marginTop: '4px' }}>{subtext}</p>}
  </div>
)

export default EmptyState
```

### Migrasi per file (contoh representatif)

**`SalesDashboard.jsx`, `CustomerDetail.jsx`, `InvoiceDetail.jsx`, `ProductDetails.jsx` (full-page):**
```jsx
import PageLoader from '../components/PageLoader'

// Sebelum (tiap file punya versi sendiri):
if (loading) {
  return (
    <div className="dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="spinner" size={32} />
    </div>
  )
}

// Sesudah — 1 baris:
if (loading) return <PageLoader text="Memuat data..." />
```

**`Transactions.jsx` (baris 77–81, 144–147):**
```jsx
import InlineLoader from '../components/InlineLoader'
import EmptyState from '../components/EmptyState'

// Sebelum:
{loading ? (
  <div style={{ textAlign:'center', padding:'40px' }}>
    <Loader2 className="spinner" size={32} />
    <p>Memuat data...</p>
  </div>
) : filteredTransactions.length > 0 ? (
  // ... list transaksi
) : (
  <div style={{ textAlign:'center', padding:'60px 20px', color:'#999' }}>
    <ShoppingBag size={48} style={{ opacity:0.2, marginBottom:'16px' }} />
    <p>Belum ada transaksi yang sesuai.</p>
  </div>
)}

// Sesudah:
{loading ? (
  <InlineLoader text="Memuat transaksi..." />
) : filteredTransactions.length > 0 ? (
  // ... list transaksi
) : (
  <EmptyState icon={ShoppingBag} text="Belum ada transaksi yang sesuai." />
)}
```

**`Inventory.jsx`, `Catalog.jsx`, `OnlineOrders.jsx`, `ServiceMaintenance.jsx`, `UserManagement.jsx`, `Customers.jsx`** — pola migrasi sama seperti Transactions di atas, sesuaikan ikon dan teks empty state masing-masing halaman.

---

## Plan 6 — Ganti `Math.random()` untuk nama file upload
**Dampak: 2 file** | Effort: ~5 menit | Prioritas: 🟡 Menengah

### Masalah
Nama file upload dibuat dengan `Math.random()` — bisa tabrakan jika dua user upload hampir bersamaan. `crypto.randomUUID()` lebih aman, tapi hanya jalan di **Secure Context** (HTTPS atau localhost). Jika aplikasi diakses via IP lokal (`192.168.x.x`) tanpa HTTPS, fungsi ini `undefined` dan crash.

| File | Baris | Kode saat ini |
|------|-------|---------------|
| `Checkout.jsx` | 42 | `const fileName = \`${Math.random()}.${fileExt}\`` |
| `ProductDetails.jsx` | 62 | `const fileName = \`${id}-${Math.random()}.${fileExt}\`` |

### Solusi — helper dengan fallback

Buat helper kecil yang mencoba `crypto.randomUUID()` dulu, fallback ke kombinasi timestamp + random string jika tidak tersedia:

```js
// Tambah fungsi ini di Checkout.jsx dan ProductDetails.jsx
// (atau pindah ke src/lib/utils.js jika ingin terpusat)
const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + 7 karakter random (cukup untuk menghindari tabrakan)
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
```

**`Checkout.jsx` (baris 42):**
```jsx
// Sebelum:
const fileName = `${Math.random()}.${fileExt}`

// Sesudah:
const fileName = `${generateUniqueId()}.${fileExt}`
```

**`ProductDetails.jsx` (baris 62):**
```jsx
// Sebelum:
const fileName = `${id}-${Math.random()}.${fileExt}`

// Sesudah:
const fileName = `${id}-${generateUniqueId()}.${fileExt}`
```

---

## Plan 7 — Ganti semua `alert()` dengan `react-hot-toast`
**Dampak: 8 file, 16 pemanggilan** | Effort: ~45 menit | Prioritas: 🟡 Menengah

### Masalah
Ada 16 pemanggilan `alert()` dan 2 `window.confirm()` di seluruh aplikasi. `alert()` memblokir seluruh UI dan tampilannya bergantung pada OS — berbeda di Android, iOS, dan desktop.

| File | Jumlah | Baris |
|------|--------|-------|
| `NewTransaction.jsx` | 4x alert + 1x confirm | 53, 78, 91, 142, 145 |
| `ServiceMaintenance.jsx` | 4x alert | 79, 91, 101, 117 |
| `Checkout.jsx` | 3x alert | 57, 65, 110 |
| `OnlineOrders.jsx` | 2x alert + 1x confirm | 73, 76, 94 |
| `ProductDetails.jsx` | 3x alert | 87, 111, 113 |
| `UserManagement.jsx` | 1x alert | 17 |
| `AuthContext.jsx` | 1x alert | 110 |

### Setup — lakukan sekali

```bash
npm install react-hot-toast
```

**`src/main.jsx`** — tambah `<Toaster>` di dalam root, sebelum router:
```jsx
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { duration: 2500 },
          error: { duration: 4000 },
        }}
      />
      {/* router dan app */}
    </AuthProvider>
  </React.StrictMode>
)
```

### Pola penggantian

```jsx
import toast from 'react-hot-toast'

// Sukses:
alert('Transaksi berhasil disimpan!')
→ toast.success('Transaksi berhasil disimpan!')

// Error:
alert('Gagal: ' + error.message)
→ toast.error('Gagal: ' + error.message)

// Validasi/peringatan:
alert('Mohon lengkapi semua data.')
→ toast('Mohon lengkapi semua data.', { icon: '⚠️' })

// Proses async — loading → sukses/error:
const toastId = toast.loading('Menyimpan transaksi...')
// ... await proses ...
toast.success('Berhasil disimpan!', { id: toastId })
// atau:
toast.error('Gagal: ' + error.message, { id: toastId })
```

### Penggantian `window.confirm()`

`react-hot-toast` tidak punya dialog konfirmasi. Untuk `window.confirm()`, tetap biarkan atau buat komponen modal konfirmasi sederhana. Alternatif paling cepat:

```jsx
// Tetap pakai window.confirm untuk saat ini (tidak ada regresi)
// Atau buat komponen kecil jika ingin konsisten:

// src/components/ConfirmDialog.jsx
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{ background: 'white', borderRadius: '16px', padding: '20px', maxWidth: '280px', textAlign: 'center' }}>
    <p style={{ marginBottom: '16px', fontSize: '15px' }}>{message}</p>
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <button onClick={onCancel}>Batal</button>
      <button onClick={onConfirm} style={{ color: 'red' }}>Ya, lanjutkan</button>
    </div>
  </div>
)

// Pemakaian dengan toast custom:
toast((t) => (
  <ConfirmDialog
    message="Simpan transaksi? Stok akan langsung terpotong."
    onConfirm={() => { toast.dismiss(t.id); handleSubmit() }}
    onCancel={() => toast.dismiss(t.id)}
  />
), { duration: Infinity })
```

### Contoh lengkap — `NewTransaction.jsx`

```jsx
import toast from 'react-hot-toast'

const handleSubmit = async () => {
  if (cart.length === 0) return

  // Ganti window.confirm dengan toast konfirmasi (opsional, lihat ConfirmDialog di atas)
  // Atau tetap window.confirm untuk sekarang

  const toastId = toast.loading('Menyimpan transaksi...')
  try {
    setSaving(true)

    // ... validasi stok, insert transaksi, insert items ...

    const { success, errors } = await decrementStockBatch(stockItems)
    if (!success) throw new Error('Stok gagal diperbarui')

    toast.success('Transaksi berhasil disimpan!', { id: toastId })
    navigate(`/transactions/${txn.id}`)
  } catch (error) {
    toast.error('Gagal: ' + error.message, { id: toastId })
  } finally {
    setSaving(false)
  }
}
```

---

## Plan 8 — Bersihkan `console.log` debug
**Dampak: 3 file** | Effort: ~10 menit | Prioritas: 🟢 Rendah

### Daftar lengkap yang harus diubah

**`src/context/AuthContext.jsx`:**
| Baris | Isi | Aksi |
|-------|-----|------|
| 20 | `console.log('Fetching role for user:', userId)` | Bungkus `DEV` |
| 34 | `console.log('User role fetched successfully:', data?.role)` | Bungkus `DEV` |
| 41 | `console.log('Role fetching process completed...')` | Hapus |
| 51 | `console.log('Initial session check:', session?.user?.email)` | Bungkus `DEV` |
| 73 | `console.log('Auth state change event:', _event)` | Hapus |
| 95 | `console.log('Signing in with Google, redirecting to:', baseUrl)` | Bungkus `DEV` |

**`src/pages/Login.jsx`:**
| Baris | Isi | Aksi |
|-------|-----|------|
| 10 | `console.log('Login Page Loaded. URL:', window.location.href)` | Hapus |
| 11 | `console.log('Hash content:', window.location.hash)` | Hapus |

**`src/components/BottomNavigation.jsx`:**
| Baris | Isi | Aksi |
|-------|-----|------|
| 9 | `console.log('BottomNavigation Render - Role:', role, 'isAdmin:', isAdmin)` | Hapus |

### Cara membungkus dengan DEV check

```jsx
// Sebelum:
console.log('Fetching role for user:', userId)

// Sesudah:
if (import.meta.env.DEV) {
  console.log('Fetching role for user:', userId)
}
```

Catatan: `console.error` yang sudah ada di `AuthContext.jsx` (baris 31, 38, 59, 64) **tidak perlu diubah** — itu untuk error nyata yang memang perlu dilacak di production.

---

## Plan 9 — Hapus `useServiceOrders` dari `useSupabase.js`
**Dampak: 1 file** | Effort: ~10 menit | Prioritas: 🟢 Rendah

### Masalah
Ada inkonsistensi nama tabel di seluruh kode:

| File | Tabel yang dipakai |
|------|--------------------|
| `useSupabase.js` hook `useServiceOrders` | `service_orders` |
| `SalesDashboard.jsx` (baris 32) | `service_jobs` |
| `ServiceMaintenance.jsx` (baris 39, 86, 110) | `service_jobs` |
| `CustomerDetail.jsx` (baris 28) | `service_jobs` |

Hook `useServiceOrders` tidak dipakai di halaman manapun — semua halaman query langsung ke `service_jobs`.

### Langkah

1. **Cek di Supabase Dashboard** → Table Editor: tabel mana yang benar-benar ada dan berisi data
2. Jika `service_jobs` yang aktif → **hapus seluruh blok `useServiceOrders`** dari `useSupabase.js`:
```js
// Hapus seluruh fungsi ini dari useSupabase.js:
export const useServiceOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => { ... }
  const createOrder = async (orderData) => { ... }
  const updateOrderStatus = async (id, status) => { ... }

  useEffect(() => { fetchOrders() }, [])
  return { orders, loading, createOrder, updateOrderStatus, refetch: fetchOrders }
}
```
3. Jika ternyata `service_orders` yang aktif → migrasi semua halaman ke tabel tersebut dan seragamkan

---

## Ringkasan

| # | Plan | File baru | File diubah | Effort | Prioritas |
|---|------|-----------|-------------|--------|-----------|
| 1 | `formatters.js` (Singleton) | 1 | 10 | 30 mnt | 🔴 Tinggi |
| 2 | Kolom buyer di DB | — | migrasi SQL + 2 | 1 jam | 🔴 Tinggi |
| 3 | `stockUtils.js` (Atomic RPC) | 1 | 2 | 20 mnt | 🔴 Tinggi |
| 4 | `statusUtils.js` | 1 | 3 | 20 mnt | 🟡 Menengah |
| 5 | `PageLoader` + `InlineLoader` + `EmptyState` | 3 | 11 | 30 mnt | 🟡 Menengah |
| 6 | Upload ID dengan fallback | — | 2 | 5 mnt | 🟡 Menengah |
| 7 | `react-hot-toast` | — | 8 | 45 mnt | 🟡 Menengah |
| 8 | Bersihkan `console.log` | — | 3 | 10 mnt | 🟢 Rendah |
| 9 | Hapus `useServiceOrders` | — | 1 | 10 mnt | 🟢 Rendah |
| | **Total** | **6 file baru** | **42 file diubah** | **~3,5 jam** | |