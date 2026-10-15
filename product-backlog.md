**Part 1 — Product Backlog Stokita**

**1. Konvensi backlog**

**Prioritas**

| **Prioritas** | **Arti** |
| --- | --- |
| Must | Wajib ada agar sistem sesuai cakupan dan dapat digunakan. |
| Should | Penting, tetapi dapat dikerjakan setelah kebutuhan Must. |
| Could | Peningkatan opsional yang masih berada dalam cakupan yang disepakati. |

Tidak ada fitur baru di luar konsep Stokita. Seluruh validasi dilakukan di server meskipun antarmuka juga melakukan validasi awal. Pesan error harus jelas dan dapat dipahami pengguna.

**Referensi aturan bisnis**

| **Kode** | **Ringkasan** |
| --- | --- |
| BR-06 | Kode barang unik; harga beli dan jual tidak negatif. |
| BR-07 | Barang yang memiliki riwayat tidak boleh dihapus permanen. |
| BR-09 | Pemisahan akses Admin Gudang dan Kasir. |
| BR-10 | Stok kurang dari atau sama dengan stok minimum ditandai menipis. |
| BR-12 | Kasir hanya boleh melihat riwayat penjualannya sendiri. |

Aturan BR lain akan digunakan pada part berikutnya, terutama saat membahas barang masuk, checkout, pembayaran, dan riwayat.

**Epic E1 — Auth & Role**

**PB-AUTH-01 — Login menggunakan username**

PB-AUTH-01

Must

User story

Sebagai pengguna Stokita, saya ingin login menggunakan username dan password agar dapat mengakses sistem sesuai akun yang diberikan.

Acceptance criteria (Given–When–Then)

- Given pengguna memiliki akun aktif yang sudah disediakan, When pengguna memasukkan username dan password yang benar, Then sistem mengautentikasi pengguna, membuat sesi, dan mengarahkan pengguna ke halaman sesuai role.

- Given username atau password salah, When pengguna mencoba login, Then sistem menolak login dan menampilkan pesan “Username atau password salah.”

- Given kolom username atau password kosong, When pengguna mengirim formulir login, Then sistem menolak formulir dan menampilkan pesan bahwa kolom wajib diisi.

- Given username tidak dikenal atau akun tidak memiliki profil role yang valid, When autentikasi atau pemeriksaan profil dilakukan, Then sistem tidak memberikan akses ke halaman terlindungi dan menampilkan pesan yang sesuai.

- Given pengguna belum login, When pengguna membuka halaman internal secara langsung, Then sistem mengarahkan pengguna ke halaman login.

BR terkait: BR-09.

Output

- Halaman login.

- Fungsi autentikasi username ke email internal.

- Session cookie yang dikelola melalui mekanisme autentikasi Supabase.

- Pesan validasi dan error autentikasi.

Outcome

Pengguna dapat masuk tanpa harus mengingat alamat email internal, sehingga akses aplikasi lebih sederhana bagi staf UMKM.

**PB-AUTH-02 — Logout dan pengelolaan sesi**

PB-AUTH-02

Must

User story

Sebagai pengguna Stokita, saya ingin logout dan mengakhiri sesi dengan aman agar akun saya tidak dapat digunakan oleh orang lain melalui sesi yang tertinggal.

Acceptance criteria (Given–When–Then)

- Given pengguna sudah login, When pengguna memilih logout, Then sistem mengakhiri sesi dan mengarahkan pengguna ke halaman login.

- Given pengguna sudah logout, When pengguna mencoba membuka kembali halaman terlindungi menggunakan sesi lama, Then sistem menolak akses dan meminta login kembali.

- Given sesi tidak valid atau telah berakhir, When pengguna mengakses halaman terlindungi, Then sistem menolak akses dan menampilkan atau mengarahkan pengguna ke proses login.

- Given proses logout gagal, When sistem memproses permintaan logout, Then sistem memberikan pesan error yang jelas dan tidak menampilkan status berhasil secara palsu.

BR terkait: BR-09.

Output

- Aksi logout pada antarmuka.

- Fungsi server untuk mengakhiri sesi.

- Perlindungan halaman terhadap sesi yang tidak valid.

Outcome

Risiko akses tidak sah akibat perangkat kasir atau komputer gudang yang digunakan bergantian dapat dikurangi.

**PB-AUTH-03 — Akses halaman sesuai role**

PB-AUTH-03

Must

User story

Sebagai pengguna Stokita, saya ingin hanya dapat mengakses fitur sesuai role saya agar data dan tindakan operasional tetap terpisah antara Admin Gudang dan Kasir.

Acceptance criteria (Given–When–Then)

- Given pengguna memiliki role Admin Gudang, When pengguna membuka halaman admin, Then sistem mengizinkan akses sesuai izin admin.

- Given pengguna memiliki role Kasir, When pengguna membuka halaman kasir, Then sistem mengizinkan akses sesuai izin kasir.

- Given pengguna Kasir mencoba membuka halaman admin secara langsung, When server memproses permintaan, Then akses ditolak dan pengguna menerima pesan “Anda tidak memiliki akses ke halaman ini.”

- Given pengguna Admin mencoba membuka fitur khusus kasir yang tidak diizinkan, When server memproses permintaan, Then akses ditolak dengan pesan yang jelas.

- Given pengguna mencoba memanggil Server Action atau fungsi server tanpa izin role, When permintaan diproses, Then server menolak tindakan tersebut meskipun pengguna melewati antarmuka.

- Given role pengguna tidak valid, When pemeriksaan otorisasi dilakukan, Then sistem menolak akses secara default.

BR terkait: BR-09, BR-12.

Output

- Pemetaan role dari tabel profiles.

- Middleware untuk pemeriksaan sesi dan pengalihan halaman.

- Pemeriksaan role di server pada setiap operasi yang dilindungi.

Outcome

Data penjualan, pengelolaan stok, dan kewenangan staf lebih terjaga karena hak akses tidak hanya bergantung pada tampilan aplikasi.

**PB-AUTH-04 — Akun awal tanpa registrasi publik**

PB-AUTH-04

Must

User story

Sebagai pengelola Stokita, saya ingin akun awal dibuat melalui seed agar hanya akun yang telah ditentukan yang dapat menggunakan aplikasi.

Acceptance criteria (Given–When–Then)

- Given database belum memiliki akun awal, When proses seed dijalankan, Then sistem menyiapkan satu akun Admin Gudang dan dua akun Kasir dengan profil serta role yang sesuai.

- Given akun awal telah tersedia, When pengguna membuka aplikasi, Then tidak tersedia halaman registrasi publik.

- Given akun autentikasi berhasil dibuat tetapi profilnya gagal disiapkan, When pengguna mencoba mengakses aplikasi, Then akses ditolak sampai profil valid tersedia.

- Given proses seed gagal, When proses berakhir, Then tersedia informasi error yang jelas tanpa membiarkan akun memiliki role yang keliru.

BR terkait: BR-09.

Output

- Prosedur seed akun awal.

- Data auth.users yang terhubung ke profiles.

- Tidak adanya halaman register publik.

Outcome

Pemilik UMKM dapat memulai penggunaan aplikasi dengan akun yang terkendali tanpa menyediakan mekanisme pendaftaran yang tidak diperlukan.

**Epic E2 — Barang**

**PB-BRG-01 — Melihat daftar barang**

PB-BRG-01

Must

User story

Sebagai Admin Gudang, saya ingin melihat daftar barang beserta harga dan stoknya agar saya dapat mengetahui kondisi persediaan yang tersedia.

Acceptance criteria (Given–When–Then)

- Given Admin Gudang sudah login, When membuka halaman barang, Then sistem menampilkan kode, nama, harga beli, harga jual, stok, stok minimum, dan status aktif barang.

- Given terdapat barang aktif dengan stok nol, When daftar barang ditampilkan, Then barang tersebut terlihat dengan status “Habis”.

- Given stok barang lebih dari nol tetapi kurang dari atau sama dengan stok minimum, When daftar barang ditampilkan, Then barang tersebut ditandai “Menipis”.

- Given stok barang melebihi stok minimum, When daftar barang ditampilkan, Then barang tersebut tidak diberi status “Menipis” atau “Habis”.

- Given pengguna Kasir mencoba membuka halaman pengelolaan barang milik admin, When permintaan diproses, Then sistem menolak akses dengan pesan yang jelas.

- Given data barang gagal dimuat, When halaman dibuka, Then sistem menampilkan pesan kegagalan pemuatan data dan tidak menyamarkannya sebagai daftar kosong.

BR terkait: BR-09, BR-10.

Output

- Halaman daftar barang admin.

- Tampilan stok dan status persediaan.

- Logika penentuan status stok yang terpisah dari komponen tampilan.

Outcome

Admin Gudang dapat mengenali barang yang perlu diperhatikan sebelum persediaan mengganggu kegiatan penjualan.

**PB-BRG-02 — Menambahkan barang**

PB-BRG-02

Must

User story

Sebagai Admin Gudang, saya ingin menambahkan data barang agar barang yang dijual UMKM dapat dicatat dan digunakan dalam transaksi kasir.

Acceptance criteria (Given–When–Then)

- Given Admin Gudang mengisi kode, nama, harga beli, harga jual, stok awal, dan stok minimum dengan nilai yang valid, When formulir disimpan, Then barang tersimpan dan dapat ditampilkan pada daftar barang.

- Given kode barang sudah digunakan, When Admin Gudang menyimpan barang baru, Then sistem menolak penyimpanan dan menampilkan pesan “Kode barang sudah digunakan.”

- Given harga beli atau harga jual bernilai negatif, When formulir dikirim, Then sistem menolak penyimpanan dan menunjukkan kolom yang harus diperbaiki.

- Given nama atau kode wajib kosong, When formulir dikirim, Then sistem menolak penyimpanan dengan pesan validasi yang jelas.

- Given stok awal atau stok minimum bukan bilangan bulat yang valid atau bernilai negatif, When formulir dikirim, Then sistem menolak data tersebut dan menjelaskan ketentuan nilainya.

- Given pengguna bukan Admin Gudang, When pengguna mencoba menambahkan barang melalui antarmuka atau permintaan langsung, Then server menolak operasi tersebut.

BR terkait: BR-06, BR-09, BR-10.

Output

- Formulir tambah barang.

- Validasi input pada client dan server.

- Operasi penyimpanan barang ke tabel products.

Outcome

Data barang menjadi terstruktur dan siap digunakan dalam proses pengelolaan persediaan serta penjualan.

**PB-BRG-03 — Mengubah data barang**

PB-BRG-03

Must

User story

Sebagai Admin Gudang, saya ingin memperbarui informasi barang agar perubahan nama dan harga dapat dikelola tanpa membuat data barang duplikat.

Acceptance criteria (Given–When–Then)

- Given barang tersedia, When Admin Gudang mengubah nama atau harga dengan nilai valid, Then perubahan tersimpan dan ditampilkan pada daftar barang.

- Given Admin Gudang mengubah kode menjadi kode yang telah digunakan barang lain, When perubahan disimpan, Then sistem menolak perubahan dengan pesan “Kode barang sudah digunakan.”

- Given harga beli atau harga jual diisi dengan nilai negatif, When perubahan dikirim, Then sistem menolak perubahan dan menampilkan pesan validasi yang sesuai.

- Given Admin Gudang mencoba mengubah stok langsung melalui formulir edit barang, When perubahan diproses, Then sistem tidak mengizinkan stok diubah melalui jalur tersebut.

- Given pengguna bukan Admin Gudang, When pengguna mencoba memperbarui barang, Then server menolak permintaan dengan pesan akses yang jelas.

- Given penyimpanan perubahan gagal, When operasi selesai, Then sistem menampilkan pesan kegagalan dan tidak menyatakan perubahan berhasil.

BR terkait: BR-06, BR-09.

Output

- Formulir edit barang.

- Fungsi pembaruan atribut barang.

- Pemisahan perubahan informasi barang dari perubahan stok.

Outcome

Informasi harga dan nama barang dapat diperbarui tanpa merusak konsistensi persediaan dan riwayat transaksi.

**PB-BRG-04 — Menonaktifkan barang**

PB-BRG-04

Must

User story

Sebagai Admin Gudang, saya ingin menonaktifkan barang yang tidak lagi dijual agar barang tersebut tidak digunakan dalam transaksi baru tanpa menghilangkan riwayatnya.

Acceptance criteria (Given–When–Then)

- Given barang masih aktif, When Admin Gudang memilih menonaktifkan barang, Then kolom aktif berubah menjadi false dan riwayat barang tetap tersimpan.

- Given barang sudah memiliki riwayat penjualan atau mutasi stok, When Admin Gudang menonaktifkannya, Then sistem tidak menghapus data barang secara permanen.

- Given barang tidak aktif, When kasir mencari barang untuk transaksi baru, Then barang tersebut tidak tersedia untuk dipilih.

- Given Admin Gudang mencoba menghapus permanen barang yang memiliki riwayat, When operasi diproses, Then sistem menolak penghapusan dengan pesan “Barang memiliki riwayat dan tidak dapat dihapus permanen.”

- Given pengguna bukan Admin Gudang, When pengguna mencoba menonaktifkan barang, Then server menolak operasi tersebut.

BR terkait: BR-07, BR-09.

Output

- Aksi nonaktif barang.

- Penggunaan kolom products.aktif.

- Penyaringan barang aktif untuk kebutuhan transaksi baru.

Outcome

Riwayat operasional tetap dapat ditelusuri meskipun barang tidak lagi digunakan untuk penjualan.

**Part 2 — Product Backlog Stokita**

**Epic E3: Barang Masuk dan E4: Penjualan**

Part ini melanjutkan Product Backlog dari Part 1. ID tetap konsisten agar nanti bisa dirujuk langsung oleh Technical Backlog untuk OpenCode AI.

Prioritas yang digunakan:

- Must: wajib untuk memenuhi cakupan sistem.

- Should: penting, dikerjakan setelah kebutuhan Must.

- Could: opsional dalam cakupan yang telah disepakati.

Seluruh validasi wajib dilakukan di server, dengan pesan error yang jelas. Logika bisnis dipisahkan dari komponen tampilan agar dapat diuji menggunakan metode yang ditentukan dosen nanti.

**Epic E3 — Barang Masuk**

**PB-BM-01 — Mencatat barang masuk**

**PB-BM-01**

Must

User story

Sebagai Admin Gudang, saya ingin mencatat barang masuk beserta jumlahnya agar stok barang bertambah sesuai persediaan yang diterima.

Acceptance criteria (Given–When–Then)

- Given Admin Gudang sudah login dan memilih barang aktif dengan jumlah masuk berupa bilangan bulat positif, When formulir barang masuk disimpan, Then sistem menambah stok sesuai jumlah masuk dan mencatat mutasi bertipe IN.

- Given stok awal barang adalah 10 dan jumlah masuk adalah 5, When transaksi barang masuk berhasil, Then stok menjadi 15 dan riwayat mutasi mencatat jumlah 5.

- Given jumlah masuk adalah 0, negatif, pecahan, atau bukan angka yang valid, When formulir dikirim, Then sistem menolak permintaan dengan pesan “Jumlah barang masuk harus berupa bilangan bulat lebih dari 0.”

- Given barang tidak ditemukan atau sudah tidak aktif, When permintaan barang masuk diproses, Then sistem menolak transaksi dengan pesan yang menjelaskan bahwa barang tidak tersedia atau tidak aktif.

- Given pengguna bukan Admin Gudang, When pengguna mencoba mencatat barang masuk melalui antarmuka atau permintaan langsung, Then server menolak operasi dengan pesan “Anda tidak memiliki akses untuk mencatat barang masuk.”

- Given penambahan stok atau pencatatan mutasi gagal, When transaksi database selesai, Then seluruh perubahan dibatalkan dan stok tetap seperti semula.

- Given stok barang telah mencapai nilai besar yang mendekati batas integer database, When penambahan stok menyebabkan overflow atau melampaui batas yang diizinkan, Then sistem membatalkan transaksi dan menampilkan pesan kesalahan yang jelas.

BR terkait: BR-01, BR-04, BR-09.

Output

- Formulir barang masuk.

- Service untuk validasi jumlah masuk.

- Fungsi PostgreSQL add_stock_in.

- Catatan stock_movements bertipe IN.

- Hasil transaksi yang menunjukkan stok sebelum dan sesudah perubahan.

Outcome

Admin Gudang dapat memperbarui persediaan berdasarkan barang yang benar-benar diterima, sementara perubahan stok dan pencatatannya tetap konsisten.

**PB-BM-02 — Melihat hasil dan riwayat barang masuk**

**PB-BM-02**

Must

User story

Sebagai Admin Gudang, saya ingin melihat riwayat mutasi barang masuk agar saya dapat menelusuri penambahan persediaan yang telah dilakukan.

Acceptance criteria (Given–When–Then)

- Given terdapat transaksi barang masuk yang berhasil, When Admin Gudang membuka riwayat mutasi stok, Then sistem menampilkan barang, tipe mutasi, jumlah, referensi, catatan jika ada, pembuat, dan tanggal.

- Given suatu transaksi barang masuk gagal, When Admin Gudang melihat riwayat mutasi, Then tidak ada mutasi IN yang tercatat dari transaksi gagal tersebut.

- Given pengguna bukan Admin Gudang, When pengguna membuka halaman riwayat mutasi admin, Then sistem menolak akses dengan pesan yang jelas.

- Given data riwayat gagal dimuat, When halaman dibuka, Then sistem menampilkan pesan kegagalan pemuatan data.

BR terkait: BR-01, BR-09.

Output

- Tampilan riwayat mutasi stok.

- Pengambilan data dari tabel stock_movements.

- Relasi mutasi dengan barang dan pengguna pembuat.

Outcome

Admin Gudang dapat menelusuri asal perubahan persediaan sehingga selisih stok lebih mudah ditindaklanjuti.

**Epic E4 — Penjualan**

**PB-JUAL-01 — Mencari dan memilih barang**

**PB-JUAL-01**

Must

User story

Sebagai Kasir, saya ingin mencari dan memilih barang yang tersedia agar saya dapat melayani transaksi penjualan dengan cepat.

Acceptance criteria (Given–When–Then)

- Given Kasir sudah login, When membuka halaman penjualan, Then sistem menampilkan barang aktif beserta kode, nama, harga jual, dan stok tersedia.

- Given Kasir memasukkan kata pencarian, When pencarian diproses, Then sistem menampilkan barang aktif yang sesuai dengan kode atau nama barang.

- Given barang memiliki stok 0, When Kasir mencari barang tersebut, Then barang tidak dapat ditambahkan ke keranjang dan sistem menjelaskan bahwa stok habis.

- Given barang sudah tidak aktif, When Kasir mencari barang tersebut, Then barang tidak tersedia untuk transaksi baru.

- Given data barang gagal dimuat, When halaman penjualan dibuka, Then sistem menampilkan pesan error dan tidak menganggap kegagalan tersebut sebagai daftar kosong.

BR terkait: BR-02, BR-03, BR-09.

Output

- Halaman pencarian barang kasir.

- Service pengambilan barang aktif.

- Informasi stok yang tersedia untuk transaksi.

Outcome

Kasir dapat menemukan barang dengan cepat dan mengurangi risiko menjual barang yang tidak tersedia.

**PB-JUAL-02 — Mengelola keranjang dan kuantitas**

**PB-JUAL-02**

Must

User story

Sebagai Kasir, saya ingin mengatur jumlah setiap barang di keranjang agar total transaksi sesuai dengan barang yang dibeli pelanggan.

Acceptance criteria (Given–When–Then)

- Given barang aktif tersedia, When Kasir menambahkan barang ke keranjang, Then barang muncul dengan kuantitas awal 1 dan harga jual yang berlaku.

- Given barang sudah ada di keranjang, When Kasir menambahkan barang yang sama, Then kuantitas barang bertambah sesuai tindakan Kasir.

- Given Kasir mengubah kuantitas, When nilai baru berupa bilangan bulat positif, Then sistem menghitung ulang subtotal barang dan total keranjang.

- Given kuantitas berupa 0, negatif, pecahan, atau nilai tidak valid, When Kasir menyimpan perubahan kuantitas, Then sistem menolak nilai tersebut dan menampilkan pesan “Qty harus berupa bilangan bulat lebih dari 0.”

- Given kuantitas keranjang melebihi stok yang tersedia, When Kasir mencoba checkout, Then server menolak transaksi dengan pesan yang menjelaskan barang yang stoknya tidak mencukupi.

- Given stok berubah setelah barang dimasukkan ke keranjang, When Kasir melakukan checkout, Then server menggunakan stok terkini dari database sebagai acuan, bukan hanya stok yang tampil di browser.

BR terkait: BR-02, BR-03, BR-04.

Output

- Komponen keranjang penjualan.

- Fungsi bisnis validasi kuantitas.

- Fungsi perhitungan subtotal dan total yang terpisah dari UI.

Outcome

Kasir dapat menyusun transaksi dengan lebih akurat, sementara perubahan stok yang terjadi bersamaan tidak menyebabkan penjualan melebihi persediaan.

**PB-JUAL-03 — Menghitung total transaksi**

**PB-JUAL-03**

Must

User story

Sebagai Kasir, saya ingin melihat total harga seluruh barang di keranjang agar saya mengetahui jumlah yang harus dibayar pelanggan.

Acceptance criteria (Given–When–Then)

- Given keranjang berisi satu atau beberapa barang, When barang ditambahkan atau kuantitas diubah, Then subtotal dihitung sebagai harga satuan dikalikan kuantitas dan total dihitung dari seluruh subtotal.

- Given keranjang kosong, When Kasir mencoba menghitung atau melanjutkan checkout, Then sistem menolak transaksi dengan pesan “Keranjang masih kosong.”

- Given harga barang berubah setelah barang dimasukkan ke keranjang, When checkout diproses, Then server mengambil harga jual terkini dari database dan menghitung ulang total transaksi.

- Given nilai perhitungan tidak valid atau melampaui batas angka yang didukung database, When total dihitung, Then sistem menolak transaksi dengan pesan error yang jelas.

BR terkait: BR-03, BR-04, BR-08.

Output

- Fungsi bisnis calculateSubtotal.

- Fungsi bisnis calculateTotal.

- Tampilan subtotal per barang dan total keranjang.

- Perhitungan total final pada sisi server/database.

Outcome

Pelanggan memperoleh nilai transaksi yang konsisten dan Kasir tidak bergantung pada perhitungan total dari browser yang dapat dimanipulasi.

**PB-JUAL-04 — Memproses pembayaran tunai**

**PB-JUAL-04**

Must

User story

Sebagai Kasir, saya ingin mencatat pembayaran tunai dan melihat kembalian otomatis agar proses pembayaran dapat dilakukan dengan benar.

Acceptance criteria (Given–When–Then)

- Given total transaksi valid dan metode pembayaran tunai dipilih, When Kasir memasukkan uang dibayar yang nilainya sama dengan total, Then sistem menerima nilai pembayaran dan menghitung kembalian sebesar 0.

- Given uang dibayar lebih besar dari total, When Kasir memasukkan nilai pembayaran, Then sistem menghitung kembalian sebagai uang dibayar dikurangi total.

- Given uang dibayar kurang dari total, When Kasir mencoba checkout, Then sistem menolak transaksi dengan pesan “Uang dibayar kurang dari total transaksi.”

- Given uang dibayar kosong, negatif, atau bukan nilai nominal yang valid, When Kasir mengirim pembayaran, Then sistem menolak input dengan pesan validasi yang jelas.

- Given metode tunai belum dipilih, When Kasir mencoba checkout, Then sistem menolak transaksi dengan pesan “Pilih metode pembayaran terlebih dahulu.”

- Given transaksi berhasil, When data penjualan disimpan, Then sistem mencatat metode TUNAI, total, uang dibayar, dan kembalian.

BR terkait: BR-05, BR-14.

Output

- Formulir pembayaran tunai.

- Fungsi bisnis calculateChange.

- Validasi kecukupan uang dibayar.

- Penyimpanan metode dan nominal pembayaran.

Outcome

Kasir dapat melayani pembayaran tunai dengan kembalian yang akurat dan mengurangi kesalahan hitung saat transaksi.

**PB-JUAL-05 — Memproses pembayaran non-tunai**

**PB-JUAL-05**

Must

User story

Sebagai Kasir, saya ingin memilih metode pembayaran non-tunai agar transaksi dapat dicatat tanpa menghitung kembalian secara manual.

Acceptance criteria (Given–When–Then)

- Given keranjang berisi barang valid dan Kasir memilih non-tunai, When sistem menghitung pembayaran, Then nilai bayar otomatis sama dengan total transaksi dan kembalian bernilai 0.

- Given metode non-tunai dipilih, When Kasir melanjutkan checkout, Then sistem tidak meminta nomor referensi, nama bank, atau data payment gateway.

- Given metode non-tunai dipilih, When transaksi berhasil disimpan, Then sistem mencatat metode NON_TUNAI, bayar sama dengan total, dan kembalian 0.

- Given metode pembayaran belum dipilih, When Kasir mencoba checkout, Then sistem menolak transaksi dengan pesan “Pilih metode pembayaran terlebih dahulu.”

- Given klien mengirim nominal bayar atau kembalian yang bertentangan dengan aturan non-tunai, When server memproses checkout, Then server menetapkan bayar sama dengan total dan kembalian 0 atau menolak data yang tidak valid.

- Given transaksi gagal karena stok tidak cukup atau validasi lain, When checkout dibatalkan, Then sistem tidak menyimpan penjualan yang berhasil maupun mengurangi stok.

BR terkait: BR-08, BR-13, BR-14.

Output

- Pilihan metode NON_TUNAI.

- Fungsi bisnis penetapan nominal pembayaran non-tunai.

- Validasi server/database untuk nominal bayar dan kembalian.

- Penyimpanan metode pembayaran tanpa data integrasi eksternal.

Outcome

UMKM dapat membedakan transaksi tunai dan non-tunai dalam pencatatan penjualan tanpa biaya atau kompleksitas integrasi bank.

**PB-JUAL-06 — Checkout dan menyimpan transaksi**

**PB-JUAL-06**

Must

User story

Sebagai Kasir, saya ingin menyelesaikan checkout dalam satu proses transaksi yang atomik agar data penjualan dan stok tidak menjadi tidak konsisten saat terjadi kegagalan.

Acceptance criteria (Given–When–Then)

- Given keranjang berisi barang aktif, kuantitas valid, stok mencukupi, dan metode pembayaran valid, When Kasir melakukan checkout, Then sistem menyimpan transaksi penjualan beserta detail barang, mengurangi stok, dan mencatat mutasi OUT.

- Given satu item dari beberapa item tidak memiliki stok yang cukup, When checkout diproses, Then seluruh transaksi dibatalkan dan stok semua barang tetap seperti semula.

- Given dua kasir melakukan penjualan barang yang sama secara bersamaan, When keduanya melakukan checkout, Then fungsi database mengunci baris barang menggunakan FOR UPDATE, memvalidasi stok terkini, dan mencegah stok menjadi negatif.

- Given penyimpanan salah satu detail penjualan atau mutasi stok gagal, When transaksi database berakhir, Then seluruh perubahan dalam checkout dibatalkan.

- Given pengguna bukan Kasir atau sesi tidak valid, When pengguna memanggil fungsi checkout, Then server/database menolak operasi sesuai pemeriksaan otorisasi yang diterapkan.

- Given checkout berhasil, When sistem mengembalikan hasil transaksi, Then respons memuat identitas transaksi dan informasi yang dibutuhkan untuk menampilkan struk.

- Given checkout gagal karena validasi bisnis, When sistem mengembalikan kegagalan, Then pesan error menjelaskan penyebabnya tanpa mengungkap detail internal database kepada pengguna.

BR terkait: BR-02, BR-03, BR-04, BR-08, BR-09, BR-13, BR-14.

Output

- Fungsi PostgreSQL transaksional checkout_sale.

- Penguncian baris barang dengan FOR UPDATE.

- Penyimpanan sales dan sale_items.

- Pengurangan stok dan pencatatan stock_movements bertipe OUT.

- Service checkout yang menerjemahkan error database menjadi pesan bisnis yang jelas.

Outcome

Penjualan dan persediaan tetap konsisten meskipun beberapa transaksi berjalan bersamaan atau salah satu proses penyimpanan gagal.

**PB-JUAL-07 — Menampilkan struk transaksi**

**PB-JUAL-07**

Must

User story

Sebagai Kasir, saya ingin melihat struk setelah checkout berhasil agar saya dapat memeriksa rincian transaksi dan nominal pembayarannya.

Acceptance criteria (Given–When–Then)

- Given checkout berhasil, When halaman struk ditampilkan, Then struk memuat nomor transaksi, tanggal, rincian barang, kuantitas, harga satuan, subtotal, total, metode pembayaran, bayar, dan kembalian.

- Given metode pembayaran tunai, When struk ditampilkan, Then nilai bayar dan kembalian sesuai data transaksi yang tersimpan.

- Given metode pembayaran non-tunai, When struk ditampilkan, Then struk menunjukkan metode NON_TUNAI, bayar sama dengan total, dan kembalian 0.

- Given checkout gagal, When proses berakhir, Then sistem tidak menampilkan struk seolah-olah transaksi berhasil.

- Given transaksi tidak ditemukan atau pengguna tidak memiliki hak untuk melihatnya, When pengguna membuka halaman struk secara langsung, Then sistem menolak akses dengan pesan yang sesuai.

BR terkait: BR-05, BR-08, BR-09, BR-13.

Output

- Halaman struk transaksi.

- Pengambilan rincian transaksi yang tersimpan.

- Tampilan metode pembayaran dan nilai kembalian.

Outcome

Kasir dapat memeriksa hasil pembayaran dan memberikan rincian transaksi kepada pelanggan melalui tampilan layar.

Catatan rancangan: stok tidak boleh diubah langsung dari formulir barang, keranjang, atau komponen UI. Perubahan stok hanya melalui fungsi database yang telah ditentukan, yaitu add_stock_in dan checkout_sale. Keduanya harus memastikan seluruh operasi terkait berhasil atau dibatalkan bersama.

Belum ada test case maupun kode pengujian yang dibuat.

**Part 3 — Product Backlog Stokita**

**Epic E5: Integrasi Stok, E6: Riwayat, E7: Setup & Deployment**

Part ini menyelesaikan Product Backlog Stokita. Setelah bagian ini, seluruh tujuh epic sudah memiliki backlog produk dan kita dapat beralih ke Technical Backlog yang berisi urutan pekerjaan teknis untuk OpenCode AI.

Prioritas tetap menggunakan Must, Should, dan Could. Tidak ada penambahan fitur di luar cakupan yang disepakati.

**Epic E5 — Integrasi Stok**

**PB-STOK-01 — Menjaga konsistensi perubahan stok**

**PB-STOK-01**

Must

User story

Sebagai Admin Gudang, saya ingin setiap perubahan stok berasal dari proses barang masuk atau penjualan yang sah agar jumlah persediaan selalu konsisten dengan transaksi yang tercatat.

Acceptance criteria (Given–When–Then)

- Given Admin Gudang mencatat barang masuk yang valid, When fungsi database add_stock_in berhasil, Then stok bertambah dan mutasi IN tercatat dalam transaksi database yang sama.

- Given Kasir menyelesaikan checkout yang valid, When fungsi database checkout_sale berhasil, Then stok berkurang dan mutasi OUT tercatat dalam transaksi database yang sama.

- Given operasi penambahan atau pengurangan stok gagal, When transaksi database dibatalkan, Then tidak ada perubahan stok maupun mutasi parsial dari operasi tersebut.

- Given aplikasi mencoba mengubah products.stok melalui jalur selain fungsi database yang diizinkan, When permintaan diproses, Then sistem menolak perubahan tersebut.

- Given terjadi beberapa perubahan stok secara bersamaan, When fungsi database memproses perubahan, Then penguncian baris dan validasi stok terkini mencegah stok menjadi negatif.

- Given perubahan stok berhasil, When riwayat mutasi dibuka, Then nilai jumlah, tipe mutasi, referensi, pembuat, dan tanggal sesuai dengan operasi yang telah disimpan.

BR terkait: BR-01, BR-02, BR-03, BR-08.

Output

- Mekanisme perubahan stok melalui fungsi database.

- Konsistensi antara products.stok dan stock_movements.

- Service stok yang memanggil fungsi database terkait.

Outcome

UMKM memperoleh persediaan yang dapat dipercaya karena perubahan stok tidak bergantung pada input manual yang tidak terlacak.

**PB-STOK-02 — Memantau stok menipis dan habis**

**PB-STOK-02**

Must

User story

Sebagai Admin Gudang, saya ingin melihat status stok menipis dan habis agar saya dapat memprioritaskan pengadaan persediaan.

Acceptance criteria (Given–When–Then)

- Given stok barang sama dengan 0, When monitoring stok ditampilkan, Then barang diberi status “Habis”.

- Given stok barang lebih dari 0 tetapi kurang dari atau sama dengan stok minimum, When monitoring stok ditampilkan, Then barang diberi status “Menipis”.

- Given stok barang lebih besar dari stok minimum, When monitoring stok ditampilkan, Then barang tidak diberi status “Menipis” atau “Habis”.

- Given stok berubah akibat barang masuk atau penjualan, When data monitoring dimuat kembali, Then status ditentukan berdasarkan nilai stok terbaru dari database.

- Given pengguna bukan Admin Gudang, When pengguna membuka halaman monitoring stok admin, Then sistem menolak akses dengan pesan yang jelas.

- Given data monitoring gagal dimuat, When halaman dibuka, Then sistem menampilkan pesan kegagalan pemuatan data.

BR terkait: BR-10.

Output

- Halaman monitoring stok.

- Fungsi bisnis penentuan status stok.

- Indikator visual untuk status “Menipis” dan “Habis”.

Outcome

Admin Gudang dapat mengetahui barang yang membutuhkan perhatian tanpa menghitung kondisi stok secara manual.

**PB-STOK-03 — Melihat ringkasan stok dan penjualan hari ini**

**PB-STOK-03**

Must

User story

Sebagai Admin Gudang, saya ingin melihat ringkasan barang menipis dan penjualan hari ini pada dashboard agar saya dapat memantau kondisi operasional dengan cepat.

Acceptance criteria (Given–When–Then)

- Given terdapat barang aktif dengan stok kurang dari atau sama dengan stok minimum, When dashboard dimuat, Then sistem menampilkan jumlah barang menipis sesuai aturan status stok.

- Given terdapat barang dengan stok 0, When dashboard dimuat, Then barang tersebut termasuk dalam indikator barang menipis dan dapat dibedakan sebagai barang habis.

- Given terdapat transaksi penjualan pada tanggal hari ini, When dashboard dimuat, Then sistem menampilkan ringkasan total penjualan hari ini berdasarkan transaksi yang tersimpan.

- Given tidak ada transaksi penjualan hari ini, When dashboard dimuat, Then total penjualan ditampilkan sebagai 0.

- Given pengguna bukan Admin Gudang, When pengguna membuka dashboard admin, Then sistem menolak akses.

- Given data dashboard gagal diambil, When dashboard dimuat, Then sistem menampilkan pesan error yang jelas dan tidak menyajikan data gagal dimuat sebagai nilai yang pasti.

BR terkait: BR-09, BR-10, BR-11.

Output

- Dashboard Admin Gudang.

- Fungsi pengambilan ringkasan stok menipis.

- Fungsi pengambilan ringkasan penjualan harian.

Outcome

Pengelola UMKM dapat mengambil keputusan operasional harian dengan lebih cepat tanpa harus membuka setiap data secara terpisah.

**Epic E6 — Riwayat**

**PB-RWY-01 — Melihat riwayat mutasi stok**

**PB-RWY-01**

Must

User story

Sebagai Admin Gudang, saya ingin melihat seluruh riwayat mutasi stok agar dapat menelusuri perubahan persediaan akibat barang masuk dan penjualan.

Acceptance criteria (Given–When–Then)

- Given terdapat mutasi stok yang berhasil disimpan, When Admin Gudang membuka riwayat mutasi, Then sistem menampilkan barang, tipe IN atau OUT, jumlah, referensi, catatan, pembuat, dan tanggal.

- Given suatu transaksi penjualan berhasil, When mutasi stok ditampilkan, Then mutasi OUT dapat ditelusuri ke transaksi terkait.

- Given suatu transaksi barang masuk berhasil, When mutasi stok ditampilkan, Then mutasi IN dapat ditelusuri ke operasi barang masuk terkait.

- Given transaksi dibatalkan, When Admin Gudang melihat riwayat mutasi, Then tidak ada mutasi berhasil yang berasal dari transaksi yang dibatalkan.

- Given pengguna bukan Admin Gudang, When pengguna mencoba mengakses seluruh riwayat mutasi, Then sistem menolak akses dengan pesan yang jelas.

- Given data mutasi gagal dimuat, When halaman dibuka, Then sistem menampilkan pesan kegagalan pemuatan data.

BR terkait: BR-01, BR-02, BR-08, BR-09.

Output

- Halaman riwayat mutasi.

- Query riwayat dari stock_movements.

- Informasi referensi dan pelaku mutasi.

Outcome

Admin Gudang dapat menelusuri penyebab perubahan persediaan untuk membantu proses pemeriksaan stok.

**PB-RWY-02 — Melihat riwayat penjualan sesuai role**

**PB-RWY-02**

Must

User story

Sebagai pengguna Stokita, saya ingin melihat riwayat penjualan sesuai role agar saya dapat memeriksa transaksi yang menjadi tanggung jawab saya atau seluruh kasir jika saya Admin Gudang.

Acceptance criteria (Given–When–Then)

- Given Admin Gudang sudah login, When membuka riwayat penjualan, Then sistem menampilkan transaksi seluruh kasir beserta nomor transaksi, tanggal, nama kasir, total, dan metode pembayaran.

- Given Kasir sudah login, When membuka riwayat penjualan, Then sistem hanya menampilkan transaksi milik Kasir tersebut.

- Given Kasir mengubah parameter permintaan agar mengambil transaksi kasir lain, When server memproses permintaan, Then sistem tetap membatasi data berdasarkan identitas pengguna yang terautentikasi.

- Given transaksi penjualan tersedia, When pengguna yang berhak membuka rincian transaksi, Then sistem menampilkan item, kuantitas, harga satuan, subtotal, total, metode pembayaran, bayar, dan kembalian.

- Given transaksi tidak ditemukan atau pengguna tidak berhak melihat transaksi, When pengguna meminta rincian transaksi, Then sistem menolak permintaan dengan pesan yang sesuai.

- Given data riwayat gagal dimuat, When halaman dibuka, Then sistem menampilkan pesan error yang jelas.

BR terkait: BR-09, BR-12.

Output

- Halaman riwayat penjualan.

- Tampilan rincian transaksi.

- Query yang membatasi data berdasarkan role dan identitas pengguna.

Outcome

Kasir dapat memeriksa transaksi sendiri, sedangkan Admin Gudang memiliki visibilitas penjualan lintas kasir sesuai kewenangannya.

**PB-RWY-03 — Memfilter riwayat berdasarkan tanggal**

**PB-RWY-03**

Must

User story

Sebagai pengguna yang berhak melihat riwayat penjualan, saya ingin memfilter transaksi berdasarkan rentang tanggal agar dapat menemukan transaksi pada periode tertentu.

Acceptance criteria (Given–When–Then)

- Given tanggal awal dan akhir valid, When pengguna menerapkan filter, Then sistem hanya menampilkan transaksi pada rentang tanggal yang dipilih, termasuk tanggal awal dan tanggal akhir.

- Given tanggal akhir lebih kecil daripada tanggal awal, When filter diterapkan, Then sistem menolak filter dan menampilkan pesan “Tanggal akhir tidak boleh lebih awal dari tanggal awal.”

- Given format tanggal tidak valid, When pengguna mengirim filter, Then sistem menolak input dengan pesan validasi yang jelas.

- Given filter tanggal valid tetapi tidak ada transaksi dalam rentang tersebut, When hasil ditampilkan, Then sistem menampilkan kondisi tidak ada transaksi, bukan error.

- Given Kasir menggunakan filter tanggal, When hasil riwayat ditampilkan, Then pembatasan transaksi milik Kasir tetap berlaku.

- Given Admin Gudang menggunakan filter tanggal, When hasil riwayat ditampilkan, Then sistem menampilkan transaksi seluruh kasir dalam rentang tanggal yang dipilih.

- Given pengguna mengubah filter tanggal, When server menerima permintaan, Then validasi tanggal dilakukan kembali di server.

BR terkait: BR-11, BR-12.

Output

- Filter tanggal awal dan tanggal akhir.

- Fungsi bisnis validasi rentang tanggal.

- Query riwayat penjualan berdasarkan rentang tanggal dan role.

Outcome

Pengguna dapat menemukan transaksi pada periode tertentu dengan lebih cepat tanpa perlu menelusuri seluruh riwayat secara manual.

**Epic E7 — Setup & Deployment**

**PB-DEP-01 — Menjalankan aplikasi melalui konfigurasi lingkungan**

**PB-DEP-01**

Must

User story

Sebagai pengembang Stokita, saya ingin aplikasi memiliki konfigurasi lingkungan yang jelas agar dapat dijalankan secara lokal dan dihubungkan ke Supabase tanpa membocorkan kredensial sensitif.

Acceptance criteria (Given–When–Then)

- Given variabel lingkungan Supabase yang dibutuhkan telah dikonfigurasi, When aplikasi dijalankan, Then aplikasi dapat menginisialisasi koneksi Supabase sesuai kebutuhan server dan browser.

- Given variabel lingkungan wajib belum diisi, When aplikasi dijalankan atau fungsi terkait dipanggil, Then sistem memberikan pesan konfigurasi yang jelas tanpa menampilkan rahasia.

- Given service role key digunakan, When operasi server membutuhkannya, Then key hanya tersedia di lingkungan server dan tidak dikirim ke browser.

- Given pengembang mengikuti dokumentasi proyek, When menjalankan instalasi dependensi dan aplikasi, Then langkah konfigurasi dapat diikuti tanpa memerlukan akun registrasi publik.

- Given konfigurasi lokal tidak valid, When aplikasi membutuhkan konfigurasi tersebut, Then sistem menunjukkan variabel yang belum tersedia tanpa mengungkap nilai rahasia.

BR terkait: BR-09.

Output

- File contoh environment .env.example.

- Inisialisasi client Supabase server dan browser sesuai kebutuhan.

- Dokumentasi konfigurasi dan cara menjalankan aplikasi.

Outcome

Pengembangan dan pemindahan lingkungan aplikasi menjadi lebih terkontrol serta mengurangi risiko kebocoran kredensial.

**PB-DEP-02 — Menyediakan seed data untuk penggunaan awal**

**PB-DEP-02**

Must

User story

Sebagai pengembang dan penguji Stokita, saya ingin seed data yang mewakili kondisi operasional agar aplikasi dapat diperiksa setelah instalasi tanpa memasukkan seluruh data dari awal.

Acceptance criteria (Given–When–Then)

- Given database dan autentikasi telah disiapkan, When proses seed dijalankan, Then tersedia satu akun Admin Gudang dan dua akun Kasir yang terhubung dengan profil role masing-masing.

- Given seed barang dijalankan, When data barang diperiksa, Then tersedia beberapa barang dengan stok berbeda, termasuk stok 0 dan stok yang sama dengan stok minimum.

- Given seed transaksi dijalankan, When riwayat penjualan diperiksa, Then tersedia beberapa transaksi dengan tanggal dan metode pembayaran yang berbeda, termasuk TUNAI dan NON_TUNAI.

- Given transaksi seed memiliki detail barang, When rincian transaksi dibuka, Then relasi sales dan sale_items konsisten serta nominal transaksi sesuai dengan detailnya.

- Given seed dijalankan kembali pada lingkungan yang telah berisi data seed, When proses selesai, Then proses tidak membuat duplikasi akun atau data awal secara tidak terkendali.

- Given proses seed gagal, When proses berakhir, Then informasi error tersedia sehingga pengembang dapat memperbaiki konfigurasi atau data yang bermasalah.

BR terkait: BR-06, BR-09, BR-10, BR-11, BR-13, BR-14.

Output

- File seed akun dan profil.

- Seed barang dengan variasi stok.

- Seed transaksi dan detail penjualan dengan tanggal serta metode pembayaran berbeda.

- Petunjuk penggunaan seed.

Outcome

Pengembang dan penguji dapat langsung menjelajahi kondisi normal maupun kondisi persediaan kritis tanpa perlu mengisi seluruh data secara manual.

**PB-DEP-03 — Deploy aplikasi ke Vercel**

**PB-DEP-03**

Must

User story

Sebagai pengembang Stokita, saya ingin men-deploy aplikasi ke Vercel yang terhubung ke Supabase agar aplikasi dapat diakses melalui URL deployment untuk keperluan demonstrasi dan evaluasi akademik.

Acceptance criteria (Given–When–Then)

- Given repository dan konfigurasi lingkungan deployment sudah disiapkan, When proses deployment berhasil, Then aplikasi dapat diakses melalui URL Vercel.

- Given environment variable yang diperlukan belum lengkap, When build atau aplikasi membutuhkan konfigurasi tersebut, Then sistem menghasilkan informasi kegagalan yang dapat ditindaklanjuti tanpa membocorkan rahasia.

- Given pengguna memiliki akun seed yang valid, When login melalui URL deployment, Then pengguna diarahkan ke halaman sesuai role.

- Given pengguna tanpa sesi mencoba membuka halaman internal, When halaman diakses, Then sistem tetap menerapkan pemeriksaan autentikasi dan otorisasi.

- Given database Supabase belum memiliki skema atau fungsi database yang dibutuhkan, When aplikasi menjalankan operasi bisnis, Then operasi gagal dengan penanganan error yang jelas dan tidak dianggap berhasil.

- Given deployment menggunakan service role key, When aplikasi berjalan, Then kredensial tersebut tetap berada di server.

BR terkait: BR-08, BR-09.

Output

- Konfigurasi deployment Vercel.

- URL aplikasi yang ter-deploy.

- Environment variable yang diperlukan pada lingkungan deployment.

- Dokumentasi langkah deployment dan pembaruan versi.

Outcome

Stokita dapat digunakan untuk demonstrasi dan evaluasi dosen melalui lingkungan yang dapat diakses tanpa harus menjalankan aplikasi di komputer pengembang.

**Keputusan yang dipertahankan untuk implementasi**

- Tidak ada registrasi publik; akun dibuat melalui seed.

- Role disimpan di profiles dan diperiksa di server.

- Stok hanya berubah melalui add_stock_in dan checkout_sale.

- Checkout menggunakan transaksi PostgreSQL dan row locking.

- Pembayaran hanya tunai dan non-tunai, tanpa integrasi pihak ketiga.

- Riwayat dan filter tanggal menerapkan pembatasan berdasarkan role.

- Belum membuat unit test, Playwright, atau test case lain.