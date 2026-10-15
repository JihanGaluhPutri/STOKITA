import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductById } from "@/services/product.service";

import { ProductForm } from "../../components/product-form";
import { updateProductAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Barang",
};

export default async function EditBarangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductById(id);
  if (!result.ok) {
    notFound();
  }
  const product = result.data;

  return (
    <section className="stack">
      <h1>Edit barang</h1>
      <p className="muted">
        {product.kode} — {product.nama}
      </p>
      <div className="card card-wide">
        <ProductForm
          action={updateProductAction.bind(null, product.id)}
          mode="edit"
          defaultValues={{
            kode: product.kode,
            nama: product.nama,
            hargaBeli: String(product.hargaBeli),
            hargaJual: String(product.hargaJual),
          }}
        />
      </div>
    </section>
  );
}
