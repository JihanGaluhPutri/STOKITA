# Implementation Plan Stokita (Dokumen Kerja)

Dokumen kerja ini hanya mencatat pemetaan, dependensi, dan status pengerjaan.
Sumber kebenaran tetap `product-backlog.md` dan `technical-backlog.md`.
Dokumen ini tidak menggantikan backlog dan tidak menambah ruang lingkup fitur.

Status dokumen: Part 0 (analisis) + pembaruan status setelah Part 1 (TB-01–TB-09), Part 2 (TB-10–TB-11), Part 3 (TB-12–TB-15), Part 4 (TB-16–TB-19), Part 5 (TB-20–TB-23), dan Part 6 (TB-24–TB-30) — 14 Oktober 2026.

---

## 1. Sumber kebenaran

| Prioritas | Sumber |
| --- | --- |
| 1 | Instruksi terbaru pengguna (Master Instruction + perintah part) |
| 2 | `product-backlog.md` (26 item PB) |
| 3 | `technical-backlog.md` (30 task TB) dan dependensinya |
| 4 | Dokumentasi resmi Next.js, Supabase, Vercel |
| 5 | Keputusan implementasi paling sederhana, aman, konsisten cakupan |

Kedua file backlog terbaca utuh: `product-backlog.md` (541 baris, 26 item PB),
`technical-backlog.md` (750 baris, 30 task TB). Tidak ada file backlog lain di workspace.

## 2. Kondisi repository dan lingkungan (hasil pemeriksaan)

Kondisi awal (Part 0): hanya `product-backlog.md`, `technical-backlog.md`, dan `docs/`;
belum ada `package.json`, konfigurasi Next.js/Supabase, migrasi, maupun kode sumber.

Kondisi setelah Part 1 (TB-01–TB-09):

| Item | Kondisi |
| --- | --- |
| `package.json` + lockfile | Ada — Next.js 16.4.0, React 19.3.0, TypeScript 5.9.3, @supabase/ssr 0.12.7, @supabase/supabase-js 2.117.3 |
| Konfigurasi Next.js / TypeScript / ESLint | Ada (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`) |
| Supabase client | Ada: `src/lib/supabase/server.ts` (cookie SSR), `src/lib/supabase/client.ts` (browser), `src/lib/env.ts` (validasi), `.env.example` |
| Migrasi SQL | Ada: `supabase/migrations/001`–`005` (tabel, constraint, RLS, `add_stock_in`, `checkout_sale`) |
| Kode sumber | Ada: `src/app`, `src/lib/{business,validation,supabase,auth}`, `src/services`, `src/types` |
| Git | Repo aktif dengan root `C:\Users\HP`, branch `main`, belum ada commit (tanpa perubahan git) |
| Node.js / npm / git | v22.14.0 / 11.3.0 / 2.47.0.windows.2 |

Catatan: repo git root berada di direktori home (`C:\Users\HP`), bukan di folder STOKITA.
Keputusan (mis. `git init` khusus STOKITA atau repo terpisah) menjadi kewenangan pengguna;
tidak ada perubahan git yang dilakukan pada part mana pun.

## 3. Petaan Product Backlog → Technical Backlog

### Epic E1 — Auth & Role

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-AUTH-01 | Login username | TB-01, TB-02, TB-10 | fondasi | Username dipetakan ke identitas internal; kredensial divalidasi Supabase Auth; sesi via cookie aman; pesan "Username atau password salah." dan kolom wajib diisi; pengguna tanpa sesi dialihkan ke login |
| PB-AUTH-02 | Logout & sesi | TB-10, TB-11 | PB-AUTH-01 | Logout mengakhiri sesi dan mengarahkan ke login; sesi lama/berakhir ditolak; kegagalan logout menampilkan error, bukan sukses palsu |
| PB-AUTH-03 | Akses per role | TB-06, TB-11 | PB-AUTH-01 | Pemetaan role dari `profiles`; middleware proteksi request; pemeriksaan role di Server Action/service; pesan "Anda tidak memiliki akses ke halaman ini."; role tidak valid = ditolak default |
| PB-AUTH-04 | Akun awal tanpa registrasi publik | TB-04, TB-26 | TB-04, TB-10, TB-11, TB-25 | Seed 1 admin + 2 kasir terhubung `profiles`; tanpa halaman register; profil tidak valid = akses ditolak; kegagalan seed menghasilkan error jelas |

### Epic E2 — Barang

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-BRG-01 | Daftar barang | TB-04, TB-06, TB-11, TB-12 | E1 | Menampilkan kode, nama, harga beli/jual, stok, stok min, status aktif; stok 0 = "Habis"; stok ≤ stok min = "Menipis"; kasir ditolak; kegagalan load ≠ daftar kosong |
| PB-BRG-02 | Tambah barang | TB-05, TB-11, TB-12, TB-13 | PB-BRG-01 | Kode unik ("Kode barang sudah digunakan."); harga tidak negatif; stok awal/min bilangan bulat ≥ 0; validasi server; non-admin ditolak |
| PB-BRG-03 | Edit barang | TB-05, TB-13 | PB-BRG-02 | Ubah nama/harga valid; tolak kode duplikat; tolak harga negatif; stok tidak bisa diubah lewat form edit; non-admin ditolak; kegagalan = pesan gagal |
| PB-BRG-04 | Nonaktifkan barang | TB-05, TB-13 | PB-BRG-03 | `aktif = false` tanpa hapus permanen; barang nonaktif tidak bisa dipilih kasir; hapus permanen ber-riwayat ditolak ("Barang memiliki riwayat dan tidak dapat dihapus permanen."); non-admin ditolak |

### Epic E3 — Barang Masuk

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-BM-01 | Catat barang masuk | TB-07, TB-09, TB-14 | TB-04..TB-06, E1, E2 | Qty bilangan bulat > 0 (pesan "Jumlah barang masuk harus berupa bilangan bulat lebih dari 0."); barang harus ada & aktif; non-admin ditolak ("Anda tidak memiliki akses untuk mencatat barang masuk."); stok + mutasi IN atomik; gagal = rollback; overflow stok ditolak |
| PB-BM-02 | Riwayat barang masuk | TB-15 | PB-BM-01 | Menampilkan barang, tipe, qty, referensi, catatan, pembuat, tanggal; transaksi gagal tidak meninggalkan mutasi; non-admin ditolak; gagal load = pesan error |

### Epic E4 — Penjualan

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-JUAL-01 | Cari & pilih barang | TB-12, TB-16 | E1, E2 | Hanya barang aktif; pencarian kode/nama; stok 0 tak bisa ditambahkan; nonaktif tak tersedia; gagal load = error |
| PB-JUAL-02 | Keranjang & kuantitas | TB-03, TB-16 | PB-JUAL-01 | Qty awal 1; subtotal/total dihitung fungsi bisnis; tolak qty ≤ 0 ("Qty harus berupa bilangan bulat lebih dari 0."); stok final dicek server/database |
| PB-JUAL-03 | Total transaksi | TB-03, TB-17 | PB-JUAL-02 | subtotal = harga × qty; total = Σ subtotal; keranjang kosong ditolak ("Keranjang masih kosong."); server mengambil harga terkini; angka invalid ditolak |
| PB-JUAL-04 | Pembayaran tunai | TB-03, TB-17 | PB-JUAL-03 | bayar = total → kembalian 0; bayar > total → kembalian = bayar − total; bayar < total ditolak ("Uang dibayar kurang dari total transaksi."); metode wajib dipilih ("Pilih metode pembayaran terlebih dahulu."); simpan TUNAI/bayar/kembalian |
| PB-JUAL-05 | Pembayaran non-tunai | TB-03, TB-08, TB-17 | PB-JUAL-04 | bayar otomatis = total, kembalian 0; tanpa data bank/gateway; server memaksa aturan non-tunai; kegagalan = tanpa penyimpanan parsial |
| PB-JUAL-06 | Checkout atomik | TB-08, TB-09, TB-18 | PB-JUAL-05 | Simpan sales + sale_items + kurangi stok + mutasi OUT atomik; satu item gagal = seluruh batal; `FOR UPDATE` mencegah stok negatif; otorisasi server; hasil berisi no. transaksi untuk struk; error bisnis jelas tanpa bocor detail DB |
| PB-JUAL-07 | Struk | TB-19 | PB-JUAL-06 | Struk: no. transaksi, tanggal, rincian, qty, harga, subtotal, total, metode, bayar, kembalian; data dari hasil transaksi tersimpan; checkout gagal ≠ struk; akses ditolak bila tak berhak |

### Epic E5 — Integrasi Stok

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-STOK-01 | Konsistensi stok | TB-06, TB-07, TB-08 | E3, E4 | Stok hanya via `add_stock_in`/`checkout_sale`; atomik; jalur lain ditolak; row locking cegah stok negatif; riwayat mutasi cocok |
| PB-STOK-02 | Monitoring menipis/habis | TB-21 | PB-STOK-01, PB-BRG-01 | stok 0 = "Habis"; 0 < stok ≤ min = "Menipis"; status dari nilai terkini; non-admin ditolak; gagal load = pesan error |
| PB-STOK-03 | Ringkasan dashboard | TB-20 | PB-STOK-02 | Jumlah barang menipis (termasuk habis dapat dibedakan); total penjualan hari ini (0 bila kosong); hanya admin; gagal load = pesan error |

### Epic E6 — Riwayat

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-RWY-01 | Riwayat mutasi stok | TB-23 | PB-BM-01, PB-JUAL-06 | Tampilkan IN/OUT + referensi + pembuat; transaksi batal tak meninggalkan mutasi; admin only; gagal load = error |
| PB-RWY-02 | Riwayat penjualan per role | TB-22 | PB-JUAL-06 | Admin lihat semua kasir; kasir hanya miliknya (dibatasi di query/DB, bukan UI); detail sesuai hak akses; akses ilegal ditolak |
| PB-RWY-03 | Filter tanggal | TB-22 | PB-RWY-02 | Rentang valid (awal ≤ akhir; pesan "Tanggal akhir tidak boleh lebih awal dari tanggal awal."); validasi diulang di server; hasil kosong ≠ error; pembatasan role tetap berlaku |

### Epic E7 — Setup & Deployment

| PB | Judul | TB utama | Dependensi TB | DoD inti |
| --- | --- | --- | --- | --- |
| PB-DEP-01 | Konfigurasi lingkungan | TB-02, TB-24 | TB-01 | `.env.example`; client server/browser dipisah; service role hanya server; validasi nama variabel tanpa membocorkan nilai |
| PB-DEP-02 | Seed data | TB-26, TB-27, TB-28 | E1, E2, E4 | 3 akun + profil; barang bervariasi stok (0, ≤ min, > min); transaksi multi-tanggal, TUNAI & NON_TUNAI, dua kasir; idempoten; error jelas |
| PB-DEP-03 | Deploy Vercel | TB-29, TB-30 | PB-DEP-01, PB-DEP-02 | App live di URL HTTPS; env production via dashboard; migrasi terditerapkan; tanpa secret di source/log/bundle |

## 4. Dependensi Technical Backlog (30 task)

Urutan topologis sesuai backlog (TB-01 → TB-30 sudah valid sebagai urutan dependensi):

| TB | Judul | Dependensi | PB yang dilayani | Status |
| --- | --- | --- | --- | --- |
| TB-01 | Setup project Next.js | — | PB-AUTH-01, PB-DEP-01 | Selesai (Part 1) |
| TB-02 | Konfigurasi Supabase & environment | TB-01 | PB-AUTH-01, PB-DEP-01, PB-DEP-03 | Selesai (Part 1) — runtime menunggu kredensial pengguna |
| TB-03 | Service layer & validasi bisnis | TB-01 | PB-BRG-02/03, PB-BM-01, PB-JUAL-02..05, PB-RWY-03 | Selesai (Part 1) |
| TB-04 | Migrasi 5 tabel inti | TB-02 | PB-AUTH-04, PB-BRG-01..04, PB-BM-01, PB-JUAL-06, PB-RWY-01/02 | Selesai (Part 1) — diverifikasi di PostgreSQL 17 |
| TB-05 | Constraint & integritas | TB-04 | PB-BRG-02/03/04, PB-BM-01, PB-JUAL-04/05/06 | Selesai (Part 1) — diverifikasi di PostgreSQL 17 |
| TB-06 | RLS & kontrol akses DB | TB-04, TB-05 | PB-AUTH-01..03, PB-BRG-02/04, PB-BM-01, PB-JUAL-06, PB-RWY-01/02 | Selesai (Part 1) — diverifikasi di PostgreSQL 17 |
| TB-07 | Fungsi `add_stock_in` | TB-04, TB-05, TB-06 | PB-BM-01/02, PB-STOK-01/02, PB-RWY-01 | Selesai (Part 1) — skenario sukses/gagal/rollback terverifikasi |
| TB-08 | Fungsi `checkout_sale` | TB-04, TB-05, TB-06, TB-07 | PB-JUAL-01..07, PB-STOK-01, PB-RWY-01/02 | Selesai (Part 1) — atomik, `FOR UPDATE`, uji 2 sesi bersamaan terverifikasi |
| TB-09 | Service pemanggil RPC | TB-03, TB-07, TB-08 | PB-BM-01/02, PB-JUAL-02..07, PB-STOK-01 | Selesai (Part 1) |
| TB-10 | Login & logout | TB-02, TB-04 | PB-AUTH-01, PB-AUTH-02 | Selesai (Part 2) — runtime menunggu kredensial & akun Supabase |
| TB-11 | Proteksi halaman & role | TB-06, TB-10 | PB-AUTH-03, PB-AUTH-04 | Selesai (Part 2) — proxy.ts (konvensi Next 16), require-user/require-role, cek role di layout & service |
| TB-12 | Daftar/pencarian/detail barang | TB-04, TB-06, TB-11 | PB-BRG-01, PB-JUAL-01 | Selesai (Part 3) — halaman admin, pencarian kode/nama, status Habis/Menipis |
| TB-13 | Tambah/edit/nonaktif barang | TB-05, TB-11, TB-12 | PB-BRG-02, PB-BRG-03, PB-BRG-04 | Selesai (Part 3) — form tanpa stok di edit; kode unik; soft delete |
| TB-14 | Form barang masuk | TB-07, TB-09, TB-11, TB-12 | PB-BM-01 | Selesai (Part 3) — via RPC add_stock_in atomik |
| TB-15 | Riwayat barang masuk | TB-07, TB-09, TB-14 | PB-BM-02, PB-STOK-02 | Selesai (Part 3) — mutasi IN terbaru, admin only |
| TB-16 | Keranjang penjualan | TB-03, TB-11, TB-12 | PB-JUAL-01, PB-JUAL-02 | Selesai (Part 4) — pencarian aktif, qty ubah/hapus, subtotal/total via fungsi bisnis |
| TB-17 | Pembayaran tunai/non-tunai | TB-03, TB-16 | PB-JUAL-03, PB-JUAL-04 | Selesai (Part 1 logika + Part 4 form) — kembalian via calculateChange; non-tunai dipaksa bayar=total |
| TB-18 | Checkout & penyimpanan | TB-08, TB-09, TB-16, TB-17 | PB-JUAL-05 | Selesai (Part 4) — RPC checkout_sale, identitas dari sesi, anti klik ganda via state UI |
| TB-19 | Struk penjualan | TB-18 | PB-JUAL-06 | Selesai (Part 4) — dari hasil RPC, cetak browser, checkout gagal ≠ struk |
| TB-20 | Dashboard admin | TB-07, TB-08, TB-11, TB-12 | PB-STOK-01 (dan ringkasan PB-STOK-03) | Selesai (Part 5) — ringkasan menipis/habis + penjualan hari ini zona Asia/Jakarta, admin only |
| TB-21 | Monitoring stok | TB-07, TB-08, TB-12 | PB-STOK-02, PB-STOK-03 | Selesai (Part 5) — /admin/stok, status Habis/Menipis dari nilai stok terkini, admin only |
| TB-22 | Riwayat penjualan per role | TB-08, TB-11, TB-18 | PB-RWY-01, PB-RWY-02, PB-RWY-03 | Selesai (Part 5) — admin semua kasir, kasir hanya miliknya (eq kasir_id + RLS); filter tanggal inklusif zona bisnis, validasi server ulang |
| TB-23 | Riwayat pergerakan stok | TB-07, TB-08, TB-21 | PB-STOK-03, PB-RWY-03 (mutasi: PB-RWY-01) | Selesai (Part 5) — /admin/stok/riwayat IN+OUT dari stock_movements, tanpa aksi ubah, admin only |
| TB-24 | Environment & build production | TB-01, TB-02 | PB-DEP-01 | Selesai (Part 6) — .env.example final (dev vs prod + password seed dari env), validasi env jelas, build production tanpa secret di repo |
| TB-25 | Finalisasi migrasi | TB-04, TB-05, TB-06, TB-07, TB-08 | PB-DEP-01 | Selesai (Part 6) — 001–005 terverifikasi ulang berurutan di PostgreSQL 17; urutan & catatan di supabase/README.md |
| TB-26 | Akun awal | TB-10, TB-11, TB-25 | PB-DEP-02, PB-AUTH-04 | Selesai (Part 6) — scripts/create-accounts.mjs via Supabase Auth admin API + profiles, idempoten, password hanya dari env; eksekusi ke proyek Supabase nyata menunggu kredensial pengguna |
| TB-27 | Seed barang | TB-13, TB-25 | PB-DEP-02 | Selesai (Part 6) — supabase/seed/seed_products.sql idempoten (9 barang: stok 0, = min, < min, > min, 1 nonaktif); terverifikasi di PostgreSQL 17 |
| TB-28 | Seed transaksi | TB-18, TB-22, TB-23, TB-27 | PB-DEP-02 | Selesai (Part 6) — supabase/seed/seed_transactions.sql idempoten; 6 transaksi lintas hari, 2 kasir, TUNAI & NON_TUNAI; sales/sale_items/stock_movements/stok konsisten dalam satu transaksi; guard "kasir belum ada" terverifikasi |
| TB-29 | Deploy Vercel | TB-24, TB-25, TB-26, TB-27, TB-28 | PB-DEP-03 | Selesai (14 Okt 2026) — project `galuh3/stokita`, 3 env production via CLI, deploy READY; live https://stokita-taupe.vercel.app; smoke test live: login admin/kasir 303, dashboard & riwayat data nyata, kasir dibatasi akses /admin |
| TB-30 | Dokumentasi setup & operasional | TB-24, TB-25, TB-26, TB-29 | PB-DEP-01..03 | Selesai (Part 6) — README: setup lokal, env, migrasi & seed, hak akses role, deployment, zona waktu |

## 5. Status ringkas

- Selesai: seluruh 30 TB (TB-01–TB-09 Part 1; TB-10–TB-11 Part 2; TB-12–TB-15 Part 3; TB-16–TB-19 Part 4; TB-20–TB-23 Part 5; TB-24–TB-28 & TB-30 Part 6; TB-29 deployment 14 Okt 2026). Runtime fitur terverifikasi end-to-end lokal (project Supabase nyata) dan live di Vercel.
- Penutupan 26 PB menunggu verifikasi acceptance criteria per PB oleh pengguna (sumber daya & akses sudah tersedia; tidak ada hambatan teknis tersisa).

## 6. Konflik penomoran part dan rekomendasi urutan

Backlog menyediakan 6 bagian bernomor: Part 1–3 = Product Backlog (E1–E7),
Part 4–6 = Technical Backlog (TB-01–09, TB-10–23, TB-24–30).
Part 0 = analisis ini (sesuai perintah pengguna).

Konflik: fitur di Part 1–3 bergantung pada fondasi di Part 4–5, sedangkan Master
Instruction mewajibkan kerja mengikuti urutan dependensi dan part dikerjakan berurutan.

**Part 1 (sudah dieksekusi sesuai perintah pengguna):** fondasi TB-01–TB-09.

Pemetaan part untuk kelanjutan (menyesuaikan perintah pengguna berikutnya):

| Part | Isi | Status |
| --- | --- | --- |
| Part 0 | Analisis & persiapan (dokumen ini) | Selesai |
| Part 1 | Fondasi aplikasi & database: TB-01–TB-09 | Selesai |
| Part 2 | Authentication & role: TB-10 (login/logout) + TB-11 (proteksi halaman & role) | Selesai |
| Part 3 | Barang & barang masuk: TB-12–TB-15 | Selesai |
| Part 4 | Penjualan: TB-16–TB-19 (keranjang, pembayaran, checkout, struk) | Selesai |
| Part 5 | Dashboard & riwayat: TB-20–TB-23 (dashboard admin, monitoring stok, riwayat penjualan per role + filter tanggal, riwayat pergerakan stok) | Selesai |
| Part 6 | Environment, seed & dokumentasi: TB-24–TB-30 (env production, finalisasi migrasi, akun awal via Auth admin API, seed barang & transaksi, persiapan Vercel, dokumentasi) | Selesai (TB-29: persiapan selesai, eksekusi menunggu akses + persetujuan) |
| Sisa | TB-29 eksekusi deployment; penutupan PB menunggu verifikasi runtime dengan kredensial pengguna | — |

Alternatif Opsi B (part backlog harfiah tanpa menarik dependensi) ditolak karena
melanggar urutan dependensi (fitur tanpa fondasi DB/RPC).

## 7. Aturan wajib yang dipertahankan di semua part

- Stack: Next.js App Router + TypeScript + Supabase Auth/PostgreSQL/RLS + Vercel.
- 5 tabel inti: `profiles`, `products`, `sales`, `sale_items`, `stock_movements`.
- Stok hanya berubah via `add_stock_in` dan `checkout_sale` (atomik, `FOR UPDATE`).
- Tanpa registrasi publik; akun awal 1 admin + 2 kasir via seed administratif.
- Validasi di server; otorisasi di Server Action/service dan RLS, bukan hanya UI/middleware.
- Kasir hanya melihat penjualannya sendiri; admin melihat semua.
- Barang ber-riwayat tidak dihapus permanen (nonaktif); kode unik; harga ≥ 0.
- Qty dan uang: bilangan bulat/nominal valid; non-tunai: bayar = total, kembalian = 0.
- Service role key tidak boleh sampai ke browser; tanpa kredensial di source/migrasi.
- Tanpa modul luar cakupan (supplier, pelanggan, diskon, pajak, retur, gateway, multi-cabang, ekspor).
- Tanpa automated test suite/test case kecuali diminta pengguna; lint/typecheck/build boleh dijalankan bila tersedia.

## 8. Tindakan manual yang diperlukan dari pengguna

1. Menyediakan project Supabase (URL + key) untuk `.env.local` development.
2. Menetapkan 3 password awal (admin, kasir1, kasir2) lalu menjalankan
   `npm run seed:accounts` — atau memberikan kredensial agar dijalankan
   bersama pada sesi berikutnya.
3. Menerapkan migrasi 001–005 dan seed (produk & transaksi) ke database
   development Supabase sesuai `supabase/README.md`.
4. Memverifikasi runtime seluruh fitur (login, barang, barang masuk,
   penjualan, riwayat) dengan data nyata.
5. Menyediakan akun/proyek Vercel dan menyetujui secara eksplisit
   langkah deployment production (TB-29) beserta environment variables-nya.
6. (Opsional) Mengonfirmasi zona waktu bisnis Asia/Jakarta.
