import type { Metadata } from "next";

import { SaleHistoryView } from "@/components/sale-history";
import { listSalesHistory } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Penjualan",
};

export default async function KasirSalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tanggalAwal?: string; tanggalAkhir?: string }>;
}) {
  const params = await searchParams;
  const tanggalAwal = typeof params.tanggalAwal === "string" ? params.tanggalAwal : "";
  const tanggalAkhir = typeof params.tanggalAkhir === "string" ? params.tanggalAkhir : "";

  // Pembatasan ke transaksi sendiri diterapkan di service (eq kasir_id) + RLS.
  const result = await listSalesHistory({ tanggalAwal, tanggalAkhir });

  return (
    <section className="stack">
      <div className="stack">
        <h1>Riwayat penjualan</h1>
        <p className="muted">
          Transaksi milik Anda. Gunakan filter tanggal untuk periode tertentu;
          batas hari mengikuti zona waktu bisnis.
        </p>
      </div>

      <SaleHistoryView
        action="/kasir/penjualan/riwayat"
        showKasir={false}
        items={result.ok ? result.data : []}
        filterAwal={tanggalAwal}
        filterAkhir={tanggalAkhir}
        error={!result.ok ? result.error.message : undefined}
      />
    </section>
  );
}
