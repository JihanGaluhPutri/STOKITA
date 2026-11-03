Feature: Otorisasi berbasis role
  Setiap pengguna hanya boleh mengakses halaman milik role-nya; pengunjung
  tanpa sesi selalu diarahkan ke halaman login.

  Scenario: Kasir tidak dapat membuka halaman admin
    Given saya login sebagai kasir
    When saya membuka halaman "/admin"
    Then saya melihat teks "Akses ditolak"
    And saya melihat teks "Anda tidak memiliki akses ke halaman ini."

  Scenario: Admin tidak dapat membuka halaman kasir
    Given saya login sebagai admin
    When saya membuka halaman "/kasir"
    Then saya melihat teks "Akses ditolak"

  Scenario: Pengunjung tanpa sesi dialihkan ke halaman login
    Given saya belum login
    When saya membuka halaman "/admin"
    Then saya diarahkan ke "/login"
