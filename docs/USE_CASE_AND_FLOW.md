# Use Case dan Alur Sistem STOKITA

Dokumen ini merangkum kebutuhan fungsional STOKITA berdasarkan implementasi
kode: aktor, hak akses, use case, alur bisnis utama, validasi, dan kondisi
gagal. Untuk diagram detail lihat [docs/uml/](uml/use-case.md).

## 1. Tujuan dan Ruang Lingkup

**Tujuan:** mengelola stok barang UMKM (data barang, barang masuk,
monitoring) dan melakukan transaksi penjualan kasir dengan data yang
konsisten, terotorisasi per role, dan tercatat riwayatnya.

**Ruang lingkup (dalam):** login/logout, kelola barang (CRUD + status
aktif/nonaktif), barang masuk, monitoring stok & riwayat mutasi, penjualan
POS (TUNAI/NON_TUNAI), riwayat penjualan (admin & kasir), dashboard admin.

**Di luar ruang lingkup:** registrasi publik, lupa password, multi-cabang/
multi-gudang, diskon/pajak, pembelian ke supplier (hanya barang masuk
pencatatan), modul keuangan/pembukuan, aplikasi mobile native, paginasi
riwayat (belum ada).

## 2. Aktor dan Hak Akses

| Aktor | Definisi | Login | Area | Hak utama (dari kode) |
| --- | --- | --- | --- | --- |
| **Admin** (`role = 'admin'`) | Pengelola persediaan (admin gudang) | Ya (`admin` dll. via seed) | `/admin` | Dashboard, kelola barang (tambah/edit/aktif/hapus), barang masuk, monitoring stok, riwayat mutasi stok, riwayat penjualan **seluruh** kasir |
| **Kasir** (`role = 'kasir'`) | Petugas penjualan | Ya (`kasir1`, `kasir2`) | `/kasir` | Penjualan POS, riwayat **miliknya sendiri** |
| **Pengguna tanpa sesi** | â€” | Tidak | â€” | Hanya halaman `/login` (dan redirect dari `/`, `/admin`, `/kasir`) |

Hak akses ditegakkan berlapis: proxy (sesi) â†’ layout (role per halaman) â†’
Server Action/service (`requireRole`) â†’ RLS + fungsi DB. Detail:
[API dan Keamanan](API_AND_SECURITY.md).

## 3. Use Case per Aktor

### 3.1 Admin

| ID | Use case | Prasyarat | Hasil akhir |
| --- | --- | --- | --- |
| UC-A1 | Login sebagai admin | Akun admin ada | Sesin aktif, diarahkan ke `/admin` |
| UC-A2 | Melihat dashboard | Sesi admin | Ringkasan penjualan hari ini (jumlah & total), jumlah barang menipis/habis |
| UC-A3 | Melihat & mencari barang | Sesi admin | Daftar semua barang (termasuk nonaktif) + filter kata kunci kode/nama |
| UC-A4 | Menambah barang | Sesi admin, input valid, kode unik | Baris `products` baru dengan stok awal; banner sukses `?ok=created` |
| UC-A5 | Mengubah data barang | Sesi admin, input valid | Atribut (kode/nama/harga) terbarui; stok tidak lewat form edit |
| UC-A6 | Menonaktifkan barang aktif (dengan konfirmasi) | Sesi admin, barang aktif | `aktif = false`; barang hilang dari POS & barang masuk; riwayat tetap |
| UC-A7 | Mengaktifkan kembali barang nonaktif (dengan konfirmasi) | Sesi admin, barang nonaktif | `aktif = true`; kembali muncul di POS |
| UC-A8 | Menghapus barang permanen (dengan konfirmasi) | Sesi admin, barang tanpa riwayat | Baris terhapus; **bila punya riwayat â†’ ditolak** dengan saran menonaktifkan |
| UC-A9 | Mencatat barang masuk | Sesi admin, barang aktif, qty > 0 | `stok` bertambah + mutasi `IN` tercatat (atomik via `add_stock_in`) |
| UC-A10 | Melihat riwayat barang masuk | Sesi admin | 100 mutasi IN terbaru (barang + pembuat) |
| UC-A11 | Monitoring stok menipis/habis | Sesi admin | Daftar barang aktif `stok <= stok_min` (Habis/Menipis) |
| UC-A12 | Melihat riwayat pergerakan stok | Sesi admin | 100 mutasi IN/OUT terbaru |
| UC-A13 | Melihat riwayat penjualan (semua kasir) Â± filter tanggal | Sesi admin, filter lengkap bila dipakai | Daftar transaksi (maks 100, terbaru) milik semua kasir |
| UC-A14 | Melihat detail transaksi | Sesi admin | Rincian item, bayar, kembalian, kasir |
| UC-A15 | Logout (dengan konfirmasi) | Sesi aktif | Sesi berakhir â†’ `/login` |

### 3.2 Kasir

| ID | Use case | Prasyarat | Hasil akhir |
| --- | --- | --- | --- |
| UC-K1 | Login sebagai kasir | Akun kasir ada | Sesi aktif, diarahkan ke `/kasir` |
| UC-K2 | Mencari & memilih barang aktif | Sesi kasir, barang `aktif = true` | Barang masuk keranjang (qty 1, bertambah bila dipilih lagi) |
| UC-K3 | Mengubah/menghapus item keranjang | Keranjang tidak kosong | Qty/item terkini (validasi qty vs stok tampil) |
| UC-K4 | Memilih metode pembayaran & nominal | Keranjang terisi | TUNAI: bayar diisi (default total); NON_TUNAI: bayar = total, kembalian 0 |
| UC-K5 | Konfirmasi & menyelesaikan penjualan | Keranjang valid, metode terpilih, bayar cukup | Transaksi tersimpan atomik (nota + item + stok turun + mutasi OUT) â†’ **struk ditampilkan** |
| UC-K6 | Memulai transaksi baru | Struk transaksi sebelumnya tampil | Sesi POS direset (keranjang kosong) |
| UC-K7 | Melihat riwayat penjualan sendiri Â± filter | Sesi kasir | Maks 100 transaksi miliknya sendiri |
| UC-K8 | Melihat detail transaksi sendiri | Sesi kasir, transaksi miliknya | Rincian item & pembayaran |
| UC-K9 | Logout (dengan konfirmasi) | Sesi aktif | Sesi berakhir â†’ `/login` |

### 3.3 Hubungan antar use case

- UC-A3 **<<include>>** oleh UC-A4â€“UC-A8 (semua bermula dari daftar barang).
- UC-A6 adalah **alternatif aman** dari UC-A8 saat barang punya riwayat
  (UC-A8 gagal â†’ saran melakukan UC-A6).
- UC-K2â€“UC-K4 adalah prasyarat UC-K5; UC-K5 **<<extend>>** dengan tampilan
  struk â†’ UC-K6.
- Login (UC-A1/UC-K1) prasyarat seluruh use case dalam area terproteksi.

## 4. Alur Bisnis Utama

### 4.1 Login dan Logout

1. Pengguna membuka `/login` (atau diarahkan dari rute terproteksi dengan
   `?next=`).
2. Form â†’ Server Action `login` â†’ validasi input â†’ petakan username ke
   email internal â†’ Supabase Auth `signInWithPassword`.
3. **Gagal** â†’ pesan umum "Username atau password salah." (form tetap).
4. **Sukses** â†’ baca `profiles.role` â†’ redirect ke `homePath` role, atau
   `next` bila masih dalam prefix role tersebut (mencegah open redirect).
5. Logout â†’ konfirmasi â†’ `signOut` â†’ redirect `/login`.

Detail: [uml/sequence-login.md](uml/sequence-login.md).

### 4.2 Pengelolaan Produk (admin)

1. Buka `/admin/barang` â†’ daftar + pencarian (`?q=`).
2. **Tambah** â†’ form valid â†’ INSERT (stok awal) â†’ `?ok=created`.
   Gagal validasi â†’ error per field; kode duplikat â†’ "Kode barang sudah
   digunakan."
3. **Edit** â†’ hanya kode/nama/harga (stok tidak lewat form) â†’ `?ok=updated`.
4. **Aktif/nonaktif** â†’ dialog konfirmasi (menyebut nama + kode + dampak) â†’
   UPDATE `aktif` â†’ daftar dimuat ulang â†’ badge & tombol berubah.
   Gagal â†’ status lama tetap + pesan error.
5. **Hapus** â†’ dialog konfirmasi â†’ DELETE; bila punya riwayat penjualan/
   mutasi â†’ ditolak FK + pesan "Barang memiliki riwayatâ€¦", saran
   menonaktifkan. Riwayat tidak pernah ikut terhapus.

### 4.3 Barang Masuk (admin)

1. `/admin/barang-masuk` â†’ pilih barang **aktif**, isi qty (> 0),
   referensi & catatan (opsional) â†’ dialog konfirmasi.
2. Server: validasi â†’ `requireRole(admin)` â†’ RPC `add_stock_in`
   (kunci baris, cek aktif, update stok, insert mutasi IN â€” atomik).
3. Sukses â†’ tampil stok sebelum â†’ sesudah; riwayat IN pada halaman riwayat.
4. Gagal (`IN001` qty, `IN002` barang tidak ada/nonaktif) â†’ pesan tanpa
   perubahan data.

### 4.4 Penjualan oleh Kasir (POS)

1. `/kasir/penjualan` memuat barang `aktif = true`.
2. Cari & klik barang â†’ keranjang; atur qty (dibatasi stok tampil);
   pilih TUNAI/NON_TUNAI; nominal tunai divalidasi (`bayar >= total`).
3. "Bayar & selesaikan" â†’ dialog konfirmasi berisi ringkasan item, total,
   metode, dibayar, kembalian â†’ submit.
4. Server (`checkoutAction` â†’ `checkoutSale` â†’ RPC `checkout_sale`):
   validasi ulang sesi kasir, item, metode, qty; kunci baris produk urut;
   cek barang aktif & stok; hitung total di DB; bayar/kembalian sesuai
   aturan metode; tulis nota + item + kurangi stok + mutasi OUT **atomik**.
5. Sukses â†’ struk (`SaleReceipt`) dengan no_transaksi â†’ "Transaksi baru".
6. Gagal (`CT001` keranjang, `CT002` qty, `CT003` barang, `PY001â€“003`
   bayar, `ST001` stok kurang, `AU001/AC002` sesi/role) â†’ pesan jelas,
   **tidak ada data berubah** (rollback penuh).

Diagram sequence: [uml/sequence-penjualan.md](uml/sequence-penjualan.md);
aktivitas & percabangan gagal: [uml/activity-penjualan.md](uml/activity-penjualan.md).

### 4.5 Riwayat Transaksi

- Admin: `/admin/penjualan/riwayat` (semua kasir, join nama kasir) + detail
  `[id]` â€” filter tanggal wajib dua-duanya bila dipakai, divalidasi server
  (zona Asia/Jakarta).
- Kasir: `/kasir/penjualan/riwayat` (hanya miliknya; query `eq kasir_id` +
  RLS) + detail miliknya.
- Keduanya: maks 100 entri terbaru, tanpa paginasi (keterbatasan).

## 5. Validasi dan Kondisi Gagal

| Kode | Kondisi | Terjadi di | Respons sistem |
| --- | --- | --- | --- |
| â€” | Username/password kosong, username tidak sesuai pola | Form login (server) | Pesan per field; tidak memanggil Auth |
| `AUTH_INVALID` | Kredensial salah | Supabase Auth (4xx) | Pesan umum "Username atau password salah." |
| `AUTH_PROFILE_INVALID` | Profil role/username tidak cocok | Login | Sign out + pesan "Akun tidak memiliki profil yang validâ€¦" |
| `REQUIRED/NEGATIVE/INVALID_INTEGER` | Form barang tidak valid | Validasi server | Error terikat field, tidak ada tulis |
| `PRODUCT_KODE_DUPLICATE` | Kode barang sudah dipakai | DB `23505` | "Kode barang sudah digunakan." |
| `FK_HISTORY` (`23503`) | Hapus barang ber-riwayat | DB FK restrict | Pesan riwayat + saran nonaktifkan; data utuh |
| `IN001` / `IN002` | Qty â‰¤ 0 / barang tak ditemukan-nonaktif | RPC `add_stock_in` | Pesan; tanpa perubahan |
| `CT001` | Keranjang kosong | RPC `checkout_sale` | Pesan; tanpa transaksi |
| `CT002` | Qty bukan bilangan bulat > 0 | service + RPC | Pesan; tanpa transaksi |
| `CT003` | Barang tidak ada / nonaktif / id tidak valid | RPC (setelah lock) | Pesan; transaksi batal total |
| `ST001` | Stok kurang | RPC (setelah lock, cek ulang) | Pesan "Stok barang X tidak mencukupi."; rollback |
| `PY001` | Metode tidak dipilih/tidak valid | service + RPC | Pesan |
| `PY002` / `PY003` | Bayar tidak valid / kurang dari total | util pembayaran + RPC | Pesan; tanpa transaksi |
| `AU001` | Sesi tidak valid/kedaluwarsa | semua lapis | Pesan login ulang; proxy redirect `/login?next=` |
| `AC001`/`AC002`/`PAGE_ACCESS` | Role salah untuk operasi/halaman | service/RPC/layout/layout | Pesan akses ditolak (default-deny) |
| `DATE_FILTER_INCOMPLETE`/`DATE_RANGE_INVALID` | Filter tanggal tidak lengkap/terbalik | service riwayat | Pesan; tanpa hasil filter |
| `OVERFLOW` (`22003`) | Melebihi batas integer | DB | "Nilai melebihi batas yang diizinkan."; transaksi batal |

## 6. Kebutuhan Fungsional Terverifikasi dan Batasan

**Terverifikasi dari kode:**

- Pembagian tegas admin/kasir di 4 lapis (proxy, layout, service, RLS/DB).
- Perubahan stok **hanya** melalui fungsi transaksional; kolom `stok`
  tidak dapat diubah lewat UPDATE biasa.
- Barang nonaktif tidak tersedia untuk penjualan baru (filter daftar POS +
  pengecekan `aktif` di RPC) dan tidak bisa dicatat barang masuk.
- Riwayat penjualan & mutasi stok dipertahankan (FK RESTRICT/CASCADE yang
  sesuai; tidak ada aksi hapus riwayat di aplikasi).
- Nilai uang (total/bayar/kembalian) dihitung & divalidasi di database.
- Konfirmasi hanya untuk aksi mengubah data (hapus/nonaktifkan/checkout/
  logout/simpan form) â€” pencarian, filter, dan navigasi tanpa konfirmasi.

**Batasan yang diketahui:**

- Tanpa registrasi publik & pemulihan password mandiri (peran admin sistem).
- Riwayat maks 100 baris, tanpa paginasi/pencarian lanjutan.
- Tanpa test suite otomatis, CI/CD, dan monitoring khusus (lihat
  [Deployment dan Operasional](DEPLOYMENT_AND_OPERATIONS.md)).
- Tanpa audit trail perubahan data barang (mutasi stok tercatat; edit/aktif
  tidak).
- Dukungan no-JS pada submit form halaman barang belum andal (lihat
  [Arsitektur â€” Temuan](ARCHITECTURE.md#8-temuan-dan-keterbatasan)).

## 7. Tautan UML Lanjutan

- [Use Case (diagram)](uml/use-case.md)
- [Sequence Login](uml/sequence-login.md)
- [Sequence Penjualan](uml/sequence-penjualan.md)
- [Activity Penjualan](uml/activity-penjualan.md)
- [Arsitektur Sistem](uml/arsitektur-sistem.md)
