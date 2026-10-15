-- 002_constraints.sql
-- Stokita — TB-05: constraint aturan bisnis yang menjamin validitas data
-- meskipun permintaan melewati validasi antarmuka.

-- Role hanya boleh admin atau kasir.
alter table public.profiles
  add constraint profiles_role_valid check (role in ('admin', 'kasir'));

-- Metode pembayaran hanya TUNAI atau NON_TUNAI.
alter table public.sales
  add constraint sales_metode_bayar_valid check (metode_bayar in ('TUNAI', 'NON_TUNAI'));

-- Uang dibayar harus mencukupi total dan kembalian konsisten dengan selisih.
alter table public.sales
  add constraint sales_bayar_cukup check (bayar >= total);

alter table public.sales
  add constraint sales_kembalian_konsisten check (kembalian = bayar - total);

-- Pembayaran non-tunai: bayar = total dan kembalian = 0.
alter table public.sales
  add constraint sales_non_tunai_aturan
  check (metode_bayar <> 'NON_TUNAI' or (bayar = total and kembalian = 0));

-- Subtotal konsisten dengan kuantitas dan harga satuan.
alter table public.sale_items
  add constraint sale_items_subtotal_konsisten check (subtotal = qty * harga_satuan);

-- Mutasi stok hanya IN atau OUT.
alter table public.stock_movements
  add constraint stock_movements_tipe_valid check (tipe in ('IN', 'OUT'));
