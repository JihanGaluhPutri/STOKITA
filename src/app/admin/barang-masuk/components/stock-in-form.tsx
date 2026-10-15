"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";

import type { StockInFormState } from "@/app/admin/barang-masuk/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Product } from "@/types/product";

import { stockInAction } from "../actions";

export function StockInForm({ products }: { products: Product[] }) {
  const [state, formAction, pending] = useActionState<StockInFormState, FormData>(
    stockInAction,
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [summary, setSummary] = useState<{
    label: string;
    qty: number;
    stokSebelum: number;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const done = Boolean(state?.success);

  function openConfirm() {
    if (done || !formRef.current?.reportValidity()) return;
    const formData = new FormData(formRef.current);
    const product = products.find(
      (item) => item.id === formData.get("productId"),
    );
    const qty = Number(formData.get("qty"));
    if (!product || !Number.isInteger(qty) || qty <= 0) return;
    setSummary({
      label: `${product.kode} — ${product.nama}`,
      qty,
      stokSebelum: product.stok,
    });
    setConfirmOpen(true);
  }

  return (
    <form action={formAction} className="form" ref={formRef}>
      <div className="field">
        <label className="label" htmlFor="productId">
          Barang
        </label>
        <select
          className="input"
          id="productId"
          name="productId"
          required
          disabled={Boolean(state?.success)}
          defaultValue=""
        >
          <option value="" disabled>
            Pilih barang…
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.kode} — {product.nama} (stok {product.stok})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label" htmlFor="qty">
          Jumlah masuk
        </label>
        <input
          className="input"
          id="qty"
          name="qty"
          type="number"
          min={1}
          step={1}
          required
          disabled={Boolean(state?.success)}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="referensi">
          Referensi (opsional)
        </label>
        <input
          className="input"
          id="referensi"
          name="referensi"
          type="text"
          placeholder="Mis. Nota beli #123"
          disabled={Boolean(state?.success)}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="catatan">
          Catatan (opsional)
        </label>
        <textarea
          className="input"
          id="catatan"
          name="catatan"
          rows={2}
          disabled={Boolean(state?.success)}
        />
      </div>

      {state?.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <div className="banner banner-ok" role="status">
          <p>
            Barang masuk tercatat (qty {state.success.qty}). Stok:{" "}
            {state.success.stokSebelum} → {state.success.stokSesudah}.
          </p>
          <Link className="button button-secondary button-small" href="/admin/barang-masuk/riwayat">
            Lihat riwayat
          </Link>
        </div>
      ) : null}

      <div className="row-actions">
        <button
          type="button"
          className="button"
          onClick={openConfirm}
          disabled={pending || done}
        >
          {pending ? "Menyimpan…" : "Catat barang masuk"}
        </button>
        {state?.success ? (
          <Link className="button button-secondary" href="/admin/barang-masuk">
            Catat lagi
          </Link>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Catat barang masuk?"
        description={
          summary
            ? `“${summary.label}” akan bertambah ${summary.qty} unit. Stok: ${summary.stokSebelum} → ${summary.stokSebelum + summary.qty}.`
            : undefined
        }
        confirmLabel="Catat barang masuk"
        busy={pending}
        onConfirm={() => {
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </form>
  );
}
