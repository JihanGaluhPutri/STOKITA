Feature: Kelola barang
  Sebagai admin, saya ingin menambah, mengubah, menonaktifkan, dan menghapus
  barang melalui halaman Barang.

  Scenario: Menambah barang baru
    Given saya login sebagai admin
    When saya tambah barang berkode "E2E-TAMBAH" bernama "Barang Uji Tambah" dengan harga beli 9000 harga jual 10000 stok awal 7 stok minimum 2
    Then banner sukses menampilkan "Barang berhasil ditambahkan."
    And saya membuka halaman "/admin/barang"
    And barang berkode "E2E-TAMBAH" muncul di daftar dengan stok 7

  Scenario: Kode barang duplikat ditolak
    Given saya login sebagai admin
    And ada barang berkode "E2E-DUP" bernama "Barang Uji Duplikat" dengan harga jual 5000 stok 3 stok minimum 1
    When saya tambah barang berkode "E2E-DUP" bernama "Barang Duplikat Kedua" dengan harga beli 1000 harga jual 2000 stok awal 1 stok minimum 1
    Then saya melihat pesan error "Kode barang sudah digunakan."

  Scenario: Mengubah data barang
    Given saya login sebagai admin
    And ada barang berkode "E2E-EDIT" bernama "Barang Uji Edit" dengan harga jual 5000 stok 3 stok minimum 1
    When saya ubah nama barang berkode "E2E-EDIT" menjadi "Barang Uji Edit Baru" dengan harga jual 12000
    Then banner sukses menampilkan "Perubahan barang berhasil disimpan."
    And saya membuka halaman "/admin/barang"
    And barang berkode "E2E-EDIT" muncul di daftar dengan stok 3
    And saya melihat teks "Barang Uji Edit Baru"

  Scenario: Menonaktifkan barang
    Given saya login sebagai admin
    And ada barang berkode "E2E-NONAKTIF" bernama "Barang Uji Nonaktif" dengan harga jual 4000 stok 2 stok minimum 1
    When saya nonaktifkan barang berkode "E2E-NONAKTIF"
    Then banner sukses menampilkan "Barang berhasil dinonaktifkan."
    And barang berkode "E2E-NONAKTIF" menampilkan status "Nonaktif"

  Scenario: Menghapus barang yang belum memiliki riwayat
    Given saya login sebagai admin
    And ada barang berkode "E2E-HAPUS" bernama "Barang Uji Hapus" dengan harga jual 3000 stok 1 stok minimum 1
    When saya hapus barang berkode "E2E-HAPUS"
    Then banner sukses menampilkan "Barang berhasil dihapus."
    And barang berkode "E2E-HAPUS" tidak lagi ada di daftar
