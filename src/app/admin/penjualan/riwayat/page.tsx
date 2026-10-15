import type { Metadata } from "next";

import { SaleHistoryView } from "@/components/sale-history";
import { listSalesHistory } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Penjualan",
};

export default async function AdminSalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tanggalAwal?: string; tanggalAkhir?: string }>;
}) {
  const params = await searchParams;
  const tanggalAwal = typeof params.tanggalAwal === "string" ? params.tanggalAwal : "";
  const tanggalAkhir = typeof params.tanggalAkhir === "string" ? params.tanggalAkhir : "";

  const result = await listSalesHistory({ tanggalAwal, tanggalAkhir });
  const invalid =
    !result.ok &&
    (result.error.code === "DATE_INVALID" ||
      result.error.code === "DATE_RANGE_INVALID" ||
      result.error.code === "DATE_FILTER_INCOMPLETE");

  return (
    <section className="stack">
      <div className="stack">
        <h1>Riwayat penjualan</h1>
        <p className="muted">
          Transaksi seluruh kasir. Gunakan filter tanggal untuk periode
          tertentu; batas hari mengikuti zona waktu bisnis.
        </p>
      </div>

      <SaleHistoryView
        action="/admin/penjualan/riwayat"
        showKasir
        items={result.ok ? result.data : []}
        filterAwal={tanggalAwal}
        filterAkhir={tanggalAkhir}
        error={invalid ? result.error.message : !result.ok ? result.error.message : undefined}
      />
    </section>
  );
}
