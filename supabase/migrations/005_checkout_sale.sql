-- 005_checkout_sale.sql
-- Stokita — TB-08: fungsi transaksional checkout (PB-JUAL-06, PB-STOK-01).
--
-- Keamanan & konsistensi:
-- * SECURITY DEFINER dengan search_path kosong; identitas kasir dari auth.uid().
-- * Hanya role kasir yang dapat menjalankan checkout.
-- * Seluruh baris barang dikunci FOR UPDATE dengan urutan id yang konsisten.
-- * Stok dan harga jual dibaca ulang dari database setelah penguncian.
-- * Total, bayar, dan kembalian dihitung di sisi database.
-- * sales, sale_items, pengurangan stok, dan mutasi OUT berjalan atomik:
--   satu kegagalan membatalkan seluruh checkout.
-- * Pesan error harus disinkronkan dengan src/lib/business/messages.ts.

create or replace function public.checkout_sale(
  p_items jsonb,
  p_metode_bayar text,
  p_bayar integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_product_ids uuid[] := '{}'::uuid[];
  v_qty_list integer[] := '{}'::integer[];
  v_harga_list integer[] := '{}'::integer[];
  v_kode_list text[] := '{}'::text[];
  v_nama_list text[] := '{}'::text[];
  v_item jsonb;
  v_pid uuid;
  v_qty integer;
  v_idx integer;
  v_locked integer := 0;
  v_row record;
  v_subtotal integer;
  v_total integer := 0;
  v_bayar integer;
  v_kembalian integer;
  v_sale_id uuid;
  v_no_transaksi text;
  v_tanggal timestamptz;
  v_items_out jsonb := '[]'::jsonb;
  i integer;
begin
  if v_uid is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.'
      using errcode = 'AU001';
  end if;

  select p.role into v_role
    from public.profiles p
   where p.id = v_uid;

  if v_role is distinct from 'kasir' then
    raise exception 'Anda tidak memiliki akses untuk melakukan penjualan.'
      using errcode = 'AC002';
  end if;

  if p_metode_bayar is null or p_metode_bayar not in ('TUNAI', 'NON_TUNAI') then
    raise exception 'Pilih metode pembayaran terlebih dahulu.'
      using errcode = 'PY001';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong.'
      using errcode = 'CT001';
  end if;

  -- Validasi dan akumulasi per barang (barang ganda dijumlahkan).
  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_pid := (v_item ->> 'product_id')::uuid;
    exception when others then
      raise exception 'Barang tidak ditemukan atau sudah tidak aktif.'
        using errcode = 'CT003';
    end;

    if v_pid is null then
      raise exception 'Barang tidak ditemukan atau sudah tidak aktif.'
        using errcode = 'CT003';
    end if;

    begin
      v_qty := (v_item ->> 'qty')::integer;
    exception when others then
      raise exception 'Qty harus berupa bilangan bulat lebih dari 0.'
        using errcode = 'CT002';
    end;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Qty harus berupa bilangan bulat lebih dari 0.'
        using errcode = 'CT002';
    end if;

    v_idx := array_position(v_product_ids, v_pid);
    if v_idx is null then
      v_product_ids := array_append(v_product_ids, v_pid);
      v_qty_list := array_append(v_qty_list, v_qty);
    else
      v_qty_list[v_idx] := v_qty_list[v_idx] + v_qty;
    end if;
  end loop;

  -- Kunci seluruh baris barang dalam urutan id yang konsisten (anti deadlock).
  for v_row in
    select pr.id, pr.kode, pr.nama, pr.harga_jual, pr.stok, pr.aktif
      from public.products pr
     where pr.id = any (v_product_ids)
     order by pr.id
       for update
  loop
    v_locked := v_locked + 1;
    v_idx := array_position(v_product_ids, v_row.id);

    if v_row.aktif is not true then
      raise exception 'Barang tidak ditemukan atau sudah tidak aktif.'
        using errcode = 'CT003';
    end if;

    if v_qty_list[v_idx] > v_row.stok then
      raise exception 'Stok barang % tidak mencukupi.', v_row.kode
        using errcode = 'ST001';
    end if;

    -- Overflow perkalian/penjumlahan memicu 22003 dan membatalkan transaksi.
    v_subtotal := v_row.harga_jual * v_qty_list[v_idx];
    v_total := v_total + v_subtotal;

    v_harga_list[v_idx] := v_row.harga_jual;
    v_kode_list[v_idx] := v_row.kode;
    v_nama_list[v_idx] := v_row.nama;
  end loop;

  if v_locked <> array_length(v_product_ids, 1) then
    raise exception 'Barang tidak ditemukan atau sudah tidak aktif.'
      using errcode = 'CT003';
  end if;

  -- Pembayaran: TUNAI divalidasi; NON_TUNAI dipaksa bayar = total, kembalian 0.
  if p_metode_bayar = 'TUNAI' then
    if p_bayar is null or p_bayar < 0 then
      raise exception 'Uang dibayar tidak valid.'
        using errcode = 'PY002';
    end if;
    if p_bayar < v_total then
      raise exception 'Uang dibayar kurang dari total transaksi.'
        using errcode = 'PY003';
    end if;
    v_bayar := p_bayar;
    v_kembalian := p_bayar - v_total;
  else
    v_bayar := v_total;
    v_kembalian := 0;
  end if;

  v_sale_id := gen_random_uuid();
  v_no_transaksi := 'TRX-'
    || to_char(now(), 'YYYYMMDD')
    || '-'
    || lpad(nextval('public.seq_no_transaksi')::text, 6, '0');
  v_tanggal := now();

  insert into public.sales (id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal)
  values (v_sale_id, v_no_transaksi, v_uid, v_total, p_metode_bayar, v_bayar, v_kembalian, v_tanggal);

  for i in 1 .. array_length(v_product_ids, 1) loop
    insert into public.sale_items (sale_id, product_id, qty, harga_satuan, subtotal)
    values (
      v_sale_id,
      v_product_ids[i],
      v_qty_list[i],
      v_harga_list[i],
      v_harga_list[i] * v_qty_list[i]
    );

    update public.products pr
       set stok = pr.stok - v_qty_list[i]
     where pr.id = v_product_ids[i];

    insert into public.stock_movements (product_id, tipe, qty, referensi, catatan, dibuat_oleh)
    values (v_product_ids[i], 'OUT', v_qty_list[i], v_no_transaksi, null, v_uid);

    v_items_out := v_items_out || jsonb_build_object(
      'product_id', v_product_ids[i],
      'kode', v_kode_list[i],
      'nama', v_nama_list[i],
      'qty', v_qty_list[i],
      'harga_satuan', v_harga_list[i],
      'subtotal', v_harga_list[i] * v_qty_list[i]
    );
  end loop;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'no_transaksi', v_no_transaksi,
    'total', v_total,
    'metode_bayar', p_metode_bayar,
    'bayar', v_bayar,
    'kembalian', v_kembalian,
    'tanggal', v_tanggal,
    'items', v_items_out
  );
end;
$$;

alter function public.checkout_sale(jsonb, text, integer) owner to postgres;
revoke execute on function public.checkout_sale(jsonb, text, integer) from public, anon;
grant execute on function public.checkout_sale(jsonb, text, integer)
  to authenticated, service_role;
