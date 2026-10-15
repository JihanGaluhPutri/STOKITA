import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kasir",
};

export default function KasirHomePage() {
  return (
    <section className="stack">
      <h1>Selamat datang, Kasir</h1>
      <p className="muted">
        Anda masuk dengan role kasir. Gunakan menu di atas untuk melayani
        penjualan.
      </p>
      <div className="link-cards">
        <Link className="link-card" href="/kasir/penjualan">
          <span className="link-card-title">Penjualan</span>
          <span className="muted">
            Cari barang, susun keranjang, dan proses pembayaran.
          </span>
        </Link>
      </div>
    </section>
  );
}
