import { After, BeforeAll } from "../fixtures";
import { bersihkanBarangUji } from "../support/api";

/**
 * Pemanasan: menyentuh seluruh rute utama sekali agar Next.js dev server
 * mengompilasinya lebih dulu — langkah pertama tiap skenario jadi cepat.
 */
BeforeAll(async () => {
  const base = `http://localhost:${process.env.PORT ?? "3000"}`;
  const routes = [
    "/login",
    "/admin",
    "/admin/barang",
    "/admin/barang/tambah",
    "/admin/barang-masuk",
    "/admin/barang-masuk/riwayat",
    "/admin/stok",
    "/admin/penjualan/riwayat",
    "/kasir",
    "/kasir/penjualan",
    "/kasir/penjualan/riwayat",
  ];
  await Promise.all(
    routes.map(async (route) => {
      try {
        await fetch(base + route, { redirect: "manual" });
      } catch {
        // diabaikan — pemanasan hanya pengoptimalan, bukan asersi
      }
    }),
  );
});

/**
 * Pembersihan otomatis setelah setiap skenario: barang uji (awalan "E2E-"),
 * penjualan uji, dan mutasi stoknya dihapus dari database sehingga suite
 * dapat dijalankan berulang tanpa meninggalkan sampah data.
 *
 * Kegagalan pembersihan TIDAK menggagalkan test — hanya dicatat ke log.
 */
After(async ({ skenario }) => {
  const kodes = [skenario.kode].filter(Boolean) as string[];
  for (const kode of kodes) {
    try {
      await bersihkanBarangUji(kode);
    } catch (error) {
      console.warn(
        `[bdd] pembersihan ${kode} gagal:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
});
