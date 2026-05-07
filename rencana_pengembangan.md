# Rencana Pengembangan & Perbaikan Aplikasi Arctic Clarity

Dokumen ini merangkum daftar perbaikan sistem yang ada dan rencana implementasi fitur baru untuk meningkatkan fungsionalitas aplikasi.

## 1. Prioritas Utama: Perubahan Struktur Landing Page
Mengubah alur utama aplikasi dari sistem tertutup menjadi sistem katalog terbuka.

- [ ] **Halaman Katalog Publik (Landing Page)**: Membuat halaman depan yang bisa diakses tanpa login untuk menampilkan daftar produk AC (E-Catalog).
- [ ] **Tombol Akses Admin**: Menambahkan tombol Login pada Header halaman katalog untuk akses masuk ke sistem manajemen.
- [ ] **Pemisahan Dashboard**: Memisahkan `SalesDashboard` (Internal/Privat) dengan `ProductCatalog` (Publik).
- [ ] **Keamanan Supabase (RLS)**: Mengatur kebijakan akses agar tabel `products` bisa dibaca secara anonim, sementara tabel lain tetap privat.

## 2. Implementasi Detail Hak Akses (RBAC)
Rencana teknis pemisahan peran antara Admin, Teknisi, dan Pengunjung.

### A. Infrastruktur Database (Supabase)
- [ ] **Tabel Profiles**: Membuat tabel `profiles` (id, email, role) yang terhubung dengan `auth.users`.
- [ ] **Definisi Role**: Menetapkan 3 level role: `admin`, `technician`, dan `guest` (default).
- [ ] **Kebijakan RLS (Row Level Security)**:
    - `products`: Select (Public), All (Admin).
    - `transactions`: Select (Admin, Technician), Insert (Admin).
    - `customers`: All (Admin).
    - `service_orders`: Select & Update Status (Technician), All (Admin).

### B. Implementasi Frontend (React)
- [ ] **Update AuthContext**: Menambahkan fungsi untuk mengambil data role user dari tabel `profiles` sesaat setelah login berhasil.
- [ ] **Conditional Rendering**:
    - Sembunyikan menu finansial (Dashboard/Laporan) bagi role `technician`.
    - Sembunyikan semua menu manajemen bagi role `guest`.
- [ ] **Role-Based Routing**: Mengupdate `ProtectedRoute.jsx` agar bisa menerima props `allowedRoles` (contoh: `<ProtectedRoute allowedRoles={['admin']}>`).

## 3. Daftar Perbaikan (To-Fix)
Fokus pada sinkronisasi data statis menjadi data dinamis dari database.

- [ ] **Sinkronisasi Data Dashboard**: Mengganti data statis (Total Penjualan, Unit Terjual) dengan query agregasi real-time dari tabel `transactions`.
- [ ] **Daftar Inventori Dinamis**: Memperbaiki halaman `Inventory.jsx` agar mengambil data langsung dari tabel `products` di Supabase.
- [ ] **Log Aktivitas Terkini**: Mengintegrasikan daftar aktivitas di Dashboard dengan data transaksi dan servis terbaru.
- [ ] **Validasi Stok Real-time**: Memastikan tombol "Tambah ke Keranjang" terkunci secara otomatis jika stok di database bernilai 0.

## 4. Rencana Implementasi Fitur Baru (To-Implement)
Fitur tambahan untuk melengkapi kebutuhan operasional bisnis.

### A. Dokumen & Pelaporan
- [ ] **Ekspor PDF Invoice**: Menambahkan tombol "Cetak/Download PDF" pada halaman detail transaksi.
- [ ] **Formulir Laporan Servis Teknis**: Membuat input detail pengerjaan servis (Tekanan Freon, Arus, Suhu, dsb.).

### B. Manajemen Inventori Lanjutan
- [ ] **Notifikasi Stok Rendah**: Sistem peringatan otomatis jika jumlah stok di bawah batas minimum.
- [ ] **Manajemen Vendor/Supplier**: Modul untuk mencatat asal barang dan harga modal.

### C. Fitur Pelanggan
- [ ] **Integrasi WhatsApp**: Tombol cepat untuk mengirimkan invoice atau pengingat servis via WhatsApp.

---
*Dokumen ini akan diperbarui seiring dengan kemajuan pengembangan aplikasi.*
