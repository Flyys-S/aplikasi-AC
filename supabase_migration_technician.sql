-- ================================================================
-- MIGRATION: Technician Dashboard — Service Jobs Table Enhancement
-- Proyek   : Arctic Clarity — PT. Mitra Maju Sejati
-- Tanggal  : 2026-06-05
-- Deskripsi: Menambah kolom baru pada tabel service_jobs yang
--            sudah ada, untuk mendukung fitur Dashboard Teknisi.
-- ================================================================
-- ⚠️  JALANKAN script ini di Supabase SQL Editor
--     Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 1: ALTER TABLE service_jobs (jika kolom belum ada)
--           Menambah kolom yang dibutuhkan Dashboard Teknisi
-- ────────────────────────────────────────────────────────────────

ALTER TABLE service_jobs
  ADD COLUMN IF NOT EXISTS order_number      VARCHAR(30),
  ADD COLUMN IF NOT EXISTS service_type      VARCHAR(50) DEFAULT 'maintenance',
  ADD COLUMN IF NOT EXISTS complaint_description TEXT,
  ADD COLUMN IF NOT EXISTS technician_action TEXT,
  ADD COLUMN IF NOT EXISTS technician_notes  TEXT,
  ADD COLUMN IF NOT EXISTS service_address   TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time    TIME,
  ADD COLUMN IF NOT EXISTS started_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_fee       NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parts_cost        NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_level    SMALLINT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS created_by        UUID REFERENCES auth.users(id);

-- Pastikan kolom status punya nilai yang benar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_jobs' AND column_name = 'status'
  ) THEN
    ALTER TABLE service_jobs ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 2: Buat tabel service_job_logs (audit trail)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_job_logs (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_job_id   BIGINT REFERENCES service_jobs(id) ON DELETE CASCADE,
  old_status       VARCHAR(20),
  new_status       VARCHAR(20) NOT NULL,
  changed_by       UUID REFERENCES auth.users(id),
  change_reason    TEXT,
  changed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 3: Index untuk performa query Teknisi
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_service_jobs_technician_id
  ON service_jobs(technician_id);

CREATE INDEX IF NOT EXISTS idx_service_jobs_status
  ON service_jobs(status);

CREATE INDEX IF NOT EXISTS idx_service_jobs_scheduled_date
  ON service_jobs(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_service_jobs_priority
  ON service_jobs(priority_level DESC);

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 4: Fungsi Auto-generate order_number
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'SVC-' ||
      TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(CAST(NEW.id AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_order_number ON service_jobs;
CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON service_jobs
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 5: Fungsi Audit Log saat status berubah
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_service_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO service_job_logs (service_job_id, old_status, new_status, changed_by, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_status_change ON service_jobs;
CREATE TRIGGER trg_log_status_change
  AFTER UPDATE ON service_jobs
  FOR EACH ROW EXECUTE FUNCTION log_service_job_status_change();

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 6: Row Level Security (RLS) Policies
-- ────────────────────────────────────────────────────────────────

-- 1. Helper function get_my_role() untuk mencegah infinite recursion RLS profiles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE service_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_job_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teknisi bisa lihat tugas sendiri"     ON service_jobs;
DROP POLICY IF EXISTS "Teknisi bisa update tugas sendiri"    ON service_jobs;
DROP POLICY IF EXISTS "Admin bisa akses semua"               ON service_jobs;
DROP POLICY IF EXISTS "Visitor/Pelanggan bisa lihat request sendiri" ON service_jobs;
DROP POLICY IF EXISTS "Visitor/Pelanggan bisa buat request"  ON service_jobs;
DROP POLICY IF EXISTS "Admin bisa baca semua log"            ON service_job_logs;
DROP POLICY IF EXISTS "Teknisi bisa baca log miliknya"       ON service_job_logs;

CREATE POLICY "Teknisi bisa lihat tugas sendiri"
  ON service_jobs FOR SELECT
  USING (
    technician_id = auth.uid()
    OR get_my_role() = 'admin'
  );

CREATE POLICY "Teknisi bisa update tugas sendiri"
  ON service_jobs FOR UPDATE
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Admin bisa akses semua"
  ON service_jobs FOR ALL
  USING (
    get_my_role() = 'admin'
  );

CREATE POLICY "Visitor/Pelanggan bisa lihat request sendiri"
  ON service_jobs FOR SELECT
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Visitor/Pelanggan bisa buat request"
  ON service_jobs FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Admin bisa baca semua log"
  ON service_job_logs FOR SELECT
  USING (
    get_my_role() = 'admin'
  );

CREATE POLICY "Teknisi bisa baca log miliknya"
  ON service_job_logs FOR SELECT
  USING (changed_by = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 7: Aktifkan Realtime untuk live update Teknisi
-- ────────────────────────────────────────────────────────────────

-- Aktifkan di: Supabase Dashboard → Database → Replication → Tables
-- Pilih: service_jobs → Enable

-- Atau via SQL (mungkin perlu hak superuser):
-- ALTER PUBLICATION supabase_realtime ADD TABLE service_jobs;

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 8: Data Dummy Testing (Opsional — hapus di production)
-- ────────────────────────────────────────────────────────────────

/*
-- CONTOH INSERT: Uncomment untuk testing
INSERT INTO service_jobs
  (customer_id, technician_id, service_type, complaint_description,
   service_address, scheduled_date, priority_level, status, notes)
SELECT
  c.id,
  (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'technician' LIMIT 1),
  'repair',
  'AC tidak dingin, freon kemungkinan bocor, suara outdoor berisik',
  'Jl. Merdeka No. 12, Surabaya Pusat',
  CURRENT_DATE,
  3,
  'pending',
  'Customer minta dikerjakan pagi hari sebelum jam 10'
FROM customers c
LIMIT 1;
*/

-- ================================================================
-- ✅ SELESAI! Script migration berhasil dijalankan.
--    Cek tabel service_jobs di Table Editor untuk konfirmasi.
-- ================================================================
