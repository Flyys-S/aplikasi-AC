# Rencana Implementasi Pembaruan Aplikasi Arctic Clarity (Mitra)

Rencana ini disusun berdasarkan umpan balik hasil diskusi dengan mitra untuk meningkatkan efisiensi alur operasional, memisahkan kategori layanan, mempercepat pelaporan teknisi, serta mengadopsi sistem paket penjualan AC ala Selka.id.

## 1. Respons dan Evaluasi Alur Pelayanan
*   **Pembaruan Harga**: Menyiapkan kelola database harga layanan & material dinamis di sisi admin agar ter-update otomatis ke pelanggan.
*   **Sistem Penjadwalan (Scheduling)**:
    *   Membatasi kuota slot harian teknisi untuk mencegah overload.
    *   Fitur tombol sekali klik untuk **Reschedule** (atur ulang jadwal) dan **Cancel** (pembatalan) pesanan.
*   **Efisiensi Waktu Pelaporan**: Menghilangkan birokrasi manual dari lapangan ke kantor dengan menyediakan template laporan digital untuk teknisi.

## 2. Fitur Tambahan & Desain Antarmuka (UI/UX)
*   **Template Pelaporan Teknisi**: Portal mobile-friendly khusus teknisi di lapangan untuk mengisi checklist, foto sebelum/sesudah, material tambahan, dan tanda tangan digital pelanggan yang langsung masuk ke sistem saat disubmit.
*   **Pemisahan Kategori Layanan**: Memisahkan modul "Pemasangan AC Baru" dari modul "Servis/Perawatan" karena kebutuhan estimasi materialnya berbeda.
*   **Perubahan Istilah**: Mengubah opsi menu servis "Perbaikan Kompresor" menjadi istilah yang lebih umum dan aman yaitu "Troubleshoot".
*   **Penyederhanaan Menu Pelanggan**: Jika masuk sebagai pelanggan, navigasi disederhanakan hanya menjadi: **Beranda**, **Katalog**, dan **Servis**.
*   **Fitur Tambahan**: Modul Survei (pengukuran lokasi sebelum pasang) dan modul Nego (pengajuan penawaran harga di luar paket standar).

## 3. Paket Penjualan & Referensi Kompetitor (Selka.id)
*   **Sistem Paket Pemasangan**: Di halaman detail produk AC, pengguna bisa memilih:
    1.  **[Unit Saja]** (Unit Only).
    2.  **[Sistem Paket]**: Rincian pipa (Basic/Premium/Elite) dan hitungan panjang meteran pipa, kabel power, bracket, serta jasa instalasi dengan kalkulasi harga total real-time sebelum order.

## 4. Manajemen Teknis & Antisipasi Kendala
*   **Penjadwalan Tercepat H-1**: Membatasi tanggal pemesanan paling cepat adalah hari berikutnya (H+1) untuk memberi waktu admin memverifikasi ketersediaan teknisi.
*   **Manajemen Review/Komplain**: Mengarahkan ulasan bintang 1-3 ke penanganan komplain internal terlebih dahulu sebelum dipublikasikan secara umum.

---

## Rencana Perubahan File & Struktur Kode

### A. Database (Supabase)
- Menambahkan kolom `role` pada tabel user (`admin`, `customer`, `technician`).
- Menambahkan tabel `installation_packages` untuk menyimpan detail material paket pemasangan.
- Menambahkan tabel `technician_reports` untuk laporan instan teknisi.
- Update status pemesanan di tabel transaksi: `Overload`, `Rescheduled`, `Cancelled`.

### B. Pemisahan Halaman & Komponen (React)
- **`src/pages/CustomerHome/CustomerHome.jsx` [NEW]**: Halaman beranda ringkas khusus pelanggan.
- **`src/pages/TechnicianPortal/TechnicianPortal.jsx` [NEW]**: Portal pengisian laporan kerja teknisi di lapangan.
- **`src/pages/InstallationModule/InstallationModule.jsx` [NEW]**: Halaman khusus pemesanan pemasangan AC baru dan survei lokasi.
- **`src/pages/ProductDetails/ProductDetails.jsx` [MODIFY]**: Menambahkan widget "AC Package Configurator" ala Selka.id.
- **`src/pages/ServiceMaintenance/ServiceMaintenance.jsx` [MODIFY]**: Vali  dasi jadwal H-1, pembatasan kuota, tombol Reschedule/Cancel.
- **`src/App.jsx` [MODIFY]**: Pengaturan routing dinamis berdasarkan role user.
