Feature: Barang masuk dan monitoring stok
  Sebagai admin, saya ingin mencatat penerimaan barang sehingga stok bertambah
  dan tercatat di riwayat, serta memantau barang yang menipis.

  Scenario: Barang masuk menambah stok barang
    Given saya login sebagai admin
    And ada barang berkode "E2E-MASUK" bernama "Barang Uji Masuk" dengan harga jual 8000 stok 5 stok minimum 10
    When saya catat barang masuk 12 unit untuk barang berkode "E2E-MASUK"
    Then banner sukses menampilkan "Barang masuk tercatat (qty 12). Stok: 5 → 17."
    And saya membuka halaman "/admin/barang"
    And barang berkode "E2E-MASUK" muncul di daftar dengan stok 17

  Scenario: Barang masuk tercatat di riwayat
    Given saya login sebagai admin
    And ada barang berkode "E2E-RIWAYAT" bernama "Barang Uji Riwayat" dengan harga jual 6000 stok 10 stok minimum 2
    When saya catat barang masuk 5 unit untuk barang berkode "E2E-RIWAYAT"
    And saya buka riwayat barang masuk
    Then riwayat barang masuk memuat barang berkode "E2E-RIWAYAT" sejumlah 5

  Scenario: Barang yang stoknya kembali aman hilang dari monitoring
    Given saya login sebagai admin
    And ada barang berkode "E2E-STOK" bernama "Barang Uji Monitoring" dengan harga jual 7000 stok 4 stok minimum 10
    When saya membuka halaman "/admin/stok"
    Then barang berkode "E2E-STOK" terdaftar di monitoring stok
    And saya catat barang masuk 20 unit untuk barang berkode "E2E-STOK"
    And saya membuka halaman "/admin/stok"
    And barang berkode "E2E-STOK" tidak terdaftar di monitoring stok
