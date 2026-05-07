# Diagram Alur Aplikasi Arctic Clarity (Versi Katalog Terbuka)

File ini berisi dokumentasi alur kerja aplikasi dalam format **Mermaid.js**. Aplikasi menggunakan sistem *Open Catalog* di mana halaman depan dapat diakses secara publik.

## 1. Diagram Use Case (Detail Sistem Arctic Clarity)
Diagram ini menjelaskan hubungan antar fitur dengan relasi `<<include>>` (wajib ada) dan `<<extend>>` (opsional/tambahan) untuk alur kerja yang lebih akurat.

```mermaid
graph LR
    %% Definisi Aktor
    Visitor["👤 Pengunjung / Pelanggan"]
    Admin["👑 Admin / Owner"]
    Technician["🔧 Teknisi"]

    subgraph "Sistem Arctic Clarity"
        direction TB
        
        %% Use Cases Utama
        UC_Auth((Login & Logout))
        UC_Signup((Daftar Akun))
        UC_Catalog((Lihat Katalog AC))
        UC_Checkout((Online Checkout))
        UC_ManageStock((Kelola Stok Barang))
        UC_Transaction((Input Transaksi Penjualan))
        UC_UpdateStock((Update Stok Otomatis))
        UC_Customer((Kelola Data Pelanggan))
        UC_Schedule((Kelola Jadwal Servis))
        UC_WorkStatus((Update Status Kerja))
        UC_Invoice((Cetak Invoice PDF))
        UC_Dashboard((Dashboard & Laporan))

        %% Relasi Internal (Include/Extend)
        UC_Checkout -.-> |"<<include>>"| UC_Auth
        UC_Checkout -.-> |"<<include>>"| UC_UpdateStock
        UC_Transaction -.-> |"<<include>>"| UC_UpdateStock
        UC_Transaction -.-> |"<<include>>"| UC_Customer
        UC_Invoice -.-> |"<<extend>>"| UC_Transaction
        UC_Invoice -.-> |"<<extend>>"| UC_Checkout
        UC_WorkStatus -.-> |"<<extend>>"| UC_Schedule
    end

    %% Hubungan Pengunjung
    Visitor --- UC_Auth
    Visitor --- UC_Signup
    Visitor --- UC_Catalog
    Visitor --- UC_Checkout

    %% Hubungan Admin
    Admin --- UC_Auth
    Admin --- UC_ManageStock
    Admin --- UC_Transaction
    Admin --- UC_Customer
    Admin --- UC_Schedule
    Admin --- UC_Dashboard

    %% Hubungan Teknisi
    Technician --- UC_Auth
    Technician --- UC_Catalog
    Technician --- UC_Schedule
    Technician --- UC_WorkStatus
```

## 2. Alur Validasi Hak Akses (RBAC Logic)
Menjelaskan bagaimana sistem menentukan halaman yang boleh diakses user.

```mermaid
graph TD
    A[User Berhasil Login] --> B[Ambil Data Profile dari Supabase]
    B --> C{Cek Role User}
    C -- Admin -- > D[Akses Penuh: Dashboard, Finansial, Inventori, Servis]
    C -- Teknisi -- > E[Akses Terbatas: Jadwal Servis & Katalog]
    C -- Guest/Lainnya -- > F[Akses Hanya Katalog Produk]
    D --> G[Tampilkan Menu Lengkap]
    E --> H[Sembunyikan Menu Finansial]
    F --> I[Redirect ke Katalog]
```

## 3. Alur Masuk & Autentikasi Pengguna
Menjelaskan bagaimana pengguna mengakses katalog publik dan masuk ke sistem manajemen.

```mermaid
graph TD
    A[Buka Aplikasi] --> B[Halaman Katalog Publik]
    B --> C[Pengunjung Melihat Produk]
    B --> D[Klik Tombol Login]
    D --> E[Halaman Login]
    E --> F[Autentikasi Google/Supabase]
    F -- Sukses --> G{Validasi Role}
    G -- Admin/Teknisi --> H[Masuk ke Dashboard Sesuai Role]
    G -- Tidak Terdaftar --> I[Tampilkan Pesan Error / Akses Ditolak]
    F -- Gagal --> E
```

## 4. Alur Transaksi Penjualan (Internal Admin)
Hanya bisa dilakukan oleh Admin setelah login.

```mermaid
graph TD
    A[Dashboard Admin] --> B[Klik 'Transaksi Baru']
    B --> C[Pilih Pelanggan / Walk-in]
    C --> D[Cari & Pilih Produk AC]
    D --> E[Masukkan ke Keranjang]
    E --> F{Tambah Produk Lagi?}
    F -- Ya --> D
    F -- Tidak --> G[Pilih Metode Pembayaran]
    G --> H[Klik 'Simpan Transaksi']
    H --> I[Update Stok di Database]
    I --> J[Generate Invoice ID]
    J --> K[Lihat Detail Invoice]
```

## 5. Alur Manajemen Inventori & Stok
Proses pengelolaan data produk oleh Admin.

```mermaid
graph TD
    A[Dashboard Admin] --> B[Navigasi 'Inventori']
    B --> C[Tampilkan Daftar Produk]
    C --> D[Cari Produk Berdasarkan Nama/Brand]
    D --> E[Klik Produk]
    E --> F[Lihat Detail & Spesifikasi]
    F --> G{Aksi Tambahan}
    G -- Tambah Baru --> H[Form Produk Baru]
    G -- Edit Stok --> I[Update Stok Database]
```

## 6. Alur Manajemen Pelanggan
Pengelolaan data pelanggan dan riwayat transaksi.

```mermaid
graph TD
    A[Dashboard Admin] --> B[Navigasi 'Pelanggan']
    B --> C[Tampilkan Daftar Pelanggan]
    C --> D[Cari Nama/No. Telepon]
    D --> E[Klik Detail Pelanggan]
    E --> F[Lihat Profil & Riwayat Transaksi]
    F --> G[Klik Salah Satu Transaksi]
    G --> H[Lihat Detail Invoice Terkait]
```

## 7. Alur Penjadwalan Servis
Manajemen jadwal teknisi dan status pengerjaan.

```mermaid
graph TD
    A[Dashboard/Menu Servis] --> B[Lihat Jadwal Mendatang]
    B --> C[Admin: Buat Jadwal Servis]
    B --> D[Teknisi: Pilih Tugas]
    D --> E[Teknisi: Update Status Kerja]
    E --> F[Database: Update Status Servis]
    F --> G[Tampilan: Status Selesai]
```

## 8. Alur Pendaftaran Akun Baru (Email & Password)
**Status: Belum Diimplementasikan (Rencana Mendatang)**

```mermaid
graph TD
    A[Halaman Login] --> B[Klik 'Daftar Sekarang']
    B --> C[Form Pendaftaran Akun]
    C --> D[Input Nama, Email, & Password]
    D --> E[Klik 'Buat Akun']
    E --> F{Validasi Data}
    F -- Valid --> G[Kirim Email Verifikasi]
    F -- Tidak Valid --> C
    G --> H[Konfirmasi Email oleh User]
    H --> I[Login Otomatis]
    I --> J[Cek Role & Dashboard]
```

---
*Catatan: Gunakan editor Markdown yang mendukung Mermaid (seperti VS Code dengan extension, GitHub, atau Notion) untuk melihat diagram secara visual.*

## 9. Alur Online Checkout (Pengunjung/Pelanggan)
Proses pembelian mandiri oleh pelanggan melalui katalog publik.

```mermaid
graph TD
    A[Buka Katalog Publik] --> B[Pilih Produk AC]
    B --> C[Klik Tombol 'Checkout']
    C --> D{Sudah Login?}
    D -- Belum -- > E[Halaman Login]
    E --> F[Login Berhasil]
    F --> G[Halaman Konfirmasi Pesanan]
    D -- Sudah -- > G
    G --> H[Input Alamat/Detail Pengiriman]
    H --> I[Pilih Metode Pembayaran]
    I --> J[Konfirmasi Pembayaran]
    J --> K[Sistem: Update Stok Database]
    K --> L[Sistem: Generate Invoice]
    L --> M[Tampilkan Invoice ke Pelanggan]
```
