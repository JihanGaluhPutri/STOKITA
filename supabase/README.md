# Supabase Stokita — Migrasi & Seed

## Urutan penerapan (database baru)

Terapkan file migrasi secara berurutan sesuai prefix nomor melalui
**Supabase SQL Editor** (Dashboard → SQL Editor → New query → jalankan per file)
atau `psql` dengan kredensial proyek. Urutan wajib:

| Urutan | File | Isi |
| --- | --- | --- |
| 1 | `migrations/001_create_core_tables.sql` | 5 tabel inti (`profiles`, `products`, `sales`, `sale_items`, `stock_movements`), sequence `seq_no_transaksi`, indeks |
| 2 | `migrations/002_constraints.sql` | Constraint aturan bisnis (role, metode bayar, kembalian, subtotal, tipe mutasi) |
| 3 | `migrations/003_rls_and_privileges.sql` | RLS di seluruh tabel, kebijakan per role, grant minimal, helper `is_admin()` |
| 4 | `migrations/004_add_stock_in.sql` | Fungsi transaksional `add_stock_in` (barang masuk) |
| 5 | `migrations/005_checkout_sale.sql` | Fungsi transaksional `checkout_sale` (penjualan atomik, `FOR UPDATE`) |

Catatan penting:

- Migrasi tidak mengandung kredensial atau secret apa pun.
- Fungsi `add_stock_in` dan `checkout_sale` adalah SECURITY DEFINER dengan
  `search_path` kosong; hak eksekusi dibatasi (tanpa `anon`, tanpa `public`);
  identitas dan role pemanggil divalidasi di dalam fungsi.
- Migrasi dioptimalkan untuk **database baru**. Beberapa bagian idempoten
  (`create table if not exists`, `create or replace function`,
  `create index if not exists`), tetapi **kebijakan RLS di 003 memakai
  `create policy` biasa** — menjalankan ulang 003 pada database yang sudah
  memiliki kebijakan tersebut akan gagal dengan error "already exists".
  Untuk penerapan ulang penuh, gunakan proyek Supabase baru atau hapus
  kebijakan lama terlebih dahulu (keputusan administratif, bukan bagian
  dari prosedur normal).
- Stok **tidak pernah** diubah langsung; grant UPDATE `products` tidak
  mencakup kolom `stok`. Perubahan stok hanya melalui `add_stock_in` dan
  `checkout_sale`.

## Seed data (`seed/`)

Jalankan **setelah** migrasi 001–005 dan pembuatan akun:

| Urutan | Mekanisme | Isi | Idempoten |
| --- | --- | --- | --- |
| 1 | `npm run seed:accounts` (script Node, butuh `SUPABASE_SERVICE_ROLE_KEY` + password dari environment) | 1 admin + 2 kasir melalui Supabase Auth admin API + baris `profiles` | Ya — akun ada → dilewati; profil diselaraskan |
| 2 | `seed/seed_products.sql` (SQL Editor) | 9 barang (stok 0, = min, < min, > min; 1 nonaktif) | Ya — `on conflict (kode) do nothing` |
| 3 | `seed/seed_transactions.sql` (SQL Editor) | 6 transaksi lintas hari (2 kasir, TUNAI & NON_TUNAI) + `sale_items` + `stock_movements` OUT + pengurangan stok dalam satu transaksi | Ya — dilewati bila sudah ada `TRX-SEED-%` |

Jangan pernah menaruh password di file SQL; password akun hanya melalui
environment variable saat menjalankan `seed:accounts`.
