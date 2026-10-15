import type { Metadata } from "next";
import Link from "next/link";

import { ErrorState } from "@/components/data-state";
import { formatRupiah } from "@/lib/business/format";
import { getDashboardSummary } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminHomePage() {
  const summary = await getDashboardSummary();

  return (
    <section className="stack">
      <h1>Selamat datang, Admin</h1>
      <p className="muted">
        Anda masuk dengan role admin. Gunakan menu di atas untuk mengelola
        persediaan.
      </p>

      {!summary.ok ? (
        <ErrorState
          message={`Ringkasan dashboard gagal dimuat. ${summary.error.message}`}
        />
      ) : (
        <div className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">Penjualan hari ini</span>
            <span className="summary-value">
              {formatRupiah(summary.data.totalPenjualanHariIni)}
            </span>
            <span className="muted small-note">
              {summary.data.jumlahTransaksiHariIni} transaksi
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Barang menipis</span>
            <span className="summary-value">{summary.data.jumlahMenipis}</span>
            <span className="muted small-note">
              termasuk {summary.data.jumlahHabis} habis
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Barang habis</span>
            <span className="summary-value">{summary.data.jumlahHabis}</span>
            <span className="muted small-note">stok 0</span>
          </div>
        </div>
      )}

      <div className="link-cards">
        <Link className="link-card" href="/admin/barang">
          <span className="link-card-title">Barang</span>
          <span className="muted">Daftar, tambah, edit, dan nonaktifkan barang.</span>
        </Link>
        <Link className="link-card" href="/admin/barang-masuk">
          <span className="link-card-title">Barang Masuk</span>
          <span className="muted">Catat penerimaan barang ke stok.</span>
        </Link>
        <Link className="link-card" href="/admin/stok">
          <span className="link-card-title">Monitoring Stok</span>
          <span className="muted">Pantau barang menipis dan habis.</span>
        </Link>
        <Link className="link-card" href="/admin/penjualan/riwayat">
          <span className="link-card-title">Riwayat Penjualan</span>
          <span className="muted">Telusuri transaksi seluruh kasir.</span>
        </Link>
      </div>
    </section>
  );
}
