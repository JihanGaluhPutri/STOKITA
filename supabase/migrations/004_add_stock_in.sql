-- 004_add_stock_in.sql
-- Stokita — TB-07: fungsi transaksional penambahan stok (PB-BM-01, PB-STOK-01).
--
-- Keamanan:
-- * SECURITY DEFINER dengan search_path kosong; identitas dari auth.uid().
-- * Hanya role admin yang dapat menjalankan.
-- * Baris barang dikunci FOR UPDATE; seluruh operasi atomik.
-- * Pesan error harus disinkronkan dengan src/lib/business/messages.ts.

create or replace function public.add_stock_in(
  p_product_id uuid,
  p_qty integer,
  p_referensi text default null,
  p_catatan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_stok_lama integer;
  v_stok_baru integer;
  v_aktif boolean;
begin
  if v_uid is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.'
      using errcode = 'AU001';
  end if;

  select p.role into v_role
    from public.profiles p
   where p.id = v_uid;

  if v_role is distinct from 'admin' then
    raise exception 'Anda tidak memiliki akses untuk mencatat barang masuk.'
      using errcode = 'AC001';
  end if;

  if p_qty is null or p_qty <= 0 then
    raise exception 'Jumlah barang masuk harus berupa bilangan bulat lebih dari 0.'
      using errcode = 'IN001';
  end if;

  select pr.stok, pr.aktif
    into v_stok_lama, v_aktif
    from public.products pr
   where pr.id = p_product_id
     for update;

  if not found then
    raise exception 'Barang tidak ditemukan atau sudah tidak aktif.'
      using errcode = 'IN002';
  end if;

  if v_aktif is not true then
    raise exception 'Barang tidak ditemukan atau sudah tidak aktif.'
      using errcode = 'IN002';
  end if;

  -- Overflow memicu SQLSTATE 22003 dan membatalkan seluruh transaksi.
  v_stok_baru := v_stok_lama + p_qty;

  update public.products pr
     set stok = v_stok_baru
   where pr.id = p_product_id;

  insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh)
  values (p_product_id, 'IN', p_qty, p_referensi, p_catatan, v_uid);

  return jsonb_build_object(
    'product_id', p_product_id,
    'stok_sebelum', v_stok_lama,
    'stok_sesudah', v_stok_baru
  );
end;
$$;

alter function public.add_stock_in(uuid, integer, text, text) owner to postgres;
revoke execute on function public.add_stock_in(uuid, integer, text, text) from public, anon;
grant execute on function public.add_stock_in(uuid, integer, text, text)
  to authenticated, service_role;
