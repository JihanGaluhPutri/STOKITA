Feature: Penjualan kasir (POS)
  Sebagai kasir, saya ingin mencari barang, menyusun keranjang, memilih metode
  pembayaran, dan menyelesaikan transaksi yang menghasilkan struk.

  Scenario: Penjualan tunai menghitung kembalian dan menerbitkan struk
    Given saya login sebagai kasir
    And ada barang berkode "E2E-TUNAI" bernama "Barang Uji Tunai" dengan harga jual 68000 stok 20 stok minimum 5
    When saya membuka halaman penjualan
    And saya cari barang "E2E-TUNAI" lalu tambahkan ke keranjang
    Then total keranjang menampilkan "Rp68.000"
    When saya pilih metode pembayaran "TUNAI"
    And saya isi uang dibayar 100000
    Then saya melihat perkiraan kembalian "Rp32.000"
    When saya selesaikan pembayaran
    Then struk transaksi ditampilkan dengan total "Rp68.000" dan kembalian "Rp32.000"
    And struk menampilkan rincian barang "Barang Uji Tunai" sebanyak 1

  Scenario: Penjualan non-tunai dua unit tanpa kembalian
    Given saya login sebagai kasir
    And ada barang berkode "E2E-NONTUNAI" bernama "Barang Uji Non Tunai" dengan harga jual 17500 stok 30 stok minimum 5
    When saya membuka halaman penjualan
    And saya cari barang "E2E-NONTUNAI" lalu tambahkan ke keranjang
    And saya cari barang "E2E-NONTUNAI" lalu tambahkan ke keranjang
    Then total keranjang menampilkan "Rp35.000"
    When saya pilih metode pembayaran "NON_TUNAI"
    And saya selesaikan pembayaran
    Then struk transaksi ditampilkan dengan total "Rp35.000" dan kembalian "Rp0"

  Scenario: Pembayaran kurang dari total ditolak
    Given saya login sebagai kasir
    And ada barang berkode "E2E-KURANG" bernama "Barang Uji Kurang Bayar" dengan harga jual 50000 stok 10 stok minimum 1
    When saya membuka halaman penjualan
    And saya cari barang "E2E-KURANG" lalu tambahkan ke keranjang
    And saya pilih metode pembayaran "TUNAI"
    And saya isi uang dibayar 1000
    Then saya melihat pesan error "Uang dibayar kurang dari total transaksi."
    When saya selesaikan pembayaran
    Then server menolak pembayaran dengan pesan "Uang dibayar kurang dari total transaksi."

  Scenario: Penjualan muncul di riwayat kasir
    Given saya login sebagai kasir
    And ada barang berkode "E2E-JUAL-RIW" bernama "Barang Uji Riwayat Jual" dengan harga jual 22000 stok 15 stok minimum 2
    When saya membuka halaman penjualan
    And saya cari barang "E2E-JUAL-RIW" lalu tambahkan ke keranjang
    And saya pilih metode pembayaran "NON_TUNAI"
    And saya selesaikan pembayaran
    Then struk transaksi ditampilkan dengan total "Rp22.000" dan kembalian "Rp0"
    When saya buka riwayat penjualan
    Then riwayat penjualan memuat transaksi dengan total "Rp22.000"
