**Setup Project, Skema Database, dan Fungsi PostgreSQL**

Part ini mulai mengubah Product Backlog menjadi urutan pekerjaan teknis yang bisa diberikan kepada OpenCode AI. Fokusnya adalah fondasi aplikasi dan integritas database sebelum membangun halaman login, dashboard, barang, maupun kasir.

Urutan pengerjaan wajib dipertahankan: setup project → konfigurasi Supabase → skema database → constraint dan keamanan → fungsi transaksi PostgreSQL → autentikasi dan middleware → fitur aplikasi → seed data → deployment Vercel.

**1. Standar pengerjaan teknis**

Stack yang digunakan

- Next.js App Router dengan TypeScript.

- Supabase PostgreSQL dan Supabase Auth.

- Server Actions atau server-side services untuk operasi bisnis.

- Vercel untuk deployment.

- Fungsi PostgreSQL transaksional untuk add_stock_in dan checkout_sale.

Batasan implementasi

- Tidak membuat fitur di luar Product Backlog 26 item.

- Tidak membuat unit test, Playwright, atau kode pengujian otomatis.

- Logika bisnis harus terpisah dari komponen tampilan.

- Validasi wajib dilakukan di server, bukan hanya di browser.

- Service role key tidak boleh diekspos ke browser.

- Perubahan stok tidak boleh dilakukan langsung oleh halaman atau komponen UI.

**Format prioritas**

| **Prioritas** | **Makna teknis** |
| --- | --- |
| Must | Fondasi wajib agar aplikasi aman dan berfungsi. |
| Should | Penyempurnaan penting setelah kebutuhan inti selesai. |
| Could | Peningkatan opsional dalam cakupan yang disepakati. |

Untuk menjaga cakupan, semua task fondasi dan fitur inti di bawah diprioritaskan Must. Tidak ada task Should atau Could yang sengaja ditambahkan hanya untuk memperbesar backlog.

**Epic T1 — Setup Project**

**TB-01 — Membuat project Next.js**

**TB-01 — Setup project**

Must

Task

Buat project Next.js menggunakan App Router, TypeScript, dan struktur direktori yang mendukung pemisahan presentation, business logic, dan akses data.

Referensi PB: PB-DEP-01, PB-AUTH-01.

BR terkait: BR-09.

Dependensi: Tidak ada.

Langkah untuk OpenCode AI

- Periksa direktori kerja sebelum membuat atau mengubah file.

- Jika repository sudah berisi project, pertahankan konfigurasi yang relevan dan hindari membuat project kedua.

- Jika repository kosong, inisialisasi Next.js App Router dengan TypeScript.

- Siapkan struktur awal direktori berikut:

																src/

																  app/

																  components/

																  features/

																  lib/

																    supabase/

																    auth/

																  services/

																  types/

5. Pastikan halaman awal dapat dirender dan konfigurasi TypeScript konsisten.

Output

- Project Next.js App Router.

- package.json dan lockfile.

- Konfigurasi TypeScript.

- Struktur direktori dasar.

Outcome

Pengembangan Stokita memiliki fondasi yang konsisten sehingga pekerjaan dapat dibagi per fitur tanpa mencampurkan UI dan logika bisnis.

Definition of Done

- Project menggunakan App Router dan TypeScript.

- Dependensi terpasang dengan package manager yang konsisten.

- Struktur direktori tersedia.

- Aplikasi dapat dijalankan secara lokal.

- Tidak ada fitur tambahan di luar cakupan.

**TB-02 — Menyiapkan validasi environment dan konfigurasi Supabase**

**TB-02 — Supabase configuration**

Must

Task

Siapkan konfigurasi Supabase yang membedakan akses server dan browser serta memvalidasi environment variable yang wajib tersedia.

Referensi PB: PB-DEP-01, PB-AUTH-01, PB-DEP-03.

BR terkait: BR-09.

Dependensi: TB-01.

Langkah untuk OpenCode AI

- Buat .env.example yang memuat nama variabel tanpa nilai rahasia.

- Siapkan Supabase client untuk server menggunakan mekanisme session cookie yang sesuai dengan versi Next.js dan Supabase SSR yang digunakan.

- Siapkan browser client hanya untuk operasi yang memang diperlukan dari browser.

- Siapkan server-only client berprivilege tinggi hanya jika benar-benar dibutuhkan untuk administrasi atau seed.

- Tambahkan validasi konfigurasi dengan pesan error yang menyebut nama variabel yang hilang, bukan nilainya.

- Pastikan environment variable sensitif tidak menggunakan prefiks NEXT_PUBLIC_.

- Jangan menaruh kredensial pada source code, log, atau pesan error.

Output

- src/lib/supabase/server.ts.

- src/lib/supabase/client.ts.

- Modul validasi environment.

- .env.example.

- Dokumentasi konfigurasi Supabase.

Outcome

Pengembangan lokal dan deployment menggunakan konfigurasi yang terkontrol, dengan risiko kebocoran kredensial yang lebih rendah.

Definition of Done

- Client server dan browser dipisahkan.

- Session cookie ditangani sesuai mekanisme Supabase SSR.

- Environment wajib divalidasi.

- Service role key tidak dikirim ke browser.

- Error konfigurasi tidak membocorkan nilai rahasia.

**TB-03 — Menyiapkan struktur Service Layer dan validasi bisnis**

**TB-03 — Business layer**

Must

Task

Siapkan pola Service Layer agar perhitungan dan validasi bisnis tidak bergantung pada komponen React.

Referensi PB: PB-BRG-02, PB-BRG-03, PB-BM-01, PB-JUAL-02, PB-JUAL-03, PB-JUAL-04, PB-JUAL-05, PB-RWY-03.

BR terkait: BR-04, BR-05, BR-06, BR-11, BR-13, BR-14.

Dependensi: TB-01.

Langkah untuk OpenCode AI

- Pisahkan modul validasi input dari komponen UI.

- Siapkan fungsi bisnis untuk validasi bilangan bulat positif.

- Siapkan fungsi perhitungan subtotal, total, dan kembalian.

- Siapkan fungsi validasi rentang tanggal.

- Tentukan format hasil operasi yang membedakan keberhasilan dari kegagalan.

- Tentukan pemetaan error database menjadi pesan bisnis yang jelas.

- Gunakan tipe data yang sesuai untuk nominal uang dan hindari ketergantungan pada floating-point yang tidak aman untuk perhitungan nominal.

Output

- Modul validasi bisnis.

- Modul perhitungan transaksi.

- Tipe hasil operasi dan format error.

- Struktur direktori Service Layer.

Outcome

Perubahan aturan bisnis dapat dikelola tanpa perlu mengubah tampilan, sehingga sistem lebih mudah dipelihara dan disiapkan untuk metode pengujian yang akan ditentukan dosen.

Definition of Done

- Logika bisnis tidak ditempatkan di komponen UI.

- Fungsi menerima input eksplisit dan mengembalikan hasil yang jelas.

- Error validasi dapat diterjemahkan menjadi pesan yang dapat dipahami pengguna.

- Perhitungan server menjadi acuan final transaksi.

- Tidak dibuat kode pengujian otomatis.

**Epic T2 — Skema Database**

**TB-04 — Membuat migrasi tabel inti**

**TB-04 — Database schema**

Must

Task

Buat migrasi SQL untuk lima tabel inti Stokita sesuai desain data yang telah ditetapkan.

Referensi PB: PB-AUTH-04, PB-BRG-01, PB-BRG-02, PB-BRG-03, PB-BRG-04, PB-BM-01, PB-JUAL-06, PB-RWY-01, PB-RWY-02.

BR terkait: BR-01 sampai BR-14, sesuai tabel dan aturan yang relevan.

Dependensi: TB-02.

Langkah untuk OpenCode AI

- Buat direktori migrasi database, misalnya supabase/migrations/.

- Buat migrasi untuk tabel profiles, products, sales, sale_items, dan stock_movements.

- Gunakan UUID sebagai primary key untuk tabel yang sesuai.

- Hubungkan profiles.id ke auth.users.id.

- Hubungkan sales.kasir_id ke profiles.id.

- Hubungkan sale_items.sale_id ke sales.id dan sale_items.product_id ke products.id.

- Hubungkan stock_movements.product_id ke products.id dan stock_movements.dibuat_oleh ke profiles.id.

- Tentukan tipe nominal uang, kuantitas, tanggal, dan status secara konsisten.

- Tambahkan indeks untuk kebutuhan pencarian barang, filter riwayat, dan relasi transaksi.

- Gunakan foreign key dan kebijakan penghapusan yang mempertahankan riwayat.

Output

																supabase/

																  migrations/

																    001_create_core_tables.sql

File tersebut membuat lima tabel inti beserta primary key, foreign key, kolom, indeks, dan constraint dasar.

Outcome

Data persediaan dan transaksi mempunyai struktur relasional yang konsisten sehingga riwayat tidak mudah terputus dari barang atau pengguna terkait.

Definition of Done

- Lima tabel sesuai spesifikasi tersedia.

- Relasi foreign key terdefinisi.

- products.kode memiliki constraint unik.

- products.stok tidak boleh negatif.

- Harga beli dan harga jual tidak boleh negatif.

- Tipe data nominal dan kuantitas konsisten.

- Struktur tabel tidak menambahkan modul bisnis baru.

- Migrasi dapat diterapkan pada database Supabase yang disiapkan.

**Spesifikasi kolom yang wajib dipertahankan**

| **Tabel** | **Kolom inti** |
| --- | --- |
| profiles | id, nama, username, role |
| products | id, kode, nama, harga_beli, harga_jual, stok, stok_min, aktif |
| sales | id, no_transaksi, kasir_id, total, metode_bayar, bayar, kembalian, tanggal |
| sale_items | id, sale_id, product_id, qty, harga_satuan, subtotal |
| stock_movements | id, product_id, tipe, qty, referensi, catatan, dibuat_oleh, tanggal |

Kolom teknis tambahan boleh digunakan jika memang diperlukan untuk integritas atau audit, tetapi tidak boleh memperluas cakupan fitur.

**TB-05 — Menetapkan constraint dan aturan integritas**

**TB-05 — Database constraints**

Must

Task

Tambahkan constraint database untuk menjaga validitas data meskipun ada permintaan yang melewati validasi antarmuka.

Referensi PB: PB-BRG-02, PB-BRG-03, PB-BRG-04, PB-BM-01, PB-JUAL-04, PB-JUAL-05, PB-JUAL-06.

BR terkait: BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-13, BR-14.

Dependensi: TB-04.

Langkah untuk OpenCode AI

- Batasi profiles.role ke nilai yang diperbolehkan, yaitu admin dan kasir.

- Batasi sales.metode_bayar ke TUNAI dan NON_TUNAI.

- Batasi stock_movements.tipe ke IN dan OUT.

- Pastikan stok, stok minimum, dan kuantitas transaksi tidak negatif; kuantitas transaksi dan mutasi harus positif.

- Pastikan harga beli, harga jual, total, bayar, kembalian, dan nominal relevan tidak negatif.

- Pastikan nomor transaksi unik.

- Pastikan sale_items.subtotal konsisten dengan kuantitas dan harga satuan melalui validasi atau pembentukan nilai pada jalur penulisan yang tepercaya.

- Terapkan aturan pembayaran non-tunai pada jalur transaksi: bayar = total dan kembalian = 0.

- Pastikan penghapusan barang yang mempunyai riwayat tidak dapat memutus relasi transaksi. Gunakan soft delete untuk barang tersebut.

- Jangan mengandalkan constraint saja untuk operasi multi-tabel yang memerlukan transaksi atomik.

Output

- Migrasi constraint database.

- Constraint CHECK, UNIQUE, dan foreign key yang relevan.

- Aturan perlindungan integritas relasi dan transaksi.

Outcome

Data yang tidak valid dapat ditolak sedini mungkin oleh database, sehingga konsistensi tidak bergantung hanya pada perilaku pengguna aplikasi.

Definition of Done

- Nilai role dan metode pembayaran dibatasi.

- Nilai stok dan kuantitas memenuhi aturan.

- Nomor transaksi unik.

- Data pembayaran non-tunai memenuhi ketentuan.

- Riwayat transaksi tidak terhapus karena penghapusan barang.

- Error constraint dipetakan menjadi pesan bisnis yang jelas pada service layer.

**TB-06 — Menyiapkan keamanan database dan akses tabel**

**TB-06 — Database access control**

Must

Task

Konfigurasikan Row Level Security (RLS), hak akses tabel, dan batas penggunaan fungsi database agar pengguna tidak dapat melewati aturan role melalui permintaan langsung.

Referensi PB: PB-AUTH-01, PB-AUTH-02, PB-AUTH-03, PB-BRG-02, PB-BRG-04, PB-BM-01, PB-JUAL-06, PB-RWY-01, PB-RWY-02.

BR terkait: BR-07, BR-09, BR-12.

Dependensi: TB-04, TB-05.

Langkah untuk OpenCode AI

- Aktifkan RLS pada tabel yang dapat diakses melalui API Supabase.

- Tentukan kebijakan akses yang sesuai untuk setiap tabel.

- Batasi perubahan stok langsung dari client dan jalur aplikasi yang tidak berwenang.

- Pastikan kasir hanya dapat membaca riwayat penjualannya sendiri, termasuk ketika permintaan dilakukan langsung ke API.

- Batasi perubahan data barang dan barang masuk untuk Admin Gudang.

- Batasi akses fungsi transaksi sesuai mekanisme otorisasi yang dipilih.

- Gunakan SECURITY DEFINER hanya jika dibutuhkan, dengan search_path yang aman dan pemeriksaan otorisasi eksplisit.

- Jangan memberi hak akses tabel secara luas hanya agar fitur dapat berjalan.

- Pisahkan operasi yang memakai service role dari operasi pengguna biasa. Service role tidak boleh digunakan sebagai jalan pintas untuk mengabaikan pemeriksaan role.

Output

- Migrasi kebijakan RLS.

- Kebijakan akses baca dan tulis.

- Pengaturan hak akses fungsi database.

- Dokumentasi batas akses untuk Admin Gudang dan Kasir.

Outcome

Data stok dan penjualan terlindungi bahkan ketika seseorang mencoba memanggil endpoint secara langsung tanpa mengikuti antarmuka aplikasi.

Definition of Done

- Tabel yang terekspos melalui API menerapkan RLS sesuai kebutuhan.

- Kasir tidak dapat membaca riwayat kasir lain.

- Pengguna tidak dapat mengubah stok secara langsung.

- Hak akses fungsi database dibatasi.

- Fungsi dengan hak istimewa memiliki pemeriksaan otorisasi dan konfigurasi aman.

- Tidak ada kredensial berprivilege tinggi di client.

**Epic T3 — Fungsi PostgreSQL Transaksional**

Dua fungsi inti wajib selesai sebelum implementasi fitur barang masuk dan checkout.

Prinsip utamanya: perubahan stok, pencatatan transaksi, dan pencatatan mutasi harus berhasil bersama atau dibatalkan bersama.

**TB-07 — Membuat fungsi ****add_stock_in**

**TB-07 — Atomic stock-in RPC**

Must

Task

Implementasikan fungsi PostgreSQL add_stock_in untuk menambah stok dan mencatat mutasi IN dalam satu transaksi database.

Referensi PB: PB-BM-01, PB-BM-02, PB-STOK-01, PB-STOK-02, PB-RWY-01.

BR terkait: BR-01, BR-04, BR-08, BR-09.

Dependensi: TB-04, TB-05, TB-06.

Langkah untuk OpenCode AI

- Tentukan parameter fungsi: ID barang, jumlah masuk, referensi, catatan, dan identitas pembuat sesuai desain yang dipilih.

- Jangan mempercayai identitas pembuat yang dikirim bebas oleh browser. Identitas harus diturunkan atau diverifikasi dari konteks pengguna tepercaya.

- Validasi role Admin Gudang.

- Validasi jumlah sebagai bilangan bulat positif.

- Ambil baris barang menggunakan SELECT ... FOR UPDATE.

- Pastikan barang ditemukan dan masih aktif.

- Hitung stok baru dari stok database terkini.

- Tolak penambahan jika terjadi overflow atau melampaui batas kuantitas yang ditentukan.

- Perbarui products.stok.

- Masukkan catatan mutasi IN ke stock_movements.

- Pastikan error pada salah satu operasi menyebabkan seluruh transaksi database dibatalkan.

- Kembalikan hasil yang cukup untuk menampilkan stok sebelum dan sesudah perubahan.

- Gunakan error yang dapat dipetakan ke pesan bisnis, misalnya jumlah tidak valid, barang tidak aktif, atau akses ditolak.

Output

- Fungsi PostgreSQL add_stock_in.

- Validasi role, kuantitas, dan status barang.

- Pembaruan stok yang dilindungi row locking.

- Pencatatan mutasi IN secara atomik.

- Hasil operasi yang terstruktur.

Outcome

Penambahan persediaan dapat dipertanggungjawabkan karena stok dan riwayat mutasi tidak akan berbeda akibat kegagalan parsial.

Definition of Done

- Jumlah wajib bilangan bulat positif.

- Hanya Admin Gudang yang berwenang.

- Barang harus tersedia dan aktif.

- Baris barang dikunci menggunakan FOR UPDATE.

- Stok dan mutasi IN disimpan dalam transaksi yang sama.

- Kegagalan membatalkan seluruh perubahan.

- Error diterjemahkan menjadi pesan yang jelas pada service layer.

- Tidak ada jalur alternatif yang mengubah stok secara langsung.

**TB-08 — Membuat fungsi ****checkout_sale**

**TB-08 — Atomic checkout RPC**

Must

Task

Implementasikan fungsi PostgreSQL checkout_sale untuk memvalidasi transaksi, menyimpan penjualan dan detailnya, mengurangi stok, serta mencatat mutasi OUT secara atomik.

Referensi PB: PB-JUAL-01 sampai PB-JUAL-07, PB-STOK-01, PB-RWY-01, PB-RWY-02.

BR terkait: BR-02, BR-03, BR-04, BR-05, BR-06, BR-08, BR-09, BR-12, BR-13, BR-14.

Dependensi: TB-04, TB-05, TB-06, TB-07.

Langkah untuk OpenCode AI

- Tentukan parameter input transaksi yang eksplisit: daftar barang beserta kuantitas, metode pembayaran, dan uang dibayar untuk transaksi tunai.

- Ambil identitas kasir dari konteks autentikasi yang tepercaya. Jangan menerima kasir_id arbitrer dari client.

- Validasi role Kasir dan pastikan metode pembayaran adalah TUNAI atau NON_TUNAI.

- Pastikan keranjang tidak kosong dan seluruh kuantitas merupakan bilangan bulat positif.

- Validasi setiap barang aktif dan tersedia.

- Kunci seluruh baris barang terkait menggunakan FOR UPDATE, dengan urutan penguncian yang konsisten untuk mengurangi risiko deadlock.

- Setelah penguncian, baca ulang stok dan harga jual dari database.

- Tolak checkout jika satu saja barang tidak memiliki stok cukup.

- Hitung ulang subtotal dan total di sisi database menggunakan harga yang berlaku.

- Untuk TUNAI, validasi uang dibayar tidak kurang dari total dan hitung kembalian.

- Untuk NON_TUNAI, tetapkan bayar sama dengan total dan kembalian 0; abaikan nominal yang dimanipulasi client atau tolak input yang tidak sesuai.

- Simpan sales, seluruh sale_items, pengurangan stok, dan seluruh mutasi OUT dalam transaksi yang sama.

- Pastikan nomor transaksi unik.

- Jika ada satu item atau satu operasi database gagal, batalkan seluruh checkout.

- Kembalikan nomor transaksi, rincian yang diperlukan untuk struk, total, metode pembayaran, bayar, dan kembalian.

- Tangani error dengan kode atau kategori yang stabil agar service layer dapat menampilkan pesan yang jelas tanpa mengekspos detail internal database.

Output

- Fungsi PostgreSQL checkout_sale.

- Validasi barang, kuantitas, stok, dan pembayaran.

- Penyimpanan sales dan sale_items.

- Pengurangan stok dan pencatatan OUT.

- Mekanisme row locking.

- Hasil transaksi yang siap digunakan halaman struk.

Outcome

Kasir dapat memproses transaksi tanpa menyebabkan penjualan parsial atau stok negatif, sekalipun beberapa kasir menjual barang yang sama pada waktu bersamaan.

Definition of Done

- Hanya role Kasir yang dapat menjalankan checkout.

- Identitas kasir berasal dari konteks tepercaya.

- Harga dan stok final diambil dari database.

- Seluruh barang divalidasi sebelum transaksi dinyatakan berhasil.

- Baris barang dikunci menggunakan FOR UPDATE.

- Total dihitung di sisi server/database.

- Aturan pembayaran tunai dan non-tunai diterapkan.

- sales, sale_items, perubahan stok, dan mutasi OUT atomik.

- Satu kegagalan membatalkan seluruh checkout.

- Error bisnis dapat dipahami oleh pengguna.

**TB-09 — Membuat server service untuk memanggil fungsi RPC**

**TB-09 — Transaction services**

Must

Task

Buat service server yang memanggil fungsi PostgreSQL dan menerjemahkan hasil maupun error ke format yang konsisten untuk digunakan fitur aplikasi.

Referensi PB: PB-BM-01, PB-BM-02, PB-JUAL-02 sampai PB-JUAL-07, PB-STOK-01.

BR terkait: BR-01, BR-02, BR-03, BR-04, BR-05, BR-08, BR-09, BR-13, BR-14.

Dependensi: TB-03, TB-07, TB-08.

Langkah untuk OpenCode AI

- Buat service barang masuk yang memanggil add_stock_in.

- Buat service checkout yang memanggil checkout_sale.

- Validasi bentuk input di server sebelum memanggil RPC.

- Jangan melakukan pengurangan atau penambahan stok kedua kalinya di service.

- Petakan error database yang dikenal menjadi pesan bisnis yang jelas.

- Untuk error tak terduga, tampilkan pesan umum kepada pengguna dan simpan informasi diagnostik yang aman di log server.

- Pastikan service tidak melaporkan keberhasilan jika RPC gagal.

- Pastikan service tidak mengembalikan data rahasia atau informasi internal yang tidak diperlukan browser.

Output

- src/services/stock.service.ts.

- src/services/sales.service.ts.

- Fungsi pemetaan error.

- Tipe hasil operasi untuk komponen UI dan Server Actions.

Outcome

Antarmuka cukup meminta operasi bisnis melalui service yang konsisten, sehingga logika transaksi tetap terpusat dan lebih mudah dipelihara.

Definition of Done

- Semua perubahan stok memanggil fungsi database yang sesuai.

- Tidak ada pengubahan stok langsung di service.

- Error RPC diterjemahkan menjadi pesan yang jelas.

- Identitas pengguna dan role tidak dipercaya dari input browser.

- Service hanya mengembalikan data yang diperlukan.

**Urutan dependensi yang harus diikuti OpenCode AI**

- TB-01 — Setup project Next.js

- TB-02 — Konfigurasi Supabase dan environment

- TB-03 — Service Layer dan validasi bisnis

- TB-04 — Lima tabel inti

- TB-05 — Constraint dan integritas database

- TB-06 — RLS dan kontrol akses database

- TB-07 — Fungsi transaksional add_stock_in

- TB-08 — Fungsi transaksional checkout_sale

- TB-09 — Service pemanggil RPC dan pemetaan error

**Catatan penting untuk implementasi**

Ada satu detail arsitektur yang perlu dipertahankan: fungsi PostgreSQL harus memiliki otorisasi yang benar-benar dapat dipercaya. Middleware Next.js saja tidak cukup, karena fungsi database dapat dipanggil melalui jalur lain jika hak aksesnya tidak dibatasi.

Untuk itu, OpenCode AI harus memastikan fungsi RPC memvalidasi identitas dan role, sedangkan RLS dan privilege database mencegah akses yang tidak diizinkan. Jika menggunakan SECURITY DEFINER, konfigurasi search_path, pemilik fungsi, serta hak EXECUTE wajib diperiksa secara hati-hati.

Status Part 4: Sembilan task fondasi teknis telah didefinisikan. Belum ada kode pengujian otomatis yang dibuat.

**PART 5 — TECHNICAL BACKLOG STOKITA**

**Implementasi fitur aplikasi berdasarkan Product Backlog**

Part 5 melanjutkan Technical Backlog dari TB-10 sampai TB-24. Fokusnya adalah implementasi fitur Auth & Role, Barang, Barang Masuk, Penjualan, Integrasi Stok, dan Riwayat.

Seluruh task menggunakan stack Next.js App Router + TypeScript + Supabase PostgreSQL/Auth. Tidak mencakup pembuatan kode pengujian atau test case.

**E8 — Auth ****&**** Role**

**TB-10 — Implementasi Login dan Logout**

Must

Referensi: PB-AUTH-01, PB-AUTH-02

Task: Membuat halaman login menggunakan username dan password serta fungsi logout melalui Supabase Auth.

Dependensi: TB-02, TB-04

Output:

- app/login/page.tsx

- app/actions/auth.actions.ts

- lib/services/auth.service.ts

Definition of Done (DoD):

- Username dipetakan ke identitas login internal sesuai mekanisme yang ditentukan.

- Login memvalidasi kredensial melalui Supabase Auth.

- Session dikelola dengan cookie yang aman melalui mekanisme server-side yang sesuai.

- Pesan kesalahan ditampilkan jika kredensial salah atau login gagal.

- Logout mengakhiri session dan mengarahkan pengguna ke halaman login.

- Kredensial dan secret tidak ditampilkan kepada pengguna.

Outcome: Admin dan kasir dapat masuk serta keluar dari aplikasi dengan mekanisme autentikasi yang terkelola.

**TB-11 — Implementasi Proteksi Halaman dan Role**

Must

Referensi: PB-AUTH-03, PB-AUTH-04 · BR-09

Task: Membatasi akses halaman dan tindakan server berdasarkan role admin atau kasir.

Dependensi: TB-06, TB-10

Output:

- middleware.ts atau mekanisme proteksi request yang sesuai dengan versi Next.js

- lib/auth/require-user.ts

- lib/auth/require-role.ts

DoD:

- Pengguna tanpa session diarahkan ke login.

- Admin hanya dapat mengakses fitur admin.

- Kasir hanya dapat mengakses fitur kasir.

- Pemeriksaan role dilakukan kembali pada Server Actions atau service yang membutuhkan otorisasi.

- Penolakan akses ditangani dengan respons yang jelas.

- Proteksi tidak hanya mengandalkan penyembunyian tombol atau menu di UI.

Outcome: Akses antarmuka dan operasi bisnis terlindungi sesuai role pengguna.

**E9 — Barang**

**TB-12 — Implementasi Daftar, Pencarian, dan Detail Barang**

Must

Referensi: PB-BRG-01, PB-BRG-02

Dependensi: TB-04, TB-06, TB-11

Output:

- app/admin/barang/page.tsx

- app/kasir/penjualan/page.tsx — komponen pencarian barang yang dapat digunakan ulang

- lib/services/product.service.ts

DoD:

- Daftar barang menampilkan kode, nama, harga jual, stok, dan status aktif sesuai kebutuhan masing-masing halaman.

- Pencarian barang berdasarkan kode atau nama.

- Barang tidak aktif tidak dapat dipilih untuk transaksi baru.

- Stok kosong dan stok menipis ditampilkan dengan status yang sesuai.

- Akses data mengikuti role dan kebijakan database.

- Kondisi data kosong dan kegagalan pengambilan data memiliki tampilan yang jelas.

Outcome: Admin dapat memantau barang, sedangkan kasir dapat menemukan barang yang bisa dijual.

**TB-13 — Implementasi Tambah, Edit, dan Nonaktifkan Barang**

Must

Referensi: PB-BRG-03, PB-BRG-04 · BR-06, BR-07

Dependensi: TB-05, TB-11, TB-12

Output:

- app/admin/barang/actions.ts

- app/admin/barang/components/product-form.tsx

- Penambahan fungsi terkait pada lib/services/product.service.ts

DoD:

- Admin dapat menambahkan barang dengan kode unik.

- Admin dapat mengubah data barang yang diizinkan, termasuk harga jual.

- Harga jual tidak boleh negatif.

- Validasi dijalankan di server, bukan hanya pada form.

- Form barang tidak menyediakan perubahan stok langsung.

- Barang yang sudah memiliki riwayat transaksi tidak dapat dihapus permanen melalui alur normal; barang tersebut dinonaktifkan.

- Kesalahan kode duplikat dan validasi lainnya ditampilkan dengan jelas.

Outcome: Data barang terkelola tanpa merusak integritas stok maupun riwayat transaksi.

**E10 — Barang Masuk**

**TB-14 — Implementasi Form Barang Masuk**

Must

Referensi: PB-BM-01 · BR-01, BR-04

Dependensi: TB-07, TB-09, TB-11, TB-12

Output:

- app/admin/barang-masuk/page.tsx

- app/admin/barang-masuk/actions.ts

- Komponen form barang masuk

DoD:

- Admin dapat memilih barang dan memasukkan jumlah barang masuk.

- Jumlah wajib berupa bilangan bulat lebih besar dari nol.

- Barang yang tidak valid atau tidak memenuhi aturan bisnis ditolak.

- Penyimpanan dilakukan melalui service yang memanggil RPC add_stock_in.

- UI menampilkan status berhasil atau pesan kesalahan dari server.

- Stok dan riwayat pergerakan tidak diperbarui langsung dari client.

Outcome: Penerimaan barang menambah stok melalui satu operasi database yang atomik.

**TB-15 — Implementasi Riwayat Barang Masuk**

Must

Referensi: PB-BM-02, PB-STOK-02

Dependensi: TB-07, TB-09, TB-14

Output:

- app/admin/barang-masuk/riwayat/page.tsx

- Query riwayat pada lib/services/stock.service.ts

DoD:

- Menampilkan tanggal, barang, jumlah masuk, dan informasi pencatatan yang tersedia.

- Data berasal dari catatan pergerakan stok di database.

- Riwayat dapat ditampilkan secara terurut, dengan data terbaru di atas.

- Hanya role yang berwenang yang dapat membuka halaman.

- Kondisi data kosong dan kegagalan query ditangani.

Outcome: Admin dapat menelusuri pencatatan barang masuk.

**E11 — Penjualan**

**TB-16 — Implementasi Keranjang Penjualan**

Must

Referensi: PB-JUAL-01, PB-JUAL-02 · BR-03, BR-04

Dependensi: TB-03, TB-11, TB-12

Output:

- app/kasir/penjualan/page.tsx

- app/kasir/penjualan/components/product-search.tsx

- app/kasir/penjualan/components/sale-cart.tsx

DoD:

- Kasir dapat mencari dan memilih barang aktif.

- Kasir dapat menambah, mengubah kuantitas, dan menghapus barang dari keranjang.

- Kuantitas wajib bilangan bulat lebih besar dari nol.

- Subtotal dan total dihitung menggunakan fungsi bisnis bersama.

- UI memberikan informasi jika barang tidak tersedia atau kuantitas melebihi stok yang diketahui.

- Validasi pada UI tidak menggantikan validasi stok final di database saat checkout.

Outcome: Kasir dapat menyusun transaksi dengan jumlah dan total yang terhitung konsisten.

**TB-17 — Implementasi Pembayaran Tunai dan Non-tunai**

Must

Referensi: PB-JUAL-03, PB-JUAL-04 · BR-05, BR-13, BR-14

Dependensi: TB-03, TB-16

Output:

- app/kasir/penjualan/components/payment-form.tsx

- Fungsi kalkulasi pembayaran pada service atau modul bisnis bersama

DoD:

- Kasir wajib memilih metode pembayaran sebelum checkout.

- Pembayaran tunai menerima nominal uang yang dibayarkan.

- Uang tunai kurang dari total transaksi ditolak.

- Kembalian dihitung sebagai uang dibayarkan dikurangi total.

- Untuk pembayaran non-tunai, nominal pembayaran otomatis sama dengan total dan kembalian nol.

- Metode pembayaran dan nominal divalidasi ulang di server/database.

Outcome: Data pembayaran dan kembalian konsisten dengan aturan bisnis.

**TB-18 — Implementasi Checkout dan Penyimpanan Transaksi**

Must

Referensi: PB-JUAL-05 · BR-02, BR-03, BR-08, BR-14

Dependensi: TB-08, TB-09, TB-16, TB-17

Output:

- app/kasir/penjualan/actions.ts

- Fungsi checkout pada lib/services/sales.service.ts

DoD:

- Server mengambil identitas kasir dari session tepercaya, bukan dari nilai role atau ID yang dikirim client.

- Checkout menggunakan RPC checkout_sale.

- Harga, total, dan stok akhir diverifikasi di database.

- Transaksi dan seluruh detail penjualan tersimpan secara atomik.

- Jika satu barang gagal divalidasi, seluruh checkout dibatalkan dan tidak ada stok yang berkurang.

- Setelah sukses, UI menerima nomor transaksi dan data yang diperlukan untuk struk.

- Kegagalan ditampilkan tanpa memberikan informasi internal yang sensitif.

Outcome: Penjualan tercatat dengan stok yang konsisten, tanpa transaksi parsial.

**TB-19 — Implementasi Struk Penjualan**

Must

Referensi: PB-JUAL-06

Dependensi: TB-18

Output:

- app/kasir/penjualan/components/sale-receipt.tsx

DoD:

- Struk ditampilkan setelah checkout berhasil.

- Informasi mencakup nomor transaksi, tanggal, daftar barang, kuantitas, harga, subtotal, total, metode pembayaran, uang dibayarkan, dan kembalian sesuai jenis pembayaran.

- Data struk bersumber dari hasil transaksi yang berhasil, bukan perhitungan ulang yang tidak terverifikasi di client.

- Struk dapat dilihat di layar dan menggunakan fasilitas cetak browser bila diperlukan.

- Checkout yang gagal tidak menghasilkan struk transaksi sukses.

Outcome: Kasir dapat memeriksa dan mencetak bukti transaksi.

**E12 — Integrasi Stok dan Dashboard**

**TB-20 — Implementasi Dashboard Admin**

Must

Referensi: PB-STOK-01 · BR-10

Dependensi: TB-07, TB-08, TB-11, TB-12

Output:

- app/admin/page.tsx

- Query ringkasan pada service dashboard

DoD:

- Menampilkan jumlah barang menipis berdasarkan aturan stok kurang dari atau sama dengan batas minimum.

- Menampilkan ringkasan penjualan hari ini berdasarkan tanggal lokal bisnis yang ditentukan.

- Nilai ringkasan bersumber dari database.

- Perhitungan tidak menggandakan transaksi akibat join yang keliru.

- Halaman hanya dapat diakses admin.

- Kondisi gagal memuat ringkasan ditangani dengan pesan yang jelas.

Outcome: Admin dapat melihat ringkasan stok dan penjualan hari ini.

**TB-21 — Implementasi Monitoring Stok**

Must

Referensi: PB-STOK-02, PB-STOK-03 · BR-10

Dependensi: TB-07, TB-08, TB-12

Output:

- app/admin/stok/page.tsx

- Query monitoring pada lib/services/stock.service.ts

DoD:

- Menampilkan stok barang saat ini dan batas minimum stok.

- Barang dengan stok kurang dari atau sama dengan batas minimum diberi status “menipis”.

- Barang dengan stok nol dapat dibedakan dari barang yang stoknya masih tersedia.

- Nilai stok berasal dari tabel barang setelah perubahan stok di database.

- Halaman hanya dapat diakses admin.

Outcome: Admin dapat mengidentifikasi barang yang perlu segera diisi kembali.

**E13 — Riwayat Transaksi**

**TB-22 — Implementasi Riwayat Penjualan Berdasarkan Role**

Must

Referensi: PB-RWY-01, PB-RWY-02 · BR-11, BR-12

Dependensi: TB-08, TB-11, TB-18

Output:

- app/admin/penjualan/riwayat/page.tsx

- app/kasir/penjualan/riwayat/page.tsx

- Query riwayat pada lib/services/sales.service.ts

DoD:

- Admin dapat melihat riwayat penjualan semua kasir.

- Kasir hanya dapat melihat transaksi miliknya; pembatasan dilakukan pada query server/database, bukan hanya filter tampilan.

- Filter tanggal mulai dan tanggal akhir tersedia.

- Rentang tanggal ditolak jika tanggal akhir lebih awal daripada tanggal mulai.

- Batas tanggal diproses secara konsisten dengan zona waktu bisnis.

- Daftar menampilkan nomor transaksi, tanggal, kasir yang sesuai dengan hak akses, total, dan metode pembayaran.

- Detail transaksi dapat dibuka sesuai role.

- Data kosong dan kesalahan query ditangani.

Outcome: Riwayat penjualan dapat ditelusuri berdasarkan tanggal tanpa membuka transaksi milik kasir lain kepada pengguna kasir.

**TB-23 — Implementasi Riwayat Pergerakan Stok**

Must

Referensi: PB-STOK-03, PB-RWY-03

Dependensi: TB-07, TB-08, TB-21

Output:

- app/admin/stok/riwayat/page.tsx

- Query riwayat pada lib/services/stock.service.ts

DoD:

- Menampilkan catatan stok masuk (IN) dan stok keluar akibat penjualan (OUT).

- Informasi mencakup tanggal, barang, jenis pergerakan, jumlah, dan referensi transaksi jika tersedia.

- Catatan dibaca dari stock_movements, bukan dibuat ulang dari data UI.

- Riwayat tidak menyediakan aksi untuk mengubah catatan pergerakan secara langsung.

- Akses dibatasi untuk admin.

Outcome: Admin dapat menelusuri alasan dan sumber perubahan stok.

**Rekap Technical Backlog Part 5**

| **ID** | **Task** | **Prioritas** |
| --- | --- | --- |
| TB-10 | Login dan logout | Must |
| TB-11 | Proteksi halaman dan role | Must |
| TB-12 | Daftar, pencarian, dan detail barang | Must |
| TB-13 | Tambah, edit, nonaktifkan barang | Must |
| TB-14 | Form barang masuk | Must |
| TB-15 | Riwayat barang masuk | Must |
| TB-16 | Keranjang penjualan | Must |
| TB-17 | Pembayaran tunai dan non-tunai | Must |
| TB-18 | Checkout dan penyimpanan transaksi | Must |
| TB-19 | Struk penjualan | Must |
| TB-20 | Dashboard admin | Must |
| TB-21 | Monitoring stok | Must |
| TB-22 | Riwayat penjualan berdasarkan role | Must |
| TB-23 | Riwayat pergerakan stok | Must |

Catatan implementasi: TB-10 sampai TB-23 bergantung pada fondasi TB-01 sampai TB-09 dari Part 4. Semua perubahan stok tetap harus melewati fungsi database transaksional. Jangan membuat jalur alternatif yang memperbarui kolom stok secara langsung.

**PART 6 — TECHNICAL BACKLOG STOKITA**

**Setup, Seed Data, dan Deployment**

Part 6 merupakan lanjutan Technical Backlog untuk menyelesaikan fondasi aplikasi Stokita, mengisi data awal, dan menyiapkan aplikasi agar dapat digunakan melalui web.

Teknologi yang digunakan tetap Next.js App Router + TypeScript + Supabase PostgreSQL/Auth + Vercel.

**E14 — Setup dan Konfigurasi Aplikasi**

**TB-24 — Konfigurasi Environment dan Build Production**

Must

Referensi: PB-DEP-01

Dependensi: TB-01, TB-02

Task: Menyiapkan konfigurasi aplikasi untuk lingkungan development dan production.

Output:

- .env.example

- next.config.ts

- Dokumentasi konfigurasi environment pada README.md

DoD:

- URL Supabase dan anon/publishable key dikonfigurasi melalui environment variable.

- Supabase service role key hanya digunakan pada proses server yang memerlukannya dan tidak pernah diekspos ke browser.

- Environment variable yang wajib tersedia didokumentasikan.

- Konfigurasi development dan production dapat dibedakan.

- Build production dapat disiapkan tanpa memasukkan secret ke repository.

- Pesan kesalahan konfigurasi yang hilang dibuat jelas.

Outcome: Aplikasi mempunyai konfigurasi yang konsisten dan aman untuk pengembangan maupun deployment.

**TB-25 — Finalisasi Migrasi Database**

Must

Referensi: PB-DEP-01

Dependensi: TB-04, TB-05, TB-06, TB-07, TB-08

Task: Merapikan seluruh migrasi database agar dapat diterapkan pada project Supabase baru.

Output:

- supabase/migrations/

- Dokumentasi urutan migrasi pada README.md

DoD:

- Migrasi membuat lima tabel inti: profiles, products, sales, sale_items, dan stock_movements.

- Relasi, constraint, indeks yang diperlukan, RLS, dan fungsi transaksi tercakup dalam migrasi.

- Fungsi add_stock_in dan checkout_sale memiliki pembatasan hak eksekusi yang tepat.

- Fungsi dengan hak istimewa menggunakan pengaturan search_path yang aman dan memvalidasi identitas serta role pemanggil.

- Migrasi dapat diterapkan secara berurutan pada database baru.

- Tidak ada kredensial atau data rahasia yang ditulis langsung di file migrasi.

Outcome: Struktur database dan aturan bisnis dapat direproduksi secara konsisten.

**E15 — Seed Data dan Akun Awal**

**TB-26 — Pembuatan Akun Awal**

Must

Referensi: PB-DEP-02, PB-AUTH-01, PB-AUTH-02

Dependensi: TB-10, TB-11, TB-25

Task: Menyediakan mekanisme pembuatan akun awal untuk satu admin gudang dan dua kasir.

Output:

- supabase/seed.sql untuk data yang sesuai

- Script server-side atau prosedur administratif untuk pembuatan akun Supabase Auth

- Dokumentasi setup akun awal

DoD:

- Tersedia tepat tiga akun awal sesuai kebutuhan: satu admin dan dua kasir.

- Setiap akun memiliki profil dan role yang cocok dengan identitas Auth.

- Akun dibuat melalui mekanisme administratif yang sesuai dengan Supabase Auth; password tidak ditanam dalam seed SQL biasa.

- Kredensial awal diberikan secara aman dan dapat diganti.

- Script tidak membuat akun duplikat ketika dijalankan kembali sesuai mekanisme idempotensi yang ditetapkan.

- Tidak ada fitur registrasi publik yang ditambahkan.

Outcome: Aplikasi dapat digunakan oleh pengguna yang telah ditentukan tanpa membuka pendaftaran umum.

**TB-27 — Pengisian Data Awal Barang**

Must

Referensi: PB-DEP-02, PB-BRG-01, PB-STOK-02 · BR-06, BR-10

Dependensi: TB-13, TB-25

Task: Menyediakan data awal barang yang dapat digunakan untuk mengoperasikan dan mendemonstrasikan aplikasi.

Output:

- supabase/seed.sql atau file seed data barang terpisah

DoD:

- Tersedia data barang dengan kode unik.

- Nama barang, harga jual, stok, batas minimum, dan status aktif memiliki nilai yang valid.

- Data mencakup stok nol, stok di bawah minimum, stok tepat pada batas minimum, dan stok di atas minimum.

- Harga tidak bernilai negatif.

- Seed dapat dijalankan secara konsisten tanpa menciptakan kode barang duplikat.

- Perubahan stok awal tidak dibuat dengan memanggil alur penjualan palsu.

Outcome: Data awal mencakup kondisi stok normal, menipis, dan kosong untuk penggunaan aplikasi.

**TB-28 — Pengisian Data Awal Transaksi**

Must

Referensi: PB-DEP-02, PB-JUAL-05, PB-RWY-01, PB-RWY-03 · BR-11, BR-12, BR-13

Dependensi: TB-18, TB-22, TB-23, TB-27

Task: Menyiapkan data transaksi awal untuk menampilkan riwayat penjualan dan pergerakan stok.

Output:

- supabase/seed.sql atau mekanisme seed transaksi terpisah

- Dokumentasi aturan keterkaitan data transaksi

DoD:

- Data penjualan mencakup beberapa tanggal, bukan hanya hari ini.

- Terdapat transaksi dari kedua akun kasir.

- Data mencakup metode pembayaran tunai dan non-tunai.

- Detail penjualan terhubung dengan transaksi dan barang yang benar.

- Pergerakan stok keluar terkait dengan transaksi penjualan yang sesuai.

- Data seed tidak membuat hubungan transaksi yang tidak konsisten dengan detail dan catatan stok.

- Data contoh tidak digunakan sebagai transaksi nyata dalam lingkungan production tanpa keputusan eksplisit.

Outcome: Halaman riwayat dan filter tanggal memiliki data contoh yang relevan.

**E16 — Deployment dan Dokumentasi**

**TB-29 — Deployment Aplikasi ke Vercel**

Must

Referensi: PB-DEP-03

Dependensi: TB-24, TB-25, TB-26, TB-27, TB-28

Task: Menyiapkan aplikasi agar dapat dijalankan melalui URL production.

Output:

- Konfigurasi deployment Vercel

- Environment variables production

- URL aplikasi yang telah diterbitkan

DoD:

- Repository terhubung ke project Vercel.

- Environment variable production diatur melalui dashboard Vercel.

- Migrasi database diterapkan pada Supabase production dengan prosedur yang terdokumentasi.

- Akun awal dibuat secara terkontrol pada lingkungan yang benar.

- Aplikasi dapat diakses melalui URL HTTPS.

- Secret tidak dimasukkan ke source code, log publik, atau bundle browser.

- Kegagalan deployment dan konfigurasi dapat ditelusuri melalui log yang sesuai.

Outcome: Aplikasi Stokita tersedia secara online dan dapat diakses oleh pengguna yang berwenang.

**TB-30 — Dokumentasi Setup dan Operasional**

Must

Referensi: PB-DEP-01, PB-DEP-02, PB-DEP-03

Dependensi: TB-24, TB-25, TB-26, TB-29

Task: Menyusun dokumentasi untuk setup, konfigurasi, pengelolaan akun, dan deployment aplikasi.

Output:

- README.md

- Panduan konfigurasi environment

- Panduan migrasi database dan seed data

- Panduan deployment serta pengelolaan akun awal

DoD:

- Dokumentasi memuat kebutuhan perangkat lunak dan langkah setup lokal.

- Nama environment variable wajib dijelaskan tanpa mencantumkan nilainya yang rahasia.

- Urutan migrasi dan pengisian seed terdokumentasi.

- Prosedur pembuatan atau penggantian kredensial awal dijelaskan.

- Prosedur deployment dan pembaruan aplikasi dijelaskan.

- Pembagian hak akses admin dan kasir dijelaskan.

- Tidak ada password produksi atau secret aktif yang disimpan dalam dokumentasi.

Outcome: Pengembang atau pengelola dapat menyiapkan dan memelihara aplikasi dengan prosedur yang jelas.

**Rekap Technical Backlog Part 6**

| **ID** | **Task** | **Prioritas** |
| --- | --- | --- |
| TB-24 | Konfigurasi environment dan build production | Must |
| TB-25 | Finalisasi migrasi database | Must |
| TB-26 | Pembuatan akun awal | Must |
| TB-27 | Pengisian data awal barang | Must |
| TB-28 | Pengisian data awal transaksi | Must |
| TB-29 | Deployment ke Vercel | Must |
| TB-30 | Dokumentasi setup dan operasional | Must |

**Ringkasan keseluruhan backlog**

Product Backlog

**26 item**

Technical Backlog

**30 task**

Prioritas implementasi

**Must**

Dengan demikian, rancangan backlog Stokita mencakup kebutuhan bisnis, implementasi teknis, integritas transaksi, pembatasan role, data awal, dan deployment. Sesuai ruang lingkup yang telah ditentukan, backlog ini tidak menambahkan modul laporan ekspor, supplier, pelanggan, diskon, pajak, retur, payment gateway, atau multi-cabang.