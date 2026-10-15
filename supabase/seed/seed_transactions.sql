-- seed_transactions.sql — TB-28: data awal transaksi Stokita (idempoten).
--
-- Prasyarat (dalam urutan ini):
--   1. Migrasi 001–005 terpasang.
--   2. Akun kasir dibuat: npm run seed:accounts
--      (membutuhkan profiles dengan username 'kasir1' dan 'kasir2').
--   3. seed_products.sql sudah dijalankan.
--
-- Jalankan melalui Supabase SQL Editor (atau psql) dengan kredensial
-- administratif. Tidak mengandung kredensial/secret apa pun.
--
-- Konsistensi relasi (dalam SATU transaksi database):
--   * sales.total = Σ sale_items.subtotal; bayar/kembalian mengikuti aturan
--     TUNAI (kembalian = bayar - total) dan NON_TUNAI (bayar = total, 0).
--   * sale_items.harga_satuan = harga_jual terkini saat seed dijalankan;
--     subtotal = qty * harga_satuan.
--   * Satu baris stock_movements OUT per item, referensi = no_transaksi,
--     dibuat_oleh = kasir transaksi; products.stok berkurang konsisten.
--
-- Idempoten: bila sudah ada transaksi dengan prefix 'TRX-SEED-', seluruh
-- skrip dilewati (tidak ada duplikasi, stok tidak berkurang dua kali).
-- Tanggal relatif terhadap now() agar selalu mencakup beberapa hari terakhir
-- termasuk hari ini (dashboard & filter tanggal langsung berisi data).
--
-- Data contoh ini hanya untuk pengembangan/demonstrasi; jangan dipakai
-- sebagai transaksi nyata di production tanpa keputusan eksplisit.

begin;

do $$
declare
  v_kasir1    public.profiles.id%type;
  v_kasir2    public.profiles.id%type;
  v_harga     integer;
  v_sale_id   uuid;
  v_total     integer;
begin
  if exists (select 1 from public.sales where no_transaksi like 'TRX-SEED-%') then
    raise notice 'Seed transaksi sudah pernah dijalankan — dilewati (idempoten).';
    return;
  end if;

  select id into v_kasir1 from public.profiles where username = 'kasir1';
  if v_kasir1 is null then
    raise exception 'Akun kasir1 belum ada. Jalankan terlebih dahulu: npm run seed:accounts';
  end if;

  select id into v_kasir2 from public.profiles where username = 'kasir2';
  if v_kasir2 is null then
    raise exception 'Akun kasir2 belum ada. Jalankan terlebih dahulu: npm run seed:accounts';
  end if;

  ---------------------------------------------------------------------------
  -- TRX-SEED-0001 — kasir1, 6 hari lalu, TUNAI
  ---------------------------------------------------------------------------
  select harga_jual into v_harga from public.products where kode = 'BRG-001';
  v_total := 2 * v_harga;
  v_sale_id := gen_random_uuid();
  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, 'TRX-SEED-0001', v_kasir1, v_total, 'TUNAI', 150000, 150000 - v_total,
          now() - interval '6 days');
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 2, p.harga_jual, 2 * p.harga_jual
  from public.products p where p.kode = 'BRG-001';
  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal)
  select p.id, 'OUT', 2, 'TRX-SEED-0001', null, v_kasir1, now() - interval '6 days'
  from public.products p where p.kode = 'BRG-001';
  update public.products set stok = stok - 2 where kode = 'BRG-001' and stok >= 2;
  if not found then
    raise exception 'Stok BRG-001 tidak mencukupi untuk seed TRX-SEED-0001';
  end if;

  ---------------------------------------------------------------------------
  -- TRX-SEED-0002 — kasir2, 5 hari lalu, NON_TUNAI
  ---------------------------------------------------------------------------
  select coalesce(sum(p.harga_jual), 0) into v_total
  from public.products p where p.kode in ('BRG-002', 'BRG-007');
  v_sale_id := gen_random_uuid();
  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, 'TRX-SEED-0002', v_kasir2, v_total, 'NON_TUNAI', v_total, 0,
          now() - interval '5 days');
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 1, p.harga_jual, p.harga_jual
  from public.products p where p.kode = 'BRG-002';
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 1, p.harga_jual, p.harga_jual
  from public.products p where p.kode = 'BRG-007';
  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal)
  select p.id, 'OUT', 1, 'TRX-SEED-0002', null, v_kasir2, now() - interval '5 days'
  from public.products p where p.kode in ('BRG-002', 'BRG-007');
  update public.products set stok = stok - 1 where kode = 'BRG-002' and stok >= 1;
  if not found then
    raise exception 'Stok BRG-002 tidak mencukupi untuk seed TRX-SEED-0002';
  end if;
  update public.products set stok = stok - 1 where kode = 'BRG-007' and stok >= 1;
  if not found then
    raise exception 'Stok BRG-007 tidak mencukupi untuk seed TRX-SEED-0002';
  end if;

  ---------------------------------------------------------------------------
  -- TRX-SEED-0003 — kasir1, 3 hari lalu, TUNAI
  ---------------------------------------------------------------------------
  select harga_jual into v_harga from public.products where kode = 'BRG-006';
  v_total := 3 * v_harga;
  v_sale_id := gen_random_uuid();
  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, 'TRX-SEED-0003', v_kasir1, v_total, 'TUNAI', 50000, 50000 - v_total,
          now() - interval '3 days');
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 3, p.harga_jual, 3 * p.harga_jual
  from public.products p where p.kode = 'BRG-006';
  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal)
  select p.id, 'OUT', 3, 'TRX-SEED-0003', null, v_kasir1, now() - interval '3 days'
  from public.products p where p.kode = 'BRG-006';
  update public.products set stok = stok - 3 where kode = 'BRG-006' and stok >= 3;
  if not found then
    raise exception 'Stok BRG-006 tidak mencukupi untuk seed TRX-SEED-0003';
  end if;

  ---------------------------------------------------------------------------
  -- TRX-SEED-0004 — kasir2, 2 hari lalu, TUNAI
  ---------------------------------------------------------------------------
  select harga_jual into v_harga from public.products where kode = 'BRG-008';
  v_total := 2 * v_harga;
  v_sale_id := gen_random_uuid();
  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, 'TRX-SEED-0004', v_kasir2, v_total, 'TUNAI', 100000, 100000 - v_total,
          now() - interval '2 days');
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 2, p.harga_jual, 2 * p.harga_jual
  from public.products p where p.kode = 'BRG-008';
  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal)
  select p.id, 'OUT', 2, 'TRX-SEED-0004', null, v_kasir2, now() - interval '2 days'
  from public.products p where p.kode = 'BRG-008';
  update public.products set stok = stok - 2 where kode = 'BRG-008' and stok >= 2;
  if not found then
    raise exception 'Stok BRG-008 tidak mencukupi untuk seed TRX-SEED-0004';
  end if;

  ---------------------------------------------------------------------------
  -- TRX-SEED-0005 — kasir1, hari ini, NON_TUNAI
  ---------------------------------------------------------------------------
  select coalesce(sum(p.harga_jual), 0) into v_total
  from public.products p where p.kode in ('BRG-001', 'BRG-004');
  v_sale_id := gen_random_uuid();
  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, 'TRX-SEED-0005', v_kasir1, v_total, 'NON_TUNAI', v_total, 0,
          now() - interval '2 hours');
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 1, p.harga_jual, p.harga_jual
  from public.products p where p.kode = 'BRG-001';
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 1, p.harga_jual, p.harga_jual
  from public.products p where p.kode = 'BRG-004';
  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal)
  select p.id, 'OUT', 1, 'TRX-SEED-0005', null, v_kasir1, now() - interval '2 hours'
  from public.products p where p.kode in ('BRG-001', 'BRG-004');
  update public.products set stok = stok - 1 where kode = 'BRG-001' and stok >= 1;
  if not found then
    raise exception 'Stok BRG-001 tidak mencukupi untuk seed TRX-SEED-0005';
  end if;
  update public.products set stok = stok - 1 where kode = 'BRG-004' and stok >= 1;
  if not found then
    raise exception 'Stok BRG-004 tidak mencukupi untuk seed TRX-SEED-0005';
  end if;

  ---------------------------------------------------------------------------
  -- TRX-SEED-0006 — kasir2, hari ini, TUNAI
  ---------------------------------------------------------------------------
  select harga_jual into v_harga from public.products where kode = 'BRG-002';
  v_total := 2 * v_harga;
  v_sale_id := gen_random_uuid();
  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, 'TRX-SEED-0006', v_kasir2, v_total, 'TUNAI', 50000, 50000 - v_total,
          now() - interval '1 hour');
  insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
  select v_sale_id, p.id, 2, p.harga_jual, 2 * p.harga_jual
  from public.products p where p.kode = 'BRG-002';
  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal)
  select p.id, 'OUT', 2, 'TRX-SEED-0006', null, v_kasir2, now() - interval '1 hour'
  from public.products p where p.kode = 'BRG-002';
  update public.products set stok = stok - 2 where kode = 'BRG-002' and stok >= 2;
  if not found then
    raise exception 'Stok BRG-002 tidak mencukupi untuk seed TRX-SEED-0006';
  end if;

  raise notice 'Seed transaksi selesai: 6 transaksi (TRX-SEED-0001..0006).';
end $$;

commit;
