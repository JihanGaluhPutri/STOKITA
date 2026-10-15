-- seed_products.sql — TB-27: data awal barang Stokita (idempoten).
--
-- Jalankan SETELAH migrasi 001–005 dan pembuatan akun (npm run seed:accounts)
-- melalui Supabase SQL Editor (atau psql) dengan kredensial administratif.
-- Tidak mengandung kredensial/secret apa pun.
--
-- Idempoten: `on conflict (kode) do nothing` — dijalankan ulang tidak
-- menduplikasi barang dan tidak mengubah stok yang sudah ada.
-- Stok awal dimasukkan lewat INSERT (sama seperti form "Tambah barang"),
-- BUKAN melalui alur penjualan palsu — tanpa mutasi stock_movements.
--
-- Variasi stok: nol (habis), tepat pada minimum (menipis), di bawah minimum
-- (menipis), dan di atas minimum (aman); ditambah satu barang nonaktif.

insert into public.products (kode, nama, harga_beli, harga_jual, stok, stok_min, aktif) values
  ('BRG-001', 'Beras Premium 5kg',      60000,  68000, 40, 10, true),
  ('BRG-002', 'Minyak Goreng 1L',       15000,  17500, 24,  8, true),
  ('BRG-003', 'Gula Pasir 1kg',         14000,  16000, 10, 10, true),
  ('BRG-004', 'Kopi Bubuk 200g',        18000,  22000,  5,  6, true),
  ('BRG-005', 'Teh Celup 25 tag',        8000,  10000,  0,  5, true),
  ('BRG-006', 'Sabun Cuci Piring 800ml',12000,  15000, 30, 10, true),
  ('BRG-007', 'Mie Instan (kardus)',   110000, 125000, 12,  4, true),
  ('BRG-008', 'Air Mineral 600ml (dus)',28000,  32000, 18,  6, true),
  ('BRG-009', 'Susu UHT 1L',            15500,  18000, 15,  5, false)
on conflict (kode) do nothing;

-- Hasil yang diharapkan setelah seed (barang aktif):
--   Habis   : BRG-005 (stok 0)
--   Menipis : BRG-003 (stok = min 10), BRG-004 (stok 5 < min 6)
--   Aman    : BRG-001, BRG-002, BRG-006, BRG-007, BRG-008
--   Nonaktif: BRG-009 (tidak muncul di POS kasir)
