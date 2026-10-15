# Deployment dan Operasional STOKITA

Dokumen ini menjelaskan prosedur deployment dan operasional STOKITA
**berdasarkan konfigurasi yang benar-benar ada di repository dan riwayat
deployment aktual**. Bagian yang sudah dijalankan dibedakan jelas dari
rekomendasi yang **belum** diterapkan.

## 1. Prasyarat

| Kebutuhan | Keterangan |
| --- | --- |
| Node.js | 20.9+ (dikembangkan/diverifikasi dengan Node 22) |
| npm | 11+ |
| Proyek Supabase | Untuk development dan production (dapat terpisah) |
| Akun Vercel | Untuk deploy ke `https://stokita-taupe.vercel.app` |
| Konsol Vercel (CLI) | `vercel` CLI (pernah dijalankan versi 54.x) untuk deploy CLI |

## 2. Menjalankan Aplikasi Secara Lokal

```bash
npm install
cp .env.example .env.local        # lalu isi dari dashboard Supabase (Settings â†’ API)
# terapkan migrasi 001â€“005 via SQL Editor (lihat supabase/README.md)
npm run seed:accounts             # butuh STOKITA_*_PASSWORD di .env.local
npm run dev                       # http://localhost:3000
```

Opsional (data demonstrasi): `supabase/seed/seed_products.sql` lalu
`supabase/seed/seed_transactions.sql` di SQL Editor.

Perintah lain: `npm run build`, `npm run start`, `npm run lint`,
`npm run typecheck`.

## 3. Environment Variable

| Nama | Nilai diisi dari | Dipakai oleh |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard Supabase (Settings â†’ API) | browser & server (di `getSupabasePublicConfig`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard Supabase | browser & server |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase | **hanya** `scripts/create-accounts.mjs` (server/lokal) |
| `STOKITA_ADMIN_PASSWORD` / `STOKITA_KASIR1_PASSWORD` / `STOKITA_KASIR2_PASSWORD` | ditentukan pengelola | **hanya** `npm run seed:accounts` |

- Development: `.env.local` (sudah `.gitignore`).
- Production: Environment Variables di dashboard Vercel (Production branch).
- Jangan isi `STOKITA_*_PASSWORD` di Vercel â€” cukup sekali saat pembuatan
  akun.
- Jika `NEXT_PUBLIC_*` belum terisi, aplikasi menampilkan pesan
  konfigurasi yang menyebut nama variabelnya (tanpa nilai rahasia) â€”
  didefinisikan di `src/lib/env.ts`.
- **Catatan operasional:** perintah `vercel link` menambahkan
  `VERCEL_OIDC_TOKEN` ke `.env lokal` proyek â€” token tersebut untuk
  integrasi deploy CLI, bukan variabel aplikasi.

## 4. Menyiapkan dan Menghubungkan Supabase

**Database baru (sekali per lingkungan):**

1. Buat proyek Supabase â†’ catat URL & key.
2. Terapkan migrasi `supabase/migrations/001 â†’ 005` **urut** via SQL
   Editor (atau `psql`) â€” rincian di `supabase/README.md`.
   Migrasi tidak mengandung secret.
3. Buat akun awal: isi `SUPABASE_SERVICE_ROLE_KEY` + `STOKITA_*_PASSWORD`
   di `.env.local` â†’ `npm run seed:accounts` (admin API
   `createUser` + sinkronisasi baris `profiles`; idempoten; tanpa
   registrasi publik).
4. (Opsional, demonstrasi) seed produk & transaksi SQL.

**Koneksi aplikasi:** klien SSR memakai URL + anon key + cookie sesi;
`proxy.ts` membaca variabel yang sama. Tidak ada koneksi DB langsung dari
aplikasi (semua lewat PostgREST/RPC Supabase).

## 5. Build dan Deployment (aktual)

**Status:** deployment production sudah berjalan di Vercel â€” proyek
`galuh3/stokita`, URL **https://stokita-taupe.vercel.app**, env 3 variabel
terisi. Deploy terakhir mengikuti perbaikan fitur barang & login.

**Prosedur deploy yang dipakai (CLI):**

```bash
# sekali per mesin/kerja: tautkan direktori project ke proyek Vercel
vercel link --yes --project stokita

# setiap rilis
vercel deploy --prod
```

- Build Next.js (`npm run build`, Turbopack) berjalan otomatis di Vercel;
  pastikan status deployment `READY`.
- Deployment produksi diberi alias ke `https://stokita-taupe.vercel.app`.
- Env production diatur sekali via `vercel env add <nama> production`
  atau dashboard (Settings â†’ Environment Variables).

**Alternatif bila mengimpor proyek baru** (belum dijalankan ulang â€”
prosedur umum): impor repository ke Vercel â†’ isi 3 env â†’ deploy branch
produksi â†’ verifikasi login/redirect/operasi inti.

**Perubahan database:** buat file migrasi baru bernomor lanjutan (`006`, â€¦)
dan terapkan **manual** ke Supabase sebelum/menyesuaikan deploy aplikasi
yang memakainya. Tidak ada otomasi migrasi otomatis saat deploy.

**Catatan integrasi Git:** riwayat deployment yang dijalankan memakai
Vercel CLI dari direktori project. Integrasi auto-deploy dari push Git
belum diverifikasi pada repository ini â€” jangan menganggapnya aktif tanpa
memeriksa pengaturan proyek Vercel.

## 6. Pengelolaan Log dan Troubleshooting

**Log:**

- Log build & runtime: dashboard Vercel (Deployments â†’ pilih deployment â†’
  Logs / Functions) atau `vercel logs <url>`.
- Log diagnostik aplikasi di server: `console.error` berformat
  `[stokita:konteks] KODE: pesan` (hanya server; pesan error ke pengguna
  sudah dipetakan dari katalog `messages.ts`).
- Database: Supabase Dashboard â†’ Logs (Postgres/API).

**Error umum dan penanganan:**

| Gejala | Penyebab umum | Tindakan |
| --- | --- | --- |
| Pesan "Konfigurasi Supabase belum lengkap. Variabel yang belum tersedia: â€¦" | `NEXT_PUBLIC_*` belum terisi di env aktif | Isi variabel yang disebut di `.env.local` / Vercel |
| Semua jalur terproteksi langsung redirect login, login pun gagal | Env Supabase tidak cocok antara build dan runtime, atau cookie `secure` di HTTP lokal | Pastikan konsistensi env; local pakai `npm run dev` (HTTP) dengan `.env.local` |
| Pesan "Username atau password salah." padahal yakin benar | Akun belum dibuat / profil `profiles` tidak sinkron | Jalankan `npm run seed:accounts`; periksa tabel `profiles` |
| "Sesi Anda tidak valid. Silakan login kembali." (`AU001`) | Cookie sesi kedaluwarsa/dihapus; atau `PGRST301/302` | Login ulang |
| "Anda tidak memiliki aksesâ€¦" | Role tidak sesuai / bukan admin-kasir | Cek kolom `profiles.role` |
| "Stok barang â€¦ tidak mencukupi." (`ST001`) | Checkout melebihi stok saat itu | Kurangi qty; stok dicek ulang di DB |
| "Barang memiliki riwayat dan tidak dapat dihapus permanen." (`23503`) | Hapus produk dengan `sale_items`/`stock_movements` | Gunakan nonaktifkan (soft delete) |
| "Kode barang sudah digunakan." | Duplikat `products.kode` | Ganti kode |
| Permission denied / RLS menolak tulis | Kebijakan/grant tidak sesuai (mis. migrasi belum penuh) | Ulangi migrasi 001â€“005 urut; jangan menambah grant lebar manual |
| Build gagal di Vercel | Error TypeScript/lint saat `next build` | Jalankan `npm run typecheck` & `npm run lint` lokal |

## 7. Backup dan Pemulihan

**Yang sudah ada:** tidak ada konfigurasi backup di repository ini.
Supabase menyediakan fitur backup/PITR sesuai paket layanan â€” status dan
retensinya **periksa di dashboard Supabase** (halaman Database â†’ Backups);
belum diverifikasi dari sisi dokumen ini.

**Rekomendasi (belum diterapkan):**

- Pastikan backup harian/PITR aktif untuk proyek production, lalu uji
  pemulihan berkala.
- Ekspor berkala manual: `pg_dump` (Supabase menyediakan kredensial/URI
  connection pooler di dashboard) disimpan di lokasi aman.
- Backup tidak menggantikan seed: untuk restore penuh dibutuhkan migrasi
  001â€“005 + data (dump) + akun Auth (akun Auth ikut terdump bila memakai
  dump penuh cluster â€” verifikasi sebelum mengandalkannya).

## 8. Checklist

**Sebelum rilis:**

- [ ] `npm run typecheck` â€” 0 error
- [ ] `npm run lint` â€” bersih
- [ ] `npm run build` â€” sukses lokal
- [ ] Perubahan DB â†’ file migrasi baru sudah diterapkan ke Supabase
      production (bila ada)
- [ ] Env Vercel (3 variabel) masih terisi & benar
- [ ] Tidak ada secret yang masuk ke source/log/dokumen
- [ ] Smoke test lokal: login admin & kasir, RBAC, operasi inti
      (barang, barang masuk, checkout)

**Setelah deployment:**

- [ ] Status deployment `READY` dan alias production menunjuk versi baru
- [ ] Buka `https://stokita-taupe.vercel.app` â†’ redirect login benar
- [ ] Login `admin` â†’ dashboard & kelola barang berfungsi
- [ ] Login `kasir` â†’ POS berfungsi; `/admin` ditolak
- [ ] Periksa log fungsi bila ada error runtime
- [ ] Konfirmasi perubahan perilaku terbaru (mis. toggle status barang)
      berfungsi di production

## 9. Catatan Operasional dan Keterbatasan

- **Tidak ada CI/CD pipeline** (GitHub Actions dll.) di repository ini â€”
  build & deploy sepenuhnya lewat prosedur manual/CLI di atas.
- **Tidak ada test suite otomatis** dalam build; quality gate = lint +
  typecheck + build.
- **Tidak ada monitoring/alerting** yang terkonfigurasi dari sisi aplikasi
  (bawaan Vercel/Supabase menurut paket masing-masing; belum diverifikasi).
- **Tidak ada otomasi migrasi** saat deploy â€” perubahan skema = tindakan
  manual eksplisit.
- **Service role key** hanya untuk `seed:accounts` dan wajib tetap di
  lingkungan server; rotasi dilakukan dari dashboard Supabase
  (Settings â†’ API) bila diperlukan.
- Dukungan submit tanpa JavaScript pada halaman `/admin/barang` diamati
  belum andal (lihat [Arsitektur â€” Temuan](ARCHITECTURE.md#8-temuan-dan-keterbatasan));
  penggunaan normal dengan browser modern tidak terpengaruh.
- Riwayat dibatasi 100 baris terbaru (belum paginasi).

Dokumen terkait: [README](../README.md),
[API dan Keamanan](API_AND_SECURITY.md),
[Database dan State](DATABASE_AND_STATE.md).
