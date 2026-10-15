import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/data-state";
import { listProducts } from "@/services/product.service";

import { StockInForm } from "./components/stock-in-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Barang Masuk",
};

export default async function BarangMasukPage() {
  const result = await listProducts({ aktifOnly: true });

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="stack">
          <h1>Barang masuk</h1>
          <p className="muted">
            Catat penerimaan barang. Stok bertambah melalui satu operasi yang
            atomik.
          </p>
        </div>
        <Link className="button button-secondary" href="/admin/barang-masuk/riwayat">
          Riwayat barang masuk
        </Link>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Belum ada barang aktif."
          description="Tambahkan barang terlebih dahulu sebelum mencatat barang masuk."
        />
      ) : (
        <div className="card card-wide">
          <StockInForm products={result.data} />
        </div>
      )}
    </section>
  );
}
