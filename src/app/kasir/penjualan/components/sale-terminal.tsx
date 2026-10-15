"use client";

import { useMemo, useRef, useState } from "react";
import { useActionState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { calculateChange, calculateSubtotal, calculateTotal } from "@/lib/business/payment";
import { formatRupiah } from "@/lib/business/format";
import { MESSAGES } from "@/lib/business/messages";
import type { Product } from "@/types/product";
import type { PaymentMethod } from "@/types/sale";

import { checkoutAction, type CheckoutState } from "../actions";
import { PaymentForm } from "./payment-form";
import { ProductSearch } from "./product-search";
import { SaleCart, type CartItem } from "./sale-cart";
import { SaleReceipt } from "./sale-receipt";

function SaleSession({
  products,
  onNewSale,
}: {
  products: Product[];
  onNewSale: () => void;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metode, setMetode] = useState<PaymentMethod | "">("");
  const [bayar, setBayar] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [checkoutState, checkoutFormAction, pending] = useActionState<
    CheckoutState,
    FormData
  >(checkoutAction, null);

  const totalResult = useMemo(
    () =>
      calculateTotal(
        cart.map((item) => ({ hargaSatuan: item.hargaJual, qty: item.qty })),
      ),
    [cart],
  );
  const total = totalResult.ok ? totalResult.data : 0;

  const cartHasIssue = cart.some(
    (item) =>
      !Number.isInteger(item.qty) ||
      item.qty <= 0 ||
      item.qty > item.stokTersedia,
  );
  const canCheckout =
    cart.length > 0 && !cartHasIssue && metode !== "" && totalResult.ok;

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          kode: product.kode,
          nama: product.nama,
          hargaJual: product.hargaJual,
          stokTersedia: product.stok,
          qty: 1,
        },
      ];
    });
  }

  function changeQty(productId: string, qty: number) {
    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, qty } : item,
      ),
    );
  }

  function removeItem(productId: string) {
    setCart((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }

  if (checkoutState?.receipt) {
    return <SaleReceipt receipt={checkoutState.receipt} onNewSale={onNewSale} />;
  }

  const itemsJson = JSON.stringify(
    cart.map((item) => ({ product_id: item.productId, qty: item.qty })),
  );

  const parsedBayar = metode === "TUNAI" ? Number(bayar) : null;
  const changeResult =
    metode === "TUNAI" && parsedBayar !== null && Number.isInteger(parsedBayar)
      ? calculateChange(parsedBayar, total)
      : null;
  const dibayarDisplay =
    metode === "NON_TUNAI"
      ? formatRupiah(total)
      : parsedBayar !== null && Number.isInteger(parsedBayar)
        ? formatRupiah(parsedBayar)
        : "—";
  const kembalianDisplay =
    metode === "NON_TUNAI"
      ? formatRupiah(0)
      : changeResult && changeResult.ok
        ? formatRupiah(changeResult.data)
        : "—";
  const metodeDisplay =
    metode === "TUNAI" ? "Tunai" : metode === "NON_TUNAI" ? "Non-tunai" : "—";

  return (
    <div className="pos-layout">
      <div className="stack pos-panel">
        <ProductSearch
          products={products}
          onAdd={addToCart}
          disabled={pending}
        />
      </div>

      <div className="stack pos-panel">
        <form action={checkoutFormAction} className="stack" ref={formRef}>
          <input type="hidden" name="items" value={itemsJson} />
          <input type="hidden" name="metodeBayar" value={metode} />
          <input
            type="hidden"
            name="bayar"
            value={metode === "TUNAI" ? bayar : ""}
          />

          <h2>Keranjang</h2>
          <SaleCart items={cart} onQtyChange={changeQty} onRemove={removeItem} />

          <h2>Pembayaran</h2>
          <PaymentForm
            total={total}
            metode={metode}
            bayar={bayar}
            disabled={pending}
            onMetodeChange={(value) => {
              setMetode(value);
              if (value === "NON_TUNAI") setBayar("");
              if (value === "TUNAI" && bayar === "") {
                setBayar(String(total));
              }
            }}
            onBayarChange={setBayar}
          />

          {cartHasIssue ? (
            <p className="field-error" role="alert">
              {MESSAGES.CT002} Periksa kembali qty di keranjang.
            </p>
          ) : null}

          {checkoutState?.error ? (
            <p className="error" role="alert">
              {checkoutState.error}
            </p>
          ) : null}

          <button
            type="button"
            className="button"
            disabled={!canCheckout || pending}
            onClick={() => setConfirmOpen(true)}
          >
            {pending ? "Memproses…" : "Bayar & selesaikan"}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Proses transaksi ini?"
        description="Periksa kembali ringkasan barang dan pembayaran sebelum transaksi disimpan. Stok, harga, total, dan kembalian divalidasi ulang di server."
        confirmLabel="Bayar & selesaikan"
        busy={pending}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setConfirmOpen(false)}
        details={
          <>
            <div className="confirm-items">
              {cart.map((item) => {
                const subtotal = calculateSubtotal(item.hargaJual, item.qty);
                return (
                  <div className="confirm-item" key={item.productId}>
                    <span>
                      {item.nama} × {item.qty}
                    </span>
                    <span>
                      {subtotal.ok ? formatRupiah(subtotal.data) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="confirm-row">
              <span>Total</span>
              <span className="strong">{formatRupiah(total)}</span>
            </div>
            <div className="confirm-row">
              <span>Metode pembayaran</span>
              <span>{metodeDisplay}</span>
            </div>
            <div className="confirm-row">
              <span>Dibayar</span>
              <span>{dibayarDisplay}</span>
            </div>
            <div className="confirm-row">
              <span>Kembalian</span>
              <span>{kembalianDisplay}</span>
            </div>
          </>
        }
      />
    </div>
  );
}

export function SaleTerminal({ products }: { products: Product[] }) {
  const [session, setSession] = useState(0);

  return (
    <SaleSession
      key={session}
      products={products}
      onNewSale={() => setSession((value) => value + 1)}
    />
  );
}
