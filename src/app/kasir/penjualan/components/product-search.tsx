"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/data-state";
import { formatRupiah } from "@/lib/business/format";
import { STOCK_STATUS_LABEL, resolveStockStatus } from "@/lib/business/stock-status";
import type { Product } from "@/types/product";

export function ProductSearch({
  products,
  onAdd,
  disabled,
}: {
  products: Product[];
  onAdd: (product: Product) => void;
  disabled: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term === "") return products;
    return products.filter(
      (product) =>
        product.kode.toLowerCase().includes(term) ||
        product.nama.toLowerCase().includes(term),
    );
  }, [products, q]);

  return (
    <div className="stack pos-search">
      <label className="label" htmlFor="cari-barang">
        Cari barang
      </label>
      <input
        className="input"
        id="cari-barang"
        type="search"
        placeholder="Ketik kode atau nama barang…"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada barang yang cocok."
          description="Coba kata kunci lain."
        />
      ) : (
        <ul className="pos-list">
          {filtered.map((product) => {
            const status = resolveStockStatus(product.stok, product.stokMin);
            const habis = product.stok <= 0;
            return (
              <li key={product.id} className="pos-item">
                <div className="stack">
                  <span>
                    <strong>{product.kode}</strong> — {product.nama}
                  </span>
                  <span className="muted small-note">
                    {formatRupiah(product.hargaJual)} · stok {product.stok}
                    {status === "MENIPIS"
                      ? ` · ${STOCK_STATUS_LABEL.MENIPIS}`
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="button button-small"
                  disabled={disabled || habis}
                  onClick={() => onAdd(product)}
                >
                  {habis ? "Stok habis" : "Tambah"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
