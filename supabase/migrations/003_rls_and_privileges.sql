-- 003_rls_and_privileges.sql
-- Stokita — TB-06: Row Level Security, kebijakan akses, dan pembatasan privilege.
--
-- Prinsip:
-- * Klien tidak pernah memiliki hak tulis pada sales, sale_items, dan
--   stock_movements; semuanya hanya melalui fungsi transaksional.
-- * products.stok tidak dapat diubah langsung: grant UPDATE hanya untuk
--   kolom atribut (kode, nama, harga, aktif), bukan stok.
-- * Kasir hanya membaca penjualannya sendiri; admin membaca semua.

-- Role Supabase (no-op bila sudah ada, mis. pada proyek Supabase).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;

-- Helper role admin: SECURITY DEFINER dengan search_path kosong agar tidak
-- terjadi rekursi RLS pada tabel profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter function public.is_admin() owner to postgres;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Aktifkan RLS pada seluruh tabel.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;

-- profiles: baca sendiri atau admin; tidak ada kebijakan tulis untuk klien.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());

-- products: baca untuk semua pengguna login; tulis khusus admin.
create policy products_select_authenticated on public.products
  for select to authenticated using (true);

create policy products_insert_admin on public.products
  for insert to authenticated with check (public.is_admin());

create policy products_update_admin on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy products_delete_admin on public.products
  for delete to authenticated using (public.is_admin());

-- sales: baca milik sendiri atau admin; tanpa kebijakan tulis (via fungsi saja).
create policy sales_select_own on public.sales
  for select to authenticated using (kasir_id = auth.uid());

create policy sales_select_admin on public.sales
  for select to authenticated using (public.is_admin());

-- sale_items: mengikuti hak akses atas induk transaksinya.
create policy sale_items_select on public.sale_items
  for select to authenticated using (
    exists (
      select 1
      from public.sales s
      where s.id = sale_id
        and (s.kasir_id = auth.uid() or public.is_admin())
    )
  );

-- stock_movements: admin saja; tanpa kebijakan tulis (via fungsi saja).
create policy stock_movements_select_admin on public.stock_movements
  for select to authenticated using (public.is_admin());

-- Hak akses tabel: cabut dulu semua, lalu berikan seperlunya.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.products to authenticated;
grant insert on public.products to authenticated;
-- UPDATE tanpa kolom stok: perubahan stok hanya melalui fungsi transaksional.
grant update (kode, nama, harga_beli, harga_jual, aktif) on public.products to authenticated;
grant delete on public.products to authenticated;
grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;
grant select on public.stock_movements to authenticated;
-- Tidak ada grant insert/update/delete pada sales, sale_items, stock_movements.

-- Tabel/sequence baru berikutnya tidak otomatis mendapat hak lebar.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;
