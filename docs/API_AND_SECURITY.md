# API dan Keamanan STOKITA

Dokumen ini mendeskripsikan lapisan API aktual STOKITA (Server Actions
Next.js + RPC PostgreSQL) dan mekanisme keamanan yang ditemukan di kode.
Sumber: `src/app/**/actions.ts`, `src/app/actions/auth.actions.ts`,
`src/services/*`, `src/proxy.ts`, `supabase/migrations/003â€“005`.

> **Catatan:** STOKITA **tidak memiliki REST API route buatan sendiri**
> (tidak ada folder `src/app/api` dan tidak ada route handler GET/POST).
> Seluruh mutasi terjadi melalui **Server Action** Next.js (dipanggil dari
> form/komponen klien) dan **fungsi RPC PostgreSQL**. Bacaan data terjadi di
> Server Component saat render halaman.

## 1. Autentikasi dan Logout

### 1.1 Mekanisme autentikasi

- Login menggunakan **Supabase Auth** (`signInWithPassword`) melalui
  Server Action `login` di `src/app/actions/auth.actions.ts`, yang
  memanggil `authenticateUser` (`src/services/auth.service.ts`).
- Input: `username`, `password`, `next` (opsional). **Username**, bukan
  email: username dipetakan deterministik ke email internal
  `{username}@stokita.local` (`usernameToEmail`) â€” tanpa registrasi publik.
- Validasi server sebelum memanggil Auth: username wajib, password wajib,
  pola username `^[a-z0-9_.-]+$` maks 64 karakter.
- Setelah autentikasi berhasil, server membaca baris `profiles`
  (nama, username, role) dan memastikan role valid serta username cocok;
  bila tidak, sesi langsung di-`signOut` (`AUTH_PROFILE_INVALID`).
- Kegagalan autentikasi (status 4xx) **selalu disamarkan** menjadi pesan
  umum "Username atau password salah." â€” tanpa membedakan user tidak ada
  vs password salah.
- Parameter `next` dibatasi hanya jalur internal yang sesuai role
  (`resolveHome`): harus diawali `/` tanpa `//` dan berada di prefix
  `/admin` (untuk admin) atau `/kasir` (untuk kasir) â€” mencegah open
  redirect dan akses silang role. Selain itu diarahkan ke home role.

### 1.2 Mekanisme logout

- Server Action `logout` â†’ `endSession()`: `signOut()` Supabase Auth.
  Sesi yang sudah tidak ada dianggap sukses (idempoten), lalu redirect
  `/login`.
- Tombol logout di header (`src/components/logout-button.tsx`) memakai
  dialog konfirmasi sebelum submit.

### 1.3 Sesi, cookie, dan token

- Klien Supabase server dibuat dengan `@supabase/ssr`
  (`src/lib/supabase/server.ts`) yang membaca/menulis **cookie sesi**
  (`next/headers`), opsi cookie: `httpOnly: true`, `sameSite: "lax"`,
  `path: "/"`, `secure` saat production.
- `src/proxy.ts` (konvensi Next.js 16 untuk middleware) memvalidasi
  keberadaan sesi untuk semua jalur `/admin` dan `/kasir` dan me-refresh
  cookie hasil rotasi ke respons.
- Tidak ada penyimpanan token di `localStorage`/`sessionStorage`.
  Helper klien browser (`src/lib/supabase/client.ts`, `createBrowserClient`)
  **didefinisikan tetapi tidak dipakai** komponen mana pun saat ini â€”
  semua data lewat Server Component/Server Action.

## 2. Otorisasi dan Pembatasan Akses (berlapis)

| Lapis | Lokasi | Perilaku |
| --- | --- | --- |
| 1. Request boundary | `src/proxy.ts` | Tanpa sesi pada `/admin`/`/kasir` â†’ redirect `/login?next=â€¦`. Role **belum** diputuskan di sini (hanya cek sesi + refresh cookie). |
| 2. Layout halaman | `src/app/admin/layout.tsx`, `src/app/kasir/layout.tsx` | `requireRole("admin"/"kasir")`. Tanpa sesi â†’ redirect login; role salah â†’ komponen `AccessDenied` (pesan ditolak), bukan konten halaman. |
| 3. Server Action / service | semua `src/services/*` | `requireRole`/`requireUser` diulang pada setiap aksi tulis dan query riwayat (mis. `checkoutSale` wajib kasir, `recordStockIn`/`createProduct`/`setProductActive`/`deleteProduct` wajib admin). |
| 4. Database | migrasi 003â€“005 | RLS per tabel + grant minimal + pemeriksaan role di dalam fungsi (`is_admin()`, cek `role` di `add_stock_in`/`checkout_sale`). |

Prinsip: **penolakan default** (`require-role.ts`) â€” tanpa sesi = `AU001`,
role tidak cocok = ditolak; menyembunyikan tombol bukan satu-satunya
pengaman.

## 3. Daftar Server Action (API aplikasi)

Semua dipanggil via POST form (Server Action Next.js), bukan endpoint REST.
"Auth" di bawah = sesi + role yang diperiksa di server.

### 3.1 Autentikasi â€” `src/app/actions/auth.actions.ts`

| Action | Input (FormData) | Output | Auth |
| --- | --- | --- | --- |
| `login(prevState, formData)` | `username`, `password`, `next` | `LoginState` `{ error }` atau **redirect** ke home role/`next` yang valid | Publik (halaman `/login`) |
| `logout(prevState, formData)` | â€” | `LogoutState` `{ error }` atau redirect `/login` | Sesi aktif |

### 3.2 Barang (admin) â€” `src/app/admin/barang/actions.ts`

| Action | Input | Output | Auth |
| --- | --- | --- | --- |
| `createProductAction(prev, formData)` | `kode`, `nama`, `hargaBeli`, `hargaJual`, `stokAwal`, `stokMin` | redirect `?ok=created`, atau `{ fieldErrors }` / `{ error }` | admin |
| `updateProductAction(productId, prev, formData)` | `kode`, `nama`, `hargaBeli`, `hargaJual` (stok/stokMin divalidasi tidak berubah â€” `validateProductUpdateInput`) | redirect `?ok=updated`, atau error | admin |
| `setProductStatusAction(productId, aktif, prev, formData)` | bound: `productId`, `aktif` (arah target) | `{ done: "activated"\|"deactivated" }` atau `{ error, errorCode }` | admin |
| `deleteProductAction(productId, prev, formData)` | bound: `productId` | `{ done: "deleted" }` atau error; bila barang punya riwayat penjualan, FK restrict (SQLSTATE `23503`) dipetakan ke pesan "Barang memiliki riwayat dan tidak dapat dihapus permanen." | admin |

Catatan implementasi: `setProductStatusAction` adalah **satu** action untuk
kedua arah status (parameter `aktif`) â€” keputusan desain yang menutup temuan
salah-pemetaan id antar dua action berdampingan pada build produksi (lihat
[Dokumen Arsitektur â€” Temuan](ARCHITECTURE.md#8-temuan-dan-keterbatasan)).

### 3.3 Barang masuk (admin) â€” `src/app/admin/barang-masuk/actions.ts`

| Action | Input | Output | Auth |
| --- | --- | --- | --- |
| `stockInAction(prev, formData)` | `productId`, `qty`, `referensi`, `catatan` | `{ success: { qty, stokSebelum, stokSesudah } }` atau `{ error }` | admin |

Memanggil fungsi RPC `add_stock_in` (perubahan stok hanya lewat fungsi ini).

### 3.4 Penjualan (kasir) â€” `src/app/kasir/penjualan/actions.ts`

| Action | Input | Output | Auth |
| --- | --- | --- | --- |
| `checkoutAction(prev, formData)` | `items` (JSON string `[{ product_id, qty }]`), `metodeBayar` (`TUNAI`\|`NON_TUNAI`), `bayar` (nominal tunai; string kosong untuk non-tunai) | `{ receipt }` (data struk dari RPC) atau `{ error }` | kasir |

Client hanya mengirim **product_id + qty + metode + nominal tunai**.
Harga, stok, total, bayar akhir, dan kembalian dihitung/divalidasi ulang di
database (lihat [Sequence Penjualan](uml/sequence-penjualan.md)).

### 3.5 RPC PostgreSQL

| Fungsi | Pemanggil | Pemeriksaan di dalam fungsi |
| --- | --- | --- |
| `add_stock_in(p_product_id, p_qty, p_referensi, p_catatan)` | service `recordStockIn` (admin) | sesi (`auth.uid`), role `admin`, `qty > 0`, barang ada & aktif, kunci baris `FOR UPDATE`, update stok + insert `stock_movements` IN â€” atomik |
| `checkout_sale(p_items, p_metode_bayar, p_bayar)` | service `checkoutSale` (kasir) | sesi, role `kasir`, validasi items/metode/bayar, kunci baris urut `id` `FOR UPDATE`, cek aktif & stok, hitung total di DB, insert `sales` + `sale_items`, kurangi stok, insert `stock_movements` OUT â€” seluruhnya atomik |

## 4. Validasi Input dan Penanganan Error

**Tiga lapis validasi** (lapis klien hanya untuk kenyamanan â€” kepercayaan
penuh ada di server/database):

1. **Server (service/action)** â€” `src/lib/validation/product.ts`
   (kode/nama wajib, harga & stok bilangan bulat tidak negatif),
   `validatePositiveInteger` (qty stok masuk & checkout), cek metode
   `TUNAI`/`NON_TUNAI`, filter tanggal divalidasi ulang
   (`validateDateRange`, kedua ujung wajib bila memfilter), sanitasi kata
   kunci pencarian (`sanitizeSearchTerm`).
2. **Database â€” check constraint** (migrasi 002): role `admin|kasir`,
   metode `TUNAI|NON_TUNAI`, `bayar >= total`, `kembalian = bayar - total`,
   aturan non-tunai (`bayar = total`, `kembalian = 0`),
   `subtotal = qty * harga_satuan`, `qty > 0`, `tipe IN|OUT`, nilai
   non-negatif.
3. **Database â€” fungsi transaksional** (004/005): semua kasus gagal
   (`AU001`, `AC001/AC002`, `IN001/IN002`, `PY001â€“PY003`, `CT001â€“CT003`,
   `ST001`) diangkat sebagai exception dengan kode kustom.

**Pemetaan error ke pengguna** (`src/services/errors.ts`):

- Kode kustom (`AU001`, `ST001`, â€¦) â†’ katalog `MESSAGES`
  (`src/lib/business/messages.ts`) â€” sumber kebenaran teks; teks yang sama
  ditulis di migrasi 004/005 dan wajib disinkronkan.
- SQLSTATE bawaan dipetakan: `42501`â†’ akses, `22003`â†’ overflow,
  `22P02`â†’ input tidak valid, `23503`â†’ riwayat, `23505`â†’ duplikat,
  `PGRST301/302`â†’ sesi tidak valid.
- Pesan mentah database **tidak pernah** dikirim ke pengguna; log diagnostik
  hanya di server (`reportServiceError` â†’ `console.error`
  `[stokita:konteks] kode: pesan`).
- Error form mengikat ke field (`fieldErrors`) untuk ditampilkan di bawah
  input terkait; error umum sebagai pesan `role="alert"`.

## 5. Perlindungan Data Sensitif

- **Service role key (`SUPABASE_SERVICE_ROLE_KEY`)** â€” hanya untuk script
  administratif `scripts/create-accounts.mjs` (dijalankan lokal). Tidak
  pernah diawali `NEXT_PUBLIC_`, tidak masuk bundle browser, tidak dipakai
  jalur bisnis harian. **Hanya boleh berada di lingkungan server** dan tidak
  boleh diekspos ke browser atau repository.
- **Anon/publishable key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) memang untuk
  browser; perlindungan datanya adalah **RLS**, bukan kerahasiaan key.
- Password & token: tidak pernah ditulis di source, SQL, seed, log, atau
  dokumentasi; password akun awal hanya dari environment variable saat
  `seed:accounts`.
- `.env.local` masuk `.gitignore`.
- Pesan error login disamarkan; username/email internal tidak dibocorkan
  ke pesan error.
- Server-only enforcement: `import "server-only"` pada modul service,
  `require-user`/`require-role`, dan klien Supabase server â€” modul yang
  berisi logika otorisasi tidak dapat masuk bundle klien.

## 6. Perlindungan Operasi Stok dan Transaksi

- **Stok**: grant UPDATE pada `products` **tidak mencakup kolom `stok`**
  (migrasi 003) â€” bahkan klien auth tidak dapat mengubah stok langsung;
  hanya `add_stock_in`/`checkout_sale` (SECURITY DEFINER, `search_path`
  kosong) yang mengubahnya, dengan kunci baris `FOR UPDATE`.
- **Transaksi**: tidak ada grant INSERT/UPDATE/DELETE pada `sales`,
  `sale_items`, `stock_movements` untuk role aplikasi â€” tulis hanya melalui
  `checkout_sale`.
- **Anti-manipulasi nilai**: harga jual, stok, total, kembalian dihitung
  di database; klien tidak pernah mengirim harga/total.
- **CSRF**: Server Action Next.js memverifikasi header Origin/Host pada
  POST; cookie sesi memakai `SameSite=Lax` + `HttpOnly` (+ `Secure` di
  production).
- **Input JSON checkout**: divalidasi tipe array, per item `product_id`
  (uuid) dan `qty` (integer > 0); barang ganda digabung; barang nonaktif
  atau tidak ditemukan ditolak (`CT003`); stok kurang ditolak (`ST001`).
- **Pembatasan riwayat**: query riwayat kasir ditambah `eq(kasir_id, â€¦)`
  di server **dan** dibatasi RLS (`sales_select_own`) â€” manipulasi parameter
  tidak membuka data kasir lain.

## 7. Penggunaan Supabase Client

| Fungsi | Lokasi | Kunci yang dipakai |
| --- | --- | --- |
| Klien server (cookie sesi) | `src/lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Klien untuk proxy | `src/proxy.ts` | sama (dibaca dari env) |
| Klien browser | `src/lib/supabase/client.ts` | sama â€” **saat ini tidak dipakai** |
| Admin API (seed akun) | `scripts/create-accounts.mjs` | `SUPABASE_SERVICE_ROLE_KEY` (**server/lokal saja**) |

## 8. Risiko / Hal yang Masih Perlu Diperiksa

Temuan berikut didokumentasikan jujur berdasarkan pengamatan kode dan
pengujian; tidak diklaim sudah tertutup sepenuhnya:

1. **Tidak ada rate limiting/anti-brute-force tambahan di sisi aplikasi**
   untuk login (hanya mengandalkan perilaku bawaan Supabase Auth).
   Belum diverifikasi lebih lanjut.
2. **Tidak ada test suite otomatis** â€” yang tersedia hanya `npm run lint`,
   `npm run typecheck`, dan `npm run build`.
3. **Tanpa JavaScript (progressive enhancement)**: submit form Server
   Action tanpa-JS pada halaman `/admin/barang` diamati pernah tidak
   menyelesaikan stream respons render ulang (perilaku Next.js 16.4);
   jalur browser normal (dengan JS) berfungsi. Perlu investigasi lanjutan
   bila dukungan no-JS menjadi kebutuhan.
4. **Temuan build (sudah diperbaiki)**: dua server action berdampingan
   (`activate`/`deactivate` lama) pernah salah terpetakan id-nya pada build
   produksi sehingga tombol memanggil aksi berlawanan; kini diganti satu
   action dengan parameter arah. Rincian:
   [ARCHITECTURE.md â€” Temuan](ARCHITECTURE.md#8-temuan-dan-keterbatasan).
5. **Rotasi `SUPABASE_SERVICE_ROLE_KEY`** disarankan bila key pernah
   tercatat di tempat yang tidak semestinya (belum ada prosedur otomatis).
6. **Query riwayat memakai `limit 100`** tanpa paginasi â€” pada data besar,
   transaksi terlama tidak tampil (keterbatasan fungsional, bukan keamanan).
7. **Tidak ada lapisan audit log aplikasi** untuk aksi admin (riwayat mutasi
   stok tercatat untuk perubahan stok, tetapi edit/aktif-nonaktif barang
   tidak meninggalkan jejak audit terpisah).

Dokumen terkait: [Arsitektur Sistem](ARCHITECTURE.md),
[Database dan State](DATABASE_AND_STATE.md),
[Use Case dan Alur Sistem](USE_CASE_AND_FLOW.md).
