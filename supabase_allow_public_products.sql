-- ================================================================
-- MIGRATION: Allow Public Read Access to Products Catalog
-- Proyek   : Arctic Clarity — PT. Mitra Maju Sejati
-- Deskripsi: Mengizinkan pengunjung yang belum login (anonymous)
--            untuk melihat katalog produk di aplikasi.
-- ================================================================

-- 1. Pastikan RLS aktif pada tabel products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Buat policy agar siapapun (termasuk anon/guest) bisa membaca data produk
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products"
ON public.products
FOR SELECT
TO public
USING (true);
