import type { Metadata } from "next";

import { EmptyState, ErrorState } from "@/components/data-state";
import { formatDateTime } from "@/lib/business/format";
import { listStockInHistory } from "@/services/stock.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Barang Masuk",
};

export default async function RiwayatBarangMasukPage() {
  const result = await listStockInHistory();

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="stack">
          <h1>Riwayat barang masuk</h1>
          <p className="muted">
            Mutasi stok bertipe IN, terbaru di atas (maksimal 100 catatan).
          </p>
        </div>
      </div>

      {!result.ok ? (
        <ErrorState message={result.error.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Belum ada barang masuk tercatat."
          description="Catat barang masuk untuk membangun riwayat."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Barang</th>
                <th className="num">Jumlah</th>
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
                  <td className="num">{item.qty}</td>
                  <td>{item.referensi ?? "—"}</td>
                  <td>{item.catatan ?? "—"}</td>
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
