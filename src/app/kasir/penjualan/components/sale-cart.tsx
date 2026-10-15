"use client";

import { EmptyState } from "@/components/data-state";
import { calculateSubtotal, calculateTotal } from "@/lib/business/payment";
import { formatRupiah } from "@/lib/business/format";
import { MESSAGES } from "@/lib/business/messages";

export type CartItem = {
  productId: string;
  kode: string;
  nama: string;
  hargaJual: number;
  stokTersedia: number;
  qty: number;
};

export function SaleCart({
  items,
  onQtyChange,
  onRemove,
}: {
  items: CartItem[];
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Keranjang masih kosong."
        description="Tambahkan barang dari daftar pencarian."
      />
    );
  }

  const total = calculateTotal(
    items.map((item) => ({ hargaSatuan: item.hargaJual, qty: item.qty })),
  );

  return (
    <div className="stack">
      <ul className="cart-list">
        {items.map((item) => {
          const subtotal = calculateSubtotal(item.hargaJual, item.qty);
          const qtyInvalid =
            !Number.isInteger(item.qty) ||
            item.qty <= 0 ||
            !subtotal.ok;
          const overStock = item.qty > item.stokTersedia;

          return (
            <li key={item.productId} className="cart-item">
              <div className="stack cart-item-info">
                <span>
                  <strong>{item.kode}</strong> — {item.nama}
                </span>
                <span className="muted small-note">
                  {formatRupiah(item.hargaJual)} × {item.qty} ={" "}
                  {subtotal.ok ? formatRupiah(subtotal.data) : "—"}
                </span>
                {qtyInvalid ? (
                  <span className="field-error" role="alert">
                    {MESSAGES.CT002}
                  </span>
                ) : null}
                {overStock ? (
                  <span className="field-error" role="alert">
                    Qty melebihi stok tersedia ({item.stokTersedia}).
                  </span>
                ) : null}
              </div>
              <div className="cart-item-controls">
                <input
                  className="input input-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={item.qty}
                  aria-label={`Qty ${item.nama}`}
                  onChange={(event) =>
                    onQtyChange(item.productId, Number(event.target.value))
                  }
                />
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => onRemove(item.productId)}
                >
                  Hapus
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cart-total">
        <span className="label">Total</span>
        <span className="cart-total-value">
          {total.ok ? formatRupiah(total.data) : "—"}
        </span>
      </div>
    </div>
  );
}
