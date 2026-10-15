import { formatRupiah, formatDateTime } from "@/lib/business/format";
import type { SaleDetail } from "@/types/history";

/**
 * TB-22 / PB-RWY-02: rincian transaksi — item, kuantitas, harga satuan,
 * subtotal, total, metode pembayaran, bayar, dan kembalian.
 */
export function SaleDetailView({ sale }: { sale: SaleDetail }) {
  return (
    <div className="detail-panel stack">
      <dl className="detail-list">
        <div>
          <dt>No. transaksi</dt>
          <dd>{sale.noTransaksi}</dd>
        </div>
        <div>
          <dt>Tanggal</dt>
          <dd>{formatDateTime(sale.tanggal)}</dd>
        </div>
        <div>
          <dt>Kasir</dt>
          <dd>{sale.kasirNama}</dd>
        </div>
        <div>
          <dt>Metode pembayaran</dt>
          <dd>{sale.metodeBayar === "TUNAI" ? "Tunai" : "Non-tunai"}</dd>
        </div>
        <div>
          <dt>Uang dibayar</dt>
          <dd>{formatRupiah(sale.bayar)}</dd>
        </div>
        <div>
          <dt>Kembalian</dt>
          <dd>{formatRupiah(sale.kembalian)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="strong">{formatRupiah(sale.total)}</dd>
        </div>
      </dl>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Barang</th>
              <th className="num">Qty</th>
              <th className="num">Harga satuan</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={`${item.productKode}-${index}`}>
                <td>{item.productKode}</td>
                <td>{item.productNama}</td>
                <td className="num">{item.qty}</td>
                <td className="num">{formatRupiah(item.hargaSatuan)}</td>
                <td className="num">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
