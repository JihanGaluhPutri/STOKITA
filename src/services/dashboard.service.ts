import "server-only";

import { getBusinessDayBounds } from "@/lib/business/date-range";
import { MESSAGES } from "@/lib/business/messages";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ok, type Result } from "@/types/result";
import type { DashboardSummary } from "@/types/history";
import { mapSupabaseError, reportServiceError } from "./errors";

/**
 * TB-20 / PB-STOK-03: ringkasan dashboard admin — jumlah barang menipis
 * (termasuk habis, dapat dibedakan) dan total penjualan hari ini menurut
 * zona waktu bisnis. Nilai bersumber dari database; penjualan dihitung dari
 * baris sales murni (tanpa join) sehingga transaksi tidak tergandakan.
 * Hanya admin; RLS juga membatasi.
 */
export async function getDashboardSummary(): Promise<Result<DashboardSummary>> {
  const auth = await requireRole("admin");
  if (!auth.ok) {
    return {
      ok: false,
      error:
        auth.error.code === "AU001"
          ? auth.error
          : { code: "ACCESS", message: MESSAGES.ACCESS },
    };
  }

  const supabase = await createClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("stok, stok_min")
    .eq("aktif", true);

  if (productsError) {
    reportServiceError("getDashboardSummary.products", productsError);
    return { ok: false, error: mapSupabaseError(productsError) };
  }

  let jumlahMenipis = 0;
  let jumlahHabis = 0;
  for (const raw of products ?? []) {
    const row = raw as { stok?: unknown; stok_min?: unknown };
    const stok = Number(row.stok);
    const stokMin = Number(row.stok_min);
    if (stok <= stokMin) {
      jumlahMenipis += 1; // mencakup barang habis (PB-STOK-03)
    }
    if (stok === 0) {
      jumlahHabis += 1;
    }
  }

  const { startIso, endExclusiveIso } = getBusinessDayBounds();
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("total")
    .gte("tanggal", startIso)
    .lt("tanggal", endExclusiveIso);

  if (salesError) {
    reportServiceError("getDashboardSummary.sales", salesError);
    return { ok: false, error: mapSupabaseError(salesError) };
  }

  let totalPenjualanHariIni = 0;
  let jumlahTransaksiHariIni = 0;
  for (const raw of sales ?? []) {
    const row = raw as { total?: unknown };
    totalPenjualanHariIni += Number(row.total ?? 0);
    jumlahTransaksiHariIni += 1;
  }

  return ok({
    totalPenjualanHariIni,
    jumlahTransaksiHariIni,
    jumlahMenipis,
    jumlahHabis,
  });
}
