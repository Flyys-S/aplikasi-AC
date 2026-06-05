-- ================================================================
-- DATABASE FIX: Missing Profiles & Row-Level Security (RLS) Policy
-- Proyek   : Arctic Clarity — PT. Mitra Maju Sejati
-- Deskripsi: Menyelesaikan masalah RLS pada tabel service_jobs
--            dengan membuat profil yang hilang, mengotomatisasi
--            pembuatan profil baru, dan menyempurnakan RLS & order number.
-- ================================================================
-- ⚠️  JALANKAN script ini di Supabase SQL Editor:
--     Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. Sinkronisasi Profil yang Hilang dari Tabel auth.users
-- ────────────────────────────────────────────────────────────────
-- Memastikan semua user yang sudah terdaftar memiliki record di public.profiles
INSERT INTO public.profiles (id, role, full_name, email, phone)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'role', 'visitor') AS role,
  COALESCE(raw_user_meta_data->>'full_name', email) AS full_name,
  email,
  raw_user_meta_data->>'phone' AS phone
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 2. Buat Fungsi & Trigger Auto-Create Profile untuk Pendaftaran Baru
-- ────────────────────────────────────────────────────────────────
-- Agar setiap user baru yang mendaftar langsung dibuatkan profil secara otomatis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'visitor'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- 3. Perbaiki Fungsi get_my_role() Agar Memiliki Fallback Aman
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'visitor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────
-- 4. Konfigurasi Ulang Kebijakan RLS di service_jobs
-- ────────────────────────────────────────────────────────────────
ALTER TABLE service_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visitor/Pelanggan bisa buat request" ON service_jobs;
CREATE POLICY "Visitor/Pelanggan bisa buat request"
  ON service_jobs FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Visitor/Pelanggan bisa lihat request sendiri" ON service_jobs;
CREATE POLICY "Visitor/Pelanggan bisa lihat request sendiri"
  ON service_jobs FOR SELECT
  USING (
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admin bisa akses semua" ON service_jobs;
CREATE POLICY "Admin bisa akses semua"
  ON service_jobs FOR ALL
  USING (
    get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "Teknisi bisa lihat tugas sendiri" ON service_jobs;
CREATE POLICY "Teknisi bisa lihat tugas sendiri"
  ON service_jobs FOR SELECT
  USING (
    technician_id = auth.uid()
    OR get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "Teknisi bisa update tugas sendiri" ON service_jobs;
CREATE POLICY "Teknisi bisa update tugas sendiri"
  ON service_jobs FOR UPDATE
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- ────────────────────────────────────────────────────────────────
-- 5. Perbaiki Fungsi Auto-generate order_number
-- ────────────────────────────────────────────────────────────────
-- Menggunakan angka acak 4 digit agar tidak bernilai NULL saat penyisipan data
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'SVC-' ||
      TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(CAST(floor(random() * 10000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable trigger
DROP TRIGGER IF EXISTS trg_generate_order_number ON service_jobs;
CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON service_jobs
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();
