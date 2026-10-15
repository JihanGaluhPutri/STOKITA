# STOKITA — Sistem Informasi Manajemen Stok dan Penjualan Barang

Aplikasi web manajemen stok dan penjualan untuk UMKM: pengelolaan barang,
pencatatan barang masuk, monitoring stok menipis/habis, transaksi penjualan
(Point of Sale) oleh kasir, serta riwayat transaksi — dengan keamanan berlapis
(RLS, otorisasi role, fungsi transaksi database atomik).

**Stack:** Next.js (App Router) · TypeScript · Supabase (Auth, PostgreSQL, RLS) · Vercel.

## Identitas Tugas

| | |
| --- | --- |
| **Judul** | STOKITA — Sistem Informasi Manajemen Stok dan Penjualan Barang |
| **Mata Kuliah** | Analisis & Pengujian Sistem |
| **Kelas** | IF7A |

**Ketua Kelompok**

- JIHAN GALUH PUTRI — 23EO10034

**Anggota**

- NIA AMELIA — 23EO10035
- ZAKIYATURROHMAH — 23EO10014
- ERSA KINANTI APRILLIA — 23EO10040
- EMALIA NURHAYATI — 23E010046

## Latar Belakang dan Tujuan

UMKM membutuhkan pencatatan stok dan penjualan yang akurat agar tidak terjadi
kehabisan barang, selisih kas, atau hilangnya riwayat transaksi. STOKITA
dibangun untuk:

1. Menjaga data barang, stok, dan transaksi tetap konsisten — perubahan stok
   hanya melalui fungsi database transaksional, bukan editan bebas.
2. Memisahkan hak akses **admin** (pengelolaan persediaan) dan **kasir**
   (penjualan) di setiap lapisan: halaman, Server Action, dan Row Level
   Security database.
3. Menyediakan riwayat penjualan dan pergerakan stok yang dapat ditelusuri
   sebagai dasar pengujian sistem.

## Fitur Utama (berdasarkan implementasi kode)

**Admin** (hak akses `admin`, area `/admin`):

- Dashboard: penjualan hari ini (jumlah transaksi & total), jumlah barang
  menipis/habis.
- Kelola barang: daftar & pencarian, tambah, edit, aktif/nonaktifkan
  (dengan dialog konfirmasi), hapus permanen (dibatasi FK bila punya riwayat).
- Barang masuk: pencatatan penerimaan stok melalui fungsi `add_stock_in`
  (riwayat IN dapat dilihat).
- Monitoring stok: barang aktif dengan stok ≤ stok minimum (Habis/Menipis).
- Riwayat pergerakan stok (IN/OUT) seluruh barang.
- Riwayat penjualan seluruh kasir + detail transaksi, dengan filter tanggal.

**Kasir** (hak akses `kasir`, area `/kasir`):

- Penjualan (POS): pencarian barang **aktif**, keranjang, kuantitas,
  pembayaran TUNAI/NON_TUNAI, dialog konfirmasi, struk digital, tombol
  transaksi baru.
- Riwayat transaksi miliknya sendiri + detail (dibatasi juga oleh RLS).

**Lintas role:** login/logout dengan sesi Supabase Auth, navigasi dan
komponen bersama (header, konfirmasi, pesan error katalog).

## Peran Pengguna

| Role | Area | Kemampuan |
| --- | --- | --- |
| `admin` | `/admin` | Dashboard, kelola barang, barang masuk, monitoring stok, riwayat mutasi stok, riwayat penjualan seluruh kasir |
| `kasir` | `/kasir` | Penjualan (POS) + riwayat transaksi miliknya sendiri |

Tidak ada registrasi publik: akun dibuat lewat `npm run seed:accounts`
(admin API Supabase Auth) dan disesuaikan ke tabel `profiles`.

## Teknologi yang Digunakan

| Komponen | Teknologi | Versi di `package.json` |
| --- | --- | --- |
| Framework | Next.js (App Router, Turbopack) | `^16.4.0` |
| UI | React | `^19.3.0` |
| Bahasa | TypeScript | `^5.9.3` |
| Database & Auth | Supabase — PostgreSQL, Supabase Auth, RLS | `@supabase/supabase-js ^2.117.3`, `@supabase/ssr ^0.12.7` |
| Lint | ESLint + `eslint-config-next` | `^9.39.5` / `^16.4.0` |
| Deploy | Vercel | (proyek `galuh3/stokita`) |

## Prasyarat

- Node.js 20.9+ (dikembangkan dan diverifikasi dengan Node 22)
- npm 11+
- Proyek Supabase (untuk development maupun production)
- Akun Vercel (untuk deployment)

## Instalasi dan Menjalankan Lokal

1. `npm install`
2. Salin `.env.example` menjadi `.env.local` lalu isi nilai dari dashboard
   Supabase (Settings → API). Lihat bagian **Variabel lingkungan**.
3. Terapkan migrasi `supabase/migrations/001`–`005` secara berurutan
   (lihat `supabase/README.md`).
4. Buat akun awal: isi `STOKITA_*_PASSWORD` di `.env.local`, lalu
   `npm run seed:accounts`.
5. (Opsional, untuk demonstrasi) Isi data contoh di SQL Editor:
   `supabase/seed/seed_products.sql`, lalu `supabase/seed/seed_transactions.sql`.
6. `npm run dev` → buka http://localhost:3000

Perintah yang tersedia:

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server development |
| `npm run build` | build production |
| `npm run start` | jalankan build production |
| `npm run typecheck` | pemeriksaan TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run seed:accounts` | buat/selaraskan 1 admin + 2 kasir via Supabase Auth (idempoten) |

## Variabel Lingkungan

| Nama | Development | Production | Keterangan |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Dashboard Vercel | URL proyek Supabase — dipakai browser & server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Dashboard Vercel | Key publik (anon/publishable) — dipakai browser & server |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Dashboard Vercel | **Server saja.** Hanya untuk `seed:accounts`; tidak pernah diawali `NEXT_PUBLIC_`, tidak pernah dikirim ke browser |
| `STOKITA_ADMIN_PASSWORD` | `.env.local` / shell | Tidak perlu di production app | Password awal admin untuk `npm run seed:accounts` |
| `STOKITA_KASIR1_PASSWORD` | `.env.local` / shell | Tidak perlu di production app | Password awal kasir 1 untuk `npm run seed:accounts` |
| `STOKITA_KASIR2_PASSWORD` | `.env.local` / shell | Tidak perlu di production app | Password awal kasir 2 untuk `npm run seed:accounts` |

Aturan keamanan: nilai rahasia tidak pernah ditulis di source code, migrasi
SQL, seed SQL, maupun dokumentasi (hanya nama variabelnya yang didokumentasikan);
`.env.local` sudah masuk `.gitignore`; jika variabel wajib belum diisi,
aplikasi menampilkan pesan konfigurasi yang menyebut nama variabel yang hilang
tanpa menampilkan nilai rahasia.

## Gambaran Database

Lima tabel inti di PostgreSQL (Supabase): `profiles`, `products`, `sales`,
`sale_items`, `stock_movements`, plus sequence `seq_no_transaksi`.

- RLS aktif di seluruh tabel; klien tidak memiliki hak tulis pada `sales`,
  `sale_items`, dan `stock_movements` — semuanya melalui fungsi transaksional.
- Stok hanya berubah melalui `add_stock_in` dan `checkout_sale`
  (SECURITY DEFINER, `search_path` kosong, row locking `FOR UPDATE`, atomik).
- Grant UPDATE pada `products` tidak mencakup kolom `stok`.
- Kasir hanya membaca penjualannya sendiri; admin membaca semua.
- Constraint aturan bisnis (role, metode bayar, kembalian, subtotal, tipe
  mutasi) dijaga di level database.

Rincian tabel, relasi (ERD), fungsi, dan mekanisme konsistensi:
[Dokumen Database dan State](docs/DATABASE_AND_STATE.md). Urutan migrasi dan
seed: `supabase/README.md`.

## Ringkasan Arsitektur

Berjalan sebagai aplikasi Next.js App Router di Vercel:

- **Proxy (`src/proxy.ts`)** — konvensi Next.js 16 (pengganti `middleware.ts`):
  memvalidasi keberadaan sesi untuk `/admin` dan `/kasir`, me-refresh cookie,
  dan mengarahkan ke `/login?next=…` bila tanpa sesi.
- **Server Component + Server Action** — seluruh baca/tulis data terjadi di
  server (tidak ada REST API route buatan sendiri); klien hanya mengirim
  input form minimal (id barang + qty, metode bayar, nominal tunai).
- **Service layer (`src/services/`)** — validasi input, otorisasi
  (`requireRole`/`requireUser`), pemanggilan PostgREST/RPC, dan pemetaan error
  ke katalog pesan (`src/lib/business/messages.ts`).
- **Supabase** — Auth (sesi cookie httpOnly), PostgreSQL dengan RLS, fungsi
  `add_stock_in` & `checkout_sale` sebagai satu-satunya jalur perubahan stok
  dan transaksi.

Detail lengkap: [Arsitektur Sistem](docs/ARCHITECTURE.md).

## Daftar Dokumentasi

- [API dan Keamanan](docs/API_AND_SECURITY.md)
- [Arsitektur Sistem](docs/ARCHITECTURE.md)
- [Database dan State](docs/DATABASE_AND_STATE.md)
- [Deployment dan Operasional](docs/DEPLOYMENT_AND_OPERATIONS.md)
- [Use Case dan Alur Sistem](docs/USE_CASE_AND_FLOW.md)

Dokumentasi UML (`docs/uml/`):

- [Use Case](docs/uml/use-case.md)
- [Sequence Login](docs/uml/sequence-login.md)
- [Sequence Penjualan](docs/uml/sequence-penjualan.md)
- [Activity Penjualan](docs/uml/activity-penjualan.md)
- [Arsitektur Sistem (UML)](docs/uml/arsitektur-sistem.md)

Dokumen kerja lain yang sudah ada di repository:

- [`product-backlog.md`](product-backlog.md) — product backlog per bagian (PB).
- [`technical-backlog.md`](technical-backlog.md) — urutan pekerjaan teknis (TB).
- [`docs/implementation-plan.md`](docs/implementation-plan.md) — rencana
  implementasi & status pengerjaan TB.
- [`supabase/README.md`](supabase/README.md) — migrasi & seed database.

## Deployment (Vercel)

Deployment sudah dijalankan (14 Okt 2026) dan diperbarui mengikuti perubahan
kode:

- Proyek Vercel: `galuh3/stokita`
- URL production: **https://stokita-taupe.vercel.app**
- Env production (3 variabel) diatur via `vercel env add` / dashboard Vercel.
- Prosedur deploy aktual: `vercel link` (sekali) lalu `vercel deploy --prod`
  dari direktori project; build Next.js berjalan otomatis di Vercel.

Prosedur lengkap (persiapan Supabase production, migrasi, akun, env, checklist
pra/pasca rilis) ada di
[Dokumen Deployment dan Operasional](docs/DEPLOYMENT_AND_OPERATIONS.md).
Jangan pernah menaruh secret di source atau log.

## Struktur Direktori

```
src/
  proxy.ts       proteksi rute (sesi) — konvensi Next.js 16
  app/           rute App Router (login, admin, kasir) + Server Actions
  components/    komponen presentasi (header, dialog konfirmasi, ikon, dll.)
  lib/
    supabase/    klien server (cookie) dan helper klien browser
    auth/        helper otorisasi (require-user/require-role)
    business/    logika bisnis murni (stok, pembayaran, tanggal, pesan, format)
    validation/  validasi input server
    env.ts       validasi environment variable
  services/      service layer (pemanggil RPC, pemetaan error)
  types/         tipe TypeScript
supabase/
  migrations/    migrasi SQL berurutan (001–005)
  seed/          seed SQL idempoten (barang, transaksi)
scripts/
  create-accounts.mjs  pembuatan akun awal via Supabase Auth admin API
docs/            dokumentasi utama + subfolder uml/
```

## Hak Akses Role (berlapis)

Pembatasan diterapkan di empat lapisan, bukan hanya menyembunyikan tombol:

1. `src/proxy.ts` — cek sesi untuk semua jalur `/admin` dan `/kasir`.
2. Layout per role (`requireRole` di `src/app/admin/layout.tsx` dan
   `src/app/kasir/layout.tsx`) — redirect login atau halaman akses ditolak.
3. Server Action/service — `requireRole`/`requireUser` diulang di setiap
   aksi tulis dan query riwayat.
4. RLS + fungsi database — kebijakan per tabel, grant minimal, pemeriksaan
   role di dalam `add_stock_in` dan `checkout_sale`.

Akun awal (dibuat via `seed:accounts`): `admin`, `kasir1`, `kasir2`
(login memakai username; email internal `{username}@stokita.local`).

## Zona Waktu Bisnis

Ringkasan penjualan harian (dashboard) dan batas filter tanggal mengikuti
zona waktu bisnis **Asia/Jakarta** (konstanta di
`src/lib/business/date-range.ts`). Konfirmasi kebutuhan bisnis bila zona
waktu lain diperlukan.
