# 🚀 Master Plan Pengembangan: Arctic Clarity (Updated)
**Berdasarkan Analisis Activity Diagram (Mei 2026)**

Dokumen ini adalah panduan strategis untuk menyelaraskan implementasi kode dengan logika bisnis yang didefinisikan dalam diagram aktivitas.

---

## 🏗️ Fase 1: Fondasi Keamanan & Akses (Diagram 1 & 7)
*Tujuan: Memastikan integritas data dan pemisahan wewenang yang ketat.*

### 1.1 Konsep Pengerjaan: Role-Based Access Control (RBAC)
Kita akan menggunakan metadata user dari Supabase untuk menentukan peran pengguna. Sistem akan melakukan pengecekan peran di dua sisi:
- **Frontend**: Menggunakan *Higher Order Component* (HOC) atau `ProtectedRoute` untuk membatasi akses halaman.
- **Backend (Supabase)**: Menggunakan *Row Level Security* (RLS) agar user hanya bisa melakukan query sesuai haknya.

### 1.2 Penerapan Teknis
- **`AuthContext.jsx`**: Menambahkan state `userRole` yang diambil dari tabel `profiles` setelah login.
- **`Sidebar.jsx`**: Menggunakan *conditional rendering* (misal: `{role === 'admin' && <InventoryLink />}`).
- **Pendaftaran**: Mengaktifkan "Email Confirmation" di dashboard Supabase agar sesuai dengan Diagram 7 (Verifikasi Email).
- **Detail Alur**: User Login -> Sistem cek tabel `profiles` -> Simpan Role di Global State -> Navigasi diarahkan berdasarkan Role (Diagram 1).

---

## 📦 Fase 2: Manajemen Inti - Produk & Pelanggan (Diagram 4 & 5)
*Tujuan: Menciptakan "Single Source of Truth" untuk data inventori dan klien.*

### 2.1 Konsep Pengerjaan: Dynamic Sync & Inventory Guard
Inventori bukan sekadar daftar, tapi sistem yang reaktif terhadap transaksi.
- **Konsep**: Setiap kali ada perubahan stok (input manual atau transaksi), sistem harus melakukan validasi silang dengan status produk secara otomatis.

### 2.2 Penerapan Teknis
- **Inventory Page**: Implementasi fungsi `updateStock()` yang secara otomatis memicu `updateProductStatus()` jika stok mencapai nol.
- **Customer History**: Pada halaman Detail Pelanggan, kita akan melakukan *Join Query* antara tabel `customers` dan `transactions` untuk menampilkan riwayat belanja/servis secara otomatis (Diagram 5).
- **Detail Alur**: Klik Produk -> Lihat Detail -> Pilih Aksi (Edit Stok/Tambah) -> Update DB -> Refresh View Otomatis (Diagram 4).

---

## 💰 Fase 3: Transaksi Internal & Penjualan (Diagram 3)
*Tujuan: Meminimalisir kesalahan manusia dalam pencatatan penjualan.*

### 3.1 Konsep Pengerjaan: Atomic Transactions
Proses penjualan harus bersifat *Atomic* (semua berhasil atau semua gagal).
- **Konsep**: Saat Admin klik "Simpan Transaksi", tiga hal terjadi secara bersamaan: Simpan record transaksi, potong stok produk, dan generate invoice.

### 3.2 Penerapan Teknis
- **Checkout Flow**: Menggunakan `supabase.rpc()` (Stored Procedure) atau Database Transaction untuk memastikan stok tidak terpotong jika gagal membuat record transaksi.
- **Identify Buyer**: Menambahkan opsi *toggle* antara "Pelanggan Terdaftar" (Dropdown/Search) dan "Walk-in Buyer" (Input teks manual).
- **Detail Alur**: Identifikasi Pembeli -> Pilih Produk -> Masuk Keranjang -> Loop Tambah Produk -> Pilih Metode Bayar -> Simpan & Generate Invoice (Diagram 3).

---

## 🔧 Fase 4: Operasional Servis & Teknisi (Diagram 6)
*Tujuan: Sinkronisasi kerja antara Admin (Penjadwal) dan Teknisi (Pelaksana).*

### 4.1 Konsep Pengerjaan: Real-time Dispatcher
Admin berfungsi sebagai "Dispatcher" yang memberikan tugas, dan Teknisi memberikan umpan balik status pengerjaan secara langsung.

### 4.2 Penerapan Teknis
- **Service Dashboard**: Admin memiliki kalender untuk input jadwal. Setiap jadwal memiliki kolom `technician_id`.
- **Technician Mobile View**: Tampilan khusus bagi teknisi (Diagram 6) yang hanya berisi daftar tugas mereka dengan tombol status: `Pending` -> `In Progress` -> `Completed`.
- **Trigger**: Menggunakan fitur *Realtime* Supabase agar saat teknisi klik "Selesai", dashboard Admin langsung ter-update di dashboard admin tanpa reload.
- **Detail Alur**: Admin Jadwalkan -> Simpan ke DB -> Notifikasi ke Teknisi -> Teknisi Update Status (Proses/Selesai) -> DB Terupdate -> Kalender Refresh (Diagram 6).

---

## 🌐 Fase 5: Pengalaman Publik & Checkout (Diagram 2 & 8)
*Tujuan: Ekspansi pasar melalui akses katalog terbuka dan pemesanan online.*

### 5.1 Konsep Pengerjaan: Public-Facing E-Catalog
Aplikasi tidak lagi terkunci sepenuhnya. Kita membuka "Etalase" bagi pengunjung publik untuk meningkatkan jangkauan bisnis.

### 5.2 Penerapan Teknis
- **Public Routes**: Memisahkan rute `/catalog` dari rute manajemen. Rute ini bisa diakses tanpa `access_token`.
- **Online Checkout (Diagram 8)**: 
    - Implementasi *Guest Cart* (menggunakan LocalStorage).
    - Form "Shipping Detail" yang divalidasi sebelum checkout.
    - **Verification Queue**: Admin memiliki halaman baru untuk meninjau "Online Orders" dan memverifikasi bukti pembayaran (Manual Verification).
- **Detail Alur**: Visitor lihat Katalog -> Tambah ke Keranjang -> Checkout -> Cek Login (Jika belum, arahkan Login) -> Input Alamat -> Pilih Bayar -> Konfirmasi -> Admin Verifikasi -> Stok Update -> Invoice Selesai (Diagram 8).

---

## 🚀 Strategi Implementasi & Prioritas
1.  **Prioritas 1 (Kritikal)**: Fase 1 & 2. Tanpa ini, data dan akses akan berantakan.
2.  **Prioritas 2 (Operasional)**: Fase 3 & 4. Fokus pada efisiensi kerja internal.
3.  **Prioritas 3 (Strategis)**: Fase 5. Fokus pada pengembangan market keluar.

---
*Dokumen ini adalah peta jalan hidup. Kita akan mencentang setiap item setelah kode selesai diuji.*
