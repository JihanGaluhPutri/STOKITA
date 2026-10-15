"use client";

import { formatDateTime, formatNumberRupiah, formatRupiah } from "@/lib/business/format";
import type { CheckoutResult } from "@/types/sale";

const METODE_LABEL: Record<CheckoutResult["metode_bayar"], string> = {
  TUNAI: "Tunai",
  NON_TUNAI: "Non-tunai",
};

export function SaleReceipt({
  receipt,
  onNewSale,
}: {
  receipt: CheckoutResult;
  onNewSale: () => void;
}) {
  return (
    <div className="stack">
      <div className="receipt" data-testid="struk">
        <div className="receipt-head">
          <p className="receipt-brand">Stokita</p>
          <p className="receipt-no">{receipt.no_transaksi}</p>
          <p className="muted small-note">{formatDateTime(receipt.tanggal)}</p>
        </div>

        <table className="receipt-table">
          <colgroup>
            <col className="receipt-col-barang" />
            <col className="receipt-col-qty" />
            <col className="receipt-col-harga" />
            <col className="receipt-col-subtotal" />
          </colgroup>
          <thead>
            <tr>
              <th>Barang</th>
              <th className="num">Qty</th>
              <th className="num">Harga</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr key={item.product_id}>
                <td className="receipt-item">
                  <span className="receipt-item-kode">{item.kode}</span>
                  <span className="receipt-item-nama">{item.nama}</span>
                </td>
                <td className="num">{item.qty}</td>
                <td className="num">{formatNumberRupiah(item.harga_satuan)}</td>
                <td className="num">{formatNumberRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-summary">
          <div className="receipt-row">
            <span>Total</span>
            <span>{formatRupiah(receipt.total)}</span>
          </div>
          <div className="receipt-row">
            <span>Metode</span>
            <span>{METODE_LABEL[receipt.metode_bayar]}</span>
          </div>
          <div className="receipt-row">
            <span>Dibayar</span>
            <span>{formatRupiah(receipt.bayar)}</span>
          </div>
          <div className="receipt-row">
            <span>Kembalian</span>
            <span>{formatRupiah(receipt.kembalian)}</span>
          </div>
        </div>

        <p className="receipt-footer muted small-note">
          Terima kasih atas kunjungan Anda.
        </p>
      </div>

      <div className="row-actions no-print">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => window.print()}
        >
          Cetak struk
        </button>
        <button type="button" className="button" onClick={onNewSale}>
          Transaksi baru
        </button>
      </div>
    </div>
  );
}
