import type { Metadata } from "next";

import { EmptyState, ErrorState } from "@/components/data-state";
import { listProducts } from "@/services/product.service";

import { SaleTerminal } from "./components/sale-terminal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Penjualan",
};

export default async function PenjualanPage() {
  const result = await listProducts({ aktifOnly: true });

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="stack">
          <h1>Penjualan</h1>
          <p className="muted">
            Cari barang aktif, susun keranjang, lalu proses pembayaran.
          </p>
        </div>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Belum ada barang aktif."
          description="Hubungi admin untuk menambah barang."
        />
      ) : (
        <SaleTerminal products={result.data} />
      )}
    </section>
  );
}
