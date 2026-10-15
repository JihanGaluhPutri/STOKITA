import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/data-state";
import { formatRupiah, formatDateTime } from "@/lib/business/format";
import type { SalesHistoryItem } from "@/types/history";

/**
 * TB-22/TB-23: tampilan riwayat penjualan (daftar + filter tanggal GET).
 * Dipakai halaman admin (seluruh kasir) dan kasir (miliknya sendiri);
 * pembatasan data sudah diterapkan di service/RLS, bukan di komponen ini.
 */
export function SaleHistoryView({
  items,
  action,
  showKasir,
  filterAwal,
  filterAkhir,
  error,
}: {
  items: SalesHistoryItem[];
  action: string;
  showKasir: boolean;
  filterAwal: string;
  filterAkhir: string;
  error?: string;
}) {
  return (
    <>
      <form className="filter-form" method="get" action={action}>
        <label className="filter-field">
          <span className="filter-label">Tanggal awal</span>
          <input
            className="input"
            type="date"
            name="tanggalAwal"
            defaultValue={filterAwal}
            aria-label="Tanggal awal"
          />
        </label>
        <label className="filter-field">
          <span className="filter-label">Tanggal akhir</span>
          <input
            className="input"
            type="date"
            name="tanggalAkhir"
            defaultValue={filterAkhir}
            aria-label="Tanggal akhir"
          />
        </label>
        <div className="filter-actions">
          <button type="submit" className="button button-secondary">
            Terapkan filter
          </button>
          <Link className="button button-secondary" href={action}>
            Semua tanggal
          </Link>
        </div>
      </form>

      {error ? <ErrorState message={error} /> : null}

      {!error && items.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi."
          description="Belum ada penjualan pada rentang tanggal yang dipilih."
        />
      ) : null}

      {!error && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>No. transaksi</th>
                <th>Tanggal</th>
                {showKasir ? <th>Kasir</th> : null}
                <th className="num">Total</th>
                <th>Metode</th>
                <th>Rincian</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.noTransaksi}</td>
                  <td>{formatDateTime(item.tanggal)}</td>
                  {showKasir ? <td>{item.kasirNama}</td> : null}
                  <td className="num">{formatRupiah(item.total)}</td>
                  <td>{item.metodeBayar === "TUNAI" ? "Tunai" : "Non-tunai"}</td>
                  <td>
                    <Link
                      className="button button-secondary button-small"
                      href={`${action}/${item.id}`}
                    >
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
