# Panduan Pengguna STOKITA

Dokumen ini adalah panduan penggunaan aplikasi STOKITA untuk admin dan kasir:
cara masuk, menjelajahi halaman, dan menjalankan tugas harian (kelola barang,
barang masuk, monitoring stok, penjualan POS, riwayat transaksi).

- Demo live: https://stokita-taupe.vercel.app
- Detail teknis (use case, validasi, error code) ada di
  [USE_CASE_AND_FLOW.md](USE_CASE_AND_FLOW.md).

## 1. Mengenal Peran

| Peran | Area | Tugas utama |
| --- | --- | --- |
| **Admin** | `/admin` | Kelola barang, catat barang masuk, monitoring stok, lihat riwayat penjualan semua kasir |
| **Kasir** | `/kasir` | Penjualan (POS), lihat riwayat penjualan miliknya sendiri |

> 🔑 Tidak ada registrasi/publik daftar akun. Akun dibuat oleh tim teknis
> lewat `npm run seed:accounts` (default: `admin`, `kasir1`, `kasir2`).

## 2. Masuk ke Aplikasi (Login)

1. Buka https://stokita-taupe.vercel.app (atau http://localhost:3000 saat
   lokal) — Anda akan diarahkan ke halaman `/login`.
2. Isi **username** dan **password**, lalu klik tombol masuk.
3. Jika berhasil:
   - Admin → langsung ke `/admin` (Beranda admin).
   - Kasir → langsung ke `/kasir` (Beranda kasir).
4. Jika gagal, muncul pesan **"Username atau password salah."** — periksa
   kembali username/password Anda.

**Catatan:**

- Sesi tetap aktif selama Anda belum logout; halaman terproteksi tidak bisa
  dibuka tanpa sesi (otomatis dialihkan ke `/login`).
- Akses halaman yang bukan milik peran Anda akan ditolak ("akses ditolak").
- Lupa password: hubungi admin sistem/tim proyek — belum ada fitur pemulihan
  password mandiri.

## 3. Panduan Admin

Menu navigasi admin: **Beranda · Barang · Barang Masuk · Stok · Riwayat
Penjualan**.

### 3.1 Beranda (Dashboard) — `/admin`

Menampilkan ringkasan hari ini (zona waktu **Asia/Jakarta**):

- Jumlah transaksi dan total penjualan hari ini.
- Jumlah barang **menipis** dan **habis** (untuk peringatan restock).

### 3.2 Kelola Barang — `/admin/barang`

Daftar semua barang (termasuk yang nonaktif) dengan pencarian kata kunci
(kode/nama).

| Aksi | Langkah singkat | Keterangan |
| --- | --- | --- |
| **Tambah barang** | Klik `Tambah` → isi kode, nama, harga, stok awal → simpan | Kode barang wajib unik; muncul banner sukses setelah tersimpan |
| **Ubah barang** | Klik barang → `Edit` → ubah kode/nama/harga → simpan | **Stok tidak diubah lewat form edit** — stok hanya lewat Barang Masuk |
| **Nonaktifkan** | Klik tombol status pada barang aktif → konfirmasi dialog | Barang hilang dari POS & barang masuk; riwayat tetap ada |
| **Aktifkan kembali** | Klik tombol status pada barang nonaktif → konfirmasi | Barang kembali muncul di POS |
| **Hapus** | Klik hapus → konfirmasi dialog | Ditolak jika barang punya riwayat penjualan/mutasi — saran: nonaktifkan saja |

**Umpan balik:** aksi sukses menampilkan banner (`?ok=created` /
`?ok=updated`); gagal validasi menampilkan pesan per field tanpa ada data
yang berubah.

### 3.3 Barang Masuk — `/admin/barang-masuk`

Mencatat penambahan stok dari pemasok/stock opname.

1. Pilih **barang aktif**, isi **qty** (> 0), isi referensi & catatan
   (opsional).
2. Klik simpan → konfirmasi dialog.
3. Sukses → ditampilkan stok **sebelum → sesudah**; mutasi `IN` tercatat.
4. Gagal (qty tidak valid / barang tidak ada atau nonaktif) → pesan jelas,
   tanpa perubahan data.

Riwayat penerimaan: `/admin/barang-masuk/riwayat` (100 mutasi `IN` terbaru,
termasuk nama barang dan pencatat).

### 3.4 Monitoring Stok — `/admin/stok`

- Daftar barang **aktif** dengan `stok <= stok_min`, dikelompokkan status
  **Habis** (stok 0) dan **Menipis** — dasar keputusan restock via Barang
  Masuk.
- `/admin/stok/riwayat` — 100 pergerakan stok terbaru (`IN`/`OUT`) untuk
  penelusuran selisih.

### 3.5 Riwayat Penjualan — `/admin/penjualan/riwayat`

1. (Opsional) isi **filter tanggal** — jika dipakai, tanggal mulai & selesai
   harus keduanya diisi dan tidak terbalik (zona Asia/Jakarta).
2. Daftar menampilkan maks 100 transaksi terbaru **seluruh kasir** (dengan
   nama kasir).
3. Klik transaksi untuk **detail**: rincian item, metode bayar, dibayar,
   kembalian, dan kasir.

## 4. Panduan Kasir

Menu navigasi kasir: **Beranda · Penjualan · Riwayat**.

### 4.1 Penjualan (POS) — `/kasir/penjualan`

1. **Cari barang** aktif (hanya barang aktif yang muncul), lalu klik untuk
   memasukkan ke keranjang (qty awal 1; klik lagi untuk menambah).
2. **Atur qty** pada keranjang — dibatasi stok yang tersedia; item bisa
   dihapus dari keranjang.
3. **Pilih metode bayar:**
   - `TUNAI` → isi nominal bayar (default = total). Kembalian dihitung
     otomatis; nominal kurang dari total akan ditolak.
   - `NON_TUNAI` → bayar otomatis = total, kembalian Rp 0.
4. Klik **Bayar & selesaikan** → cek ringkasan (item, total, metode,
   dibayar, kembalian) pada dialog konfirmasi → konfirmasi.
5. **Sukses** → struk digital tampil dengan nomor transaksi; klik
   **Transaksi baru** untuk memulai penjualan berikutnya.
6. **Gagal** (stok kurang, barang nonaktif, bayar kurang, sesi habis, dll.)
   → pesan jelas dan **tidak ada data yang berubah** — perbaiki lalu ulangi.

> ⚠️ Stok berkurang otomatis dan tercatat sebagai mutasi `OUT` begitu
> transaksi berhasil. Jika stok tidak mencukupi saat checkout, transaksi
> dibatalkan seluruhnya.

### 4.2 Beranda Kasir — `/kasir`

Ringkasan penjualan milik Anda sendiri (hari ini).

### 4.3 Riwayat — `/kasir/penjualan/riwayat`

- Menampilkan **hanya transaksi milik Anda** (maks 100 terbaru), dengan
  filter tanggal opsional.
- Klik transaksi untuk melihat detail item & pembayaran.

## 5. Logout

1. Klik **Logout** di header (tersedia di halaman admin & kasir).
2. Konfirmasi dialog → sesi berakhir → diarahkan ke `/login`.

## 6. Pesan & Masalah Umum

| Pesan / Gejala | Penyebab | Yang harus dilakukan |
| --- | --- | --- |
| "Username atau password salah." | Kredensial salah | Periksa username & password; hubungi admin sistem bila lupa |
| "Akun tidak memiliki profil yang valid…" | Akun tanpa profil role | Hubungi admin sistem |
| Dialihkan ke `/login` berulang kali | Sesi habis/kedaluwarsa | Login ulang |
| "Akses ditolak" | Bukan peran yang berhak | Gunakan area peran Anda (`/admin` atau `/kasir`) |
| "Kode barang sudah digunakan." | Kode duplikat | Gunakan kode lain |
| "Barang memiliki riwayat…" | Hapus barang ber-riwayat | Nonaktifkan barang, jangan hapus |
| "Stok barang X tidak mencukupi." | Qty melebihi stok saat checkout | Kurangi qty atau catat Barang Masuk dulu (admin) |
| "Nominal bayar kurang dari total." | Bayar TUNAI < total | Isi nominal cukup atau pilih NON_TUNAI |
| Filter tanggal ditolak | Tanggal tidak lengkap/terbalik | Isi tanggal mulai **dan** selesai dengan benar |
| Barang tidak muncul di POS | Barang nonaktif | Admin mengaktifkan kembali di `/admin/barang` |

## 7. Batasan yang Perlu Diketahui

- Tanpa registrasi publik & pemulihan password mandiri.
- Riwayat menampilkan maks **100** entri terbaru (belum ada paginasi).
- Belum ada fitur diskon, pajak, multi-cabang, dan pembukuan keuangan.
- Edit data barang tidak mencatat audit trail; pergerakan stok tercatat
  lengkap (mutasi IN/OUT).
- Semua ringkasan harian memakai zona waktu **Asia/Jakarta**.

## 8. Tautan Terkait

- [USE_CASE_AND_FLOW.md](USE_CASE_AND_FLOW.md) — use case & alur bisnis
- [API_AND_SECURITY.md](API_AND_SECURITY.md) — Server Action, RPC, keamanan
- [DATABASE_AND_STATE.md](DATABASE_AND_STATE.md) — skema & aturan database
- UML: [use case](uml/use-case.md) · [sequence penjualan](uml/sequence-penjualan.md) ·
  [activity penjualan](uml/activity-penjualan.md)
