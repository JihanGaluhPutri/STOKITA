import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/data-state";
import { formatRupiah } from "@/lib/business/format";
import { STOCK_STATUS_LABEL, resolveStockStatus } from "@/lib/business/stock-status";
import { listProducts } from "@/services/product.service";
import type { Product } from "@/types/product";

import { DeleteProductButton } from "./components/delete-product-button";
import { ProductStatusButton } from "./components/product-status-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Barang",
};

function StockBadges({ product }: { product: Product }) {
  const status = resolveStockStatus(product.stok, product.stokMin);
  return (
    <span className="badge-group">
      {!product.aktif ? <span className="badge badge-muted">Nonaktif</span> : null}
      {status === "HABIS" ? (
        <span className="badge badge-danger">Habis</span>
      ) : null}
      {status === "MENIPIS" ? (
        <span className="badge badge-warn">Menipis</span>
      ) : null}
      {product.aktif && status === "AMAN" ? (
        <span className="badge">Aktif</span>
      ) : null}
    </span>
  );
}

function OkBanner({ code }: { code: string }) {
  const texts: Record<string, string> = {
    created: "Barang berhasil ditambahkan.",
    updated: "Perubahan barang berhasil disimpan.",
    activated: "Barang berhasil diaktifkan.",
    deactivated: "Barang berhasil dinonaktifkan.",
    deleted: "Barang berhasil dihapus.",
  };
  const text = texts[code];
  if (!text) return null;
  return (
    <p className="banner banner-ok" role="status">
      {text}
    </p>
  );
}

export default async function BarangPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const result = await listProducts({ q });

  return (
    <section className="stack">
      <div className="toolbar">
        <div className="stack">
          <h1>Barang</h1>
          <p className="muted">Kelola data barang dan pantau kondisi stok.</p>
        </div>
        <Link className="button" href="/admin/barang/tambah">
          Tambah barang
        </Link>
      </div>

      <OkBanner code={typeof params.ok === "string" ? params.ok : ""} />

      <form className="search-form" method="get" action="/admin/barang">
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Cari kode atau nama barang…"
          defaultValue={q}
          aria-label="Cari barang"
        />
        <button type="submit" className="button button-secondary">
          Cari
        </button>
      </form>

      {!result.ok ? (
        <ErrorState message={result.error.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          title={q ? "Tidak ada barang yang cocok." : "Belum ada barang."}
          description={
            q
              ? "Coba kata kunci lain."
              : "Tambahkan barang pertama Anda."
          }
        />
      ) : (
        <>
          <p className="muted">
            {result.data.length} barang ditemukan
            {q ? ` untuk pencarian “${q}”` : ""}.
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th className="num">Harga beli</th>
                  <th className="num">Harga jual</th>
                  <th className="num">Stok</th>
                  <th className="num">Stok min.</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((product) => (
                  <tr key={product.id}>
                    <td>{product.kode}</td>
                    <td>{product.nama}</td>
                    <td className="num">{formatRupiah(product.hargaBeli)}</td>
                    <td className="num">{formatRupiah(product.hargaJual)}</td>
                    <td className="num">{product.stok}</td>
                    <td className="num">{product.stokMin}</td>
                    <td>
                      <StockBadges product={product} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          className="button button-secondary button-small"
                          href={`/admin/barang/${product.id}/edit`}
                        >
                          Edit
                        </Link>
                        <ProductStatusButton
                          productId={product.id}
                          aktif={product.aktif}
                          kode={product.kode}
                          nama={product.nama}
                        />
                        <DeleteProductButton
                          productId={product.id}
                          kode={product.kode}
                          nama={product.nama}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="muted small-note">
        Status {STOCK_STATUS_LABEL.HABIS} = stok 0; {STOCK_STATUS_LABEL.MENIPIS}{" "}
        = stok di bawah atau sama dengan stok minimum.
      </p>
    </section>
  );
}
