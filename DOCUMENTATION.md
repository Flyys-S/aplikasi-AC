# 📄 Dokumentasi Sistem: Arctic Clarity (AC) Retail Management

Aplikasi ini adalah **Progressive Web App (PWA)** yang dirancang untuk manajemen retail AC, mencakup POS (Point of Sale), CRM Pelanggan, Inventori, dan Jadwal Servis.

---

## 🚀 1. Arsitektur & Teknologi
- **Frontend**: React 18 (Vite)
- **Backend/Database**: Supabase (PostgreSQL)
- **Autentikasi**: Google OAuth via Supabase Auth
- **PWA**: Vite PWA Plugin (Installable on Android/iOS)
- **Styling**: Vanilla CSS dengan Design Tokens (Arctic Clarity Blue Theme)

---

## 🗄️ 2. Skema Database (Supabase)

### Tabel Utama:
1. **`products`**: Katalog produk AC & manajemen stok.
2. **`customers`**: Database CRM pelanggan (Phone, Address, History).
3. **`transactions`**: Header transaksi penjualan.
4. **`transaction_items`**: Detail produk per transaksi.
5. **`service_orders`**: Manajemen jadwal servis dan pemeliharaan.

### Keamanan:
- **RLS (Row Level Security)** aktif. Setiap toko/user hanya bisa melihat data miliknya sendiri berdasarkan `user_id`.

---

## ✨ 3. Fitur Utama & Fungsi Kode

### 🔐 Autentikasi (`src/context/AuthContext.jsx`)
Sistem login menggunakan akun Google. State user dikelola secara global sehingga sesi tetap terjaga saat refresh.

### 🛒 Point of Sale (`src/pages/NewTransaction.jsx`)
- Fitur pencarian produk real-time.
- Sistem keranjang belanja dinamis.
- Pengurangan stok otomatis saat transaksi disimpan.

### 👥 CRM & Riwayat (`src/pages/Customers.jsx`)
Melacak detail setiap pelanggan, termasuk riwayat unit AC yang mereka beli dan kapan terakhir kali dilakukan servis.

### 📊 Dashboard (`src/pages/SalesDashboard.jsx`)
Visualisasi data menggunakan layout Bento Grid yang menampilkan statistik penjualan harian dan status inventori.

---

## 💻 5. Technical Implementation Details

### 📂 Struktur Direktori
- `src/lib/supabase.js`: Inisialisasi client Supabase menggunakan Environment Variables.
- `src/context/AuthContext.jsx`: State management untuk user session & Google OAuth logic.
- `src/hooks/useSupabase.js`: Custom hooks yang membungkus logika CRUD (Create, Read, Update, Delete) ke database.
- `src/components/ProtectedRoute.jsx`: Higher-Order Component untuk proteksi navigasi.

### 💉 Pola Data Fetching (Custom Hooks)
Programmer lain disarankan menggunakan hooks dari `useSupabase.js` untuk interaksi data:
```javascript
const { products, loading, updateStock } = useProducts();
const { customers, createCustomer } = useCustomers();
const { transactions, createTransaction } = useTransactions();
```
Setiap hook sudah menangani state `loading`, `error`, dan sinkronisasi data otomatis setelah mutasi.

### 📉 Logika Pengurangan Stok (POS)
Saat transaksi disimpan di `useTransactions.js`, sistem melakukan dua hal secara atomik:
1. Menambahkan record ke `transactions` & `transaction_items`.
2. Melakukan pengurangan stok di tabel `products` menggunakan fungsi PostgreSQL RPC atau mutasi manual berbasis ID produk.

### 🛡️ Implementasi Keamanan (RLS)
Keamanan data dilakukan di level database (bukan hanya frontend). Contoh policy:
```sql
CREATE POLICY "Users can insert their own customers" 
ON public.customers 
FOR INSERT WITH CHECK (auth.uid() = user_id);
```
Ini memastikan programmer tidak bisa secara tidak sengaja (atau sengaja) memasukkan data untuk user lain.

---

## 🎨 6. Panduan Desain (UI/UX)
- **Primary Color**: `#0055FF` (Stitch Blue)
- **Typography**: `Manrope` (Headline), `Inter` (Body)
- **Komponen Reusable**:
  - `Button.jsx`: Tombol premium dengan efek hover.
  - `BottomNavigation.jsx`: Navigasi utama yang dioptimalkan untuk mobile.
  - `ProtectedRoute.jsx`: Wrapper untuk mengamankan halaman dari akses ilegal.

---

## 🛠️ 7. Cara Menjalankan Lokal
1. Install dependensi: `npm install`
2. Jalankan server: `npm run dev`
3. Akses via browser: `http://localhost:5173`

---

## 📋 8. Rencana Selanjutnya (Fase 3)
- Deployment ke Vercel.
- Sinkronisasi domain Vercel dengan Redirect URL di Supabase.
- Pengaktifan notifikasi WhatsApp (Optional).

- Pengaktifan notifikasi WhatsApp (Optional).

---

*Dokumen ini dibuat otomatis sebagai panduan pengembangan sistem Arctic Clarity.*
