import type { Metadata } from "next";

import { ProductForm } from "../components/product-form";
import { createProductAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tambah Barang",
};

export default function TambahBarangPage() {
  return (
    <section className="stack">
      <h1>Tambah barang</h1>
      <div className="card card-wide">
        <ProductForm action={createProductAction} mode="create" />
      </div>
    </section>
  );
}
