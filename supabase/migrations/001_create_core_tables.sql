-- 001_create_core_tables.sql
-- Stokita — TB-04: lima tabel inti, relasi, constraint dasar, dan indeks.
-- Terapkan secara berurutan setelah file bernomor lebih kecil.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nama       text not null,
  username   text not null,
  role       text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_unik unique (username)
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  kode        text not null,
  nama        text not null,
  harga_beli  integer not null default 0,
  harga_jual  integer not null,
  stok        integer not null default 0,
  stok_min    integer not null default 0,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint products_kode_unik unique (kode),
  constraint products_harga_beli_nonnegatif check (harga_beli >= 0),
  constraint products_harga_jual_nonnegatif check (harga_jual >= 0),
  constraint products_stok_nonnegatif check (stok >= 0),
  constraint products_stok_min_nonnegatif check (stok_min >= 0)
);

create table if not exists public.sales (
  id           uuid primary key default gen_random_uuid(),
  no_transaksi text not null,
  kasir_id     uuid not null references public.profiles (id) on delete restrict,
  total        integer not null,
  metode_bayar text not null,
  bayar        integer not null,
  kembalian    integer not null,
  tanggal      timestamptz not null default now(),
  constraint sales_no_transaksi_unik unique (no_transaksi),
  constraint sales_total_nonnegatif check (total >= 0),
  constraint sales_bayar_nonnegatif check (bayar >= 0),
  constraint sales_kembalian_nonnegatif check (kembalian >= 0)
);

create table if not exists public.sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references public.sales (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete restrict,
  qty          integer not null,
  harga_satuan integer not null,
  subtotal     integer not null,
  constraint sale_items_qty_positif check (qty > 0),
  constraint sale_items_harga_nonnegatif check (harga_satuan >= 0),
  constraint sale_items_subtotal_nonnegatif check (subtotal >= 0),
  constraint sale_items_satu_produk_per_sale unique (sale_id, product_id)
);

create table if not exists public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete restrict,
  tipe        text not null,
  qty         integer not null,
  referensi   text,
  catatan     text,
  dibuat_oleh uuid not null references public.profiles (id) on delete restrict,
  tanggal     timestamptz not null default now(),
  constraint stock_movements_qty_positif check (qty > 0)
);

-- Nomor transaksi dibangkitkan atomik oleh fungsi checkout_sale.
create sequence if not exists public.seq_no_transaksi;

create index if not exists idx_products_nama on public.products (nama);
create index if not exists idx_sales_kasir_tanggal on public.sales (kasir_id, tanggal);
create index if not exists idx_sales_tanggal on public.sales (tanggal);
create index if not exists idx_sale_items_sale on public.sale_items (sale_id);
create index if not exists idx_sale_items_product on public.sale_items (product_id);
create index if not exists idx_stock_movements_product_tanggal
  on public.stock_movements (product_id, tanggal);
create index if not exists idx_stock_movements_tanggal
  on public.stock_movements (tanggal);
