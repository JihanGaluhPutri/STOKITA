import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/data-state";
import { STOCK_STATUS_LABEL } from "@/lib/business/stock-status";
import { listStockMonitoring } from "@/services/stock.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monitoring Stok",
};

export default async function StokPage() {
  const result = await listStockMonitoring();

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="stack">
          <h1>Monitoring stok</h1>
          <p className="muted">
            Barang aktif dengan stok kurang dari atau sama dengan stok minimum.
            Status ditentukan dari nilai stok terkini di database.
          </p>
        </div>
        <Link className="button button-secondary" href="/admin/stok/riwayat">
          Riwayat pergerakan stok
        </Link>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Semua stok aman."
          description="Tidak ada barang aktif yang menipis atau habis."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th className="num">Stok</th>
                <th className="num">Stok min.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr key={item.id}>
                  <td>{item.kode}</td>
                  <td>{item.nama}</td>
                  <td className="num">{item.stok}</td>
                  <td className="num">{item.stokMin}</td>
                  <td>
                    {item.status === "HABIS" ? (
                      <span className="badge badge-danger">
                        {STOCK_STATUS_LABEL.HABIS}
                      </span>
                    ) : (
                      <span className="badge badge-warn">
                        {STOCK_STATUS_LABEL.MENIPIS}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
