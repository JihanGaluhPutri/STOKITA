import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/data-state";
import { SaleDetailView } from "@/components/sale-detail-view";
import { getSaleDetail } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rincian Transaksi",
};

export default async function AdminSaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSaleDetail(id);

  if (!result.ok) {
    if (result.error.code === "SALE_NOT_FOUND") {
      notFound();
    }
    return (
      <section className="stack">
        <ErrorState message={result.error.message} />
        <Link className="button button-secondary" href="/admin/penjualan/riwayat">
          Kembali ke riwayat
        </Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="toolbar">
        <h1>Rincian transaksi</h1>
        <Link className="button button-secondary" href="/admin/penjualan/riwayat">
          Kembali ke riwayat
        </Link>
      </div>
      <SaleDetailView sale={result.data} />
    </section>
  );
}
