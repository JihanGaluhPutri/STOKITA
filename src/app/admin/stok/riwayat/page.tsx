import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/data-state";
import { formatDateTime } from "@/lib/business/format";
import { listStockMovements } from "@/services/stock.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Pergerakan Stok",
};

export default async function StockMovementHistoryPage() {
  const result = await listStockMovements();

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="stack">
          <h1>Riwayat pergerakan stok</h1>
          <p className="muted">
            Catatan IN (barang masuk) dan OUT (penjualan) dari tabel
            stock_movements. Tidak tersedia aksi perubahan.
          </p>
        </div>
        <Link className="button button-secondary" href="/admin/stok">
          Monitoring stok
        </Link>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Belum ada pergerakan stok."
          description="Barang masuk dan penjualan yang tercatat akan muncul di sini."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>Tipe</th>
                <th className="num">Qty</th>
                <th>Referensi</th>
                <th>Catatan</th>
                <th>Dicatat oleh</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.tanggal)}</td>
                  <td>
                    {item.productKode} — {item.productNama}
                  </td>
                  <td>
                    {item.tipe === "IN" ? (
                      <span className="badge badge-ok">IN</span>
                    ) : (
                      <span className="badge badge-warn">OUT</span>
                    )}
                  </td>
                  <td className="num">{item.qty}</td>
                  <td>{item.referensi ?? "-"}</td>
                  <td>{item.catatan ?? "-"}</td>
                  <td>{item.pembuatNama}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
