-- ================================================================
-- MIGRATION: AC Bundling Materials and Services Insertion
-- Proyek   : Arctic Clarity — PT. Mitra Maju Sejati
-- Deskripsi: Menyisipkan produk material instalasi & jasa ke tabel
--            products agar stoknya bisa dilacak sistem secara dinamis.
-- ================================================================

-- 1. Pastikan kolom 'type' ada di tabel products (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'type'
  ) THEN
    ALTER TABLE products ADD COLUMN type VARCHAR(50) DEFAULT 'unit';
  END IF;
END $$;

-- 2. Sisipkan material standard ke tabel products (jika belum ada)
-- Menggunakan ON CONFLICT jika ada UNIQUE constraint pada kolom nama, atau manual check.
INSERT INTO public.products (name, brand, price, stock, description, status, type, capacity_pk)
VALUES 
  ('Pipa Basic (0.50mm) - Per Meter', 'Generic', 100000, 500, 'Pipa tembaga standar ekonomis per meter.', 'available', 'material', '0.0'),
  ('Pipa Premium (0.60mm JIS) - Per Meter', 'Generic', 130000, 1000, 'Pipa tembaga kualitas premium standar JIS per meter.', 'available', 'material', '0.0'),
  ('Pipa Elite (0.76mm ASTM) - Per Meter', 'Generic', 160000, 300, 'Pipa tembaga kualitas tinggi standar ASTM per meter.', 'available', 'material', '0.0'),
  ('Bracket Outdoor AC', 'Generic', 75000, 200, 'Bracket outdoor unit AC berkualitas tebal.', 'available', 'material', '0.0'),
  ('Jasa Pasang Standard', 'Arctic Clarity', 250000, 9999, 'Jasa instalasi unit AC standard oleh teknisi bersertifikasi.', 'available', 'service', '0.0')
ON CONFLICT DO NOTHING;
