Feature: Autentikasi dan sesi pengguna
  Sebagai admin atau kasir, saya ingin masuk ke Stokita dengan kredensial yang
  benar, melihat halaman sesuai role, lalu keluar dengan aman.

  Scenario: Admin berhasil masuk dan tiba di dashboard admin
    Given saya membuka halaman "/login"
    When saya login sebagai admin
    Then saya diarahkan ke "/admin"
    And saya melihat teks "Selamat datang, Admin"

  Scenario: Kasir berhasil masuk dan tiba di halaman kasir
    Given saya membuka halaman "/login"
    When saya login sebagai kasir
    Then saya diarahkan ke "/kasir"
    And saya melihat teks "Selamat datang, Kasir"

  Scenario: Password salah ditolak dengan pesan yang jelas
    Given saya membuka halaman "/login"
    When saya isi username "admin" dan password "bukan-password" lalu tekan Masuk
    Then saya melihat pesan error "Username atau password salah."
    And saya tetap berada di halaman "/login"

  Scenario: Keluar dari aplikasi mengakhiri sesi
    Given saya membuka halaman "/login"
    When saya login sebagai admin
    And saya keluar dari aplikasi
    Then saya diarahkan ke "/login"
