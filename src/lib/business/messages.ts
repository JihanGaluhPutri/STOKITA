/**
 * Katalog pesan bisnis Stokita.
 *
 * Kode dua/lima karakter di bawah dipakai sebagai SQLSTATE kustom oleh fungsi
 * PostgreSQL `add_stock_in` dan `checkout_sale`. Daftar ini adalah sumber
 * kebenaran pesan di sisi aplikasi; teks yang sama ditulis pada file migrasi
 * 004/005 dan WAJIB disinkronkan bila ada perubahan.
 */
export const MESSAGES = {
  // Sesi & otorisasi
  AU001: "Sesi Anda tidak valid. Silakan login kembali.",
  AC001: "Anda tidak memiliki akses untuk mencatat barang masuk.",
  AC002: "Anda tidak memiliki akses untuk melakukan penjualan.",
  ACCESS: "Anda tidak memiliki akses untuk melakukan operasi ini.",
  PAGE_ACCESS: "Anda tidak memiliki akses ke halaman ini.",

  // Login & logout (level aplikasi, bukan SQLSTATE)
  USERNAME_REQUIRED: "Username wajib diisi.",
  PASSWORD_REQUIRED: "Password wajib diisi.",
  AUTH_INVALID: "Username atau password salah.",
  AUTH_PROFILE_INVALID:
    "Akun tidak memiliki profil yang valid. Hubungi administrator.",
  LOGIN_FAILED: "Login gagal. Silakan coba lagi.",
  LOGOUT_FAILED: "Logout gagal. Silakan coba lagi.",

  // Barang masuk
  IN001: "Jumlah barang masuk harus berupa bilangan bulat lebih dari 0.",
  IN002: "Barang tidak ditemukan atau sudah tidak aktif.",

  // Pembayaran
  PY001: "Pilih metode pembayaran terlebih dahulu.",
  PY002: "Uang dibayar tidak valid.",
  PY003: "Uang dibayar kurang dari total transaksi.",

  // Keranjang & checkout
  CT001: "Keranjang masih kosong.",
  CT002: "Qty harus berupa bilangan bulat lebih dari 0.",
  CT003: "Barang tidak ditemukan atau sudah tidak aktif.",
  ST001: "Stok barang tidak mencukupi.",

  // Pemetaan SQLSTATE bawaan PostgreSQL/PostgREST
  OVERFLOW: "Nilai melebihi batas yang diizinkan.",
  DUPLICATE: "Data duplikat. Silakan coba lagi.",
  INVALID_INPUT: "Data yang dikirim tidak valid.",
  FK_HISTORY: "Barang memiliki riwayat dan tidak dapat dihapus permanen.",

  // Barang
  PRODUCT_KODE_DUPLICATE: "Kode barang sudah digunakan.",
  PRODUCT_NOT_FOUND: "Barang tidak ditemukan.",

  // Riwayat penjualan (level aplikasi, bukan SQLSTATE)
  SALE_NOT_FOUND: "Transaksi tidak ditemukan.",
  DATE_FILTER_INCOMPLETE: "Isi tanggal awal dan tanggal akhir untuk memfilter.",

  // Perhitungan & error umum
  CALC: "Perhitungan transaksi tidak valid.",
  GENERIC: "Terjadi kesalahan saat memproses data. Silakan coba lagi.",
} as const;

export type MessageCode = keyof typeof MESSAGES;
