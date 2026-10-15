import "server-only";

import { MESSAGES } from "@/lib/business/messages";
import { resolveStockStatus } from "@/lib/business/stock-status";
import { validatePositiveInteger } from "@/lib/business/quantity";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { ok, type Result } from "@/types/result";
import type { StockMovementItem } from "@/types/history";
import type {
  StockInHistoryItem,
  StockInInput,
  StockInResult,
} from "@/types/stock";
import { mapSupabaseError, reportServiceError } from "./errors";

/**
 * Mencatat barang masuk melalui fungsi PostgreSQL `add_stock_in`.
 * Perubahan stok tidak pernah dilakukan langsung oleh service ini.
 */
export async function recordStockIn(input: StockInInput): Promise<Result<StockInResult>> {
  const productId = typeof input?.product_id === "string" ? input.product_id.trim() : "";
  if (productId === "") {
    return {
      ok: false,
      error: { code: "IN002", message: MESSAGES.IN002, field: "product_id" },
    };
  }

  const qty = validatePositiveInteger(input.qty, MESSAGES.IN001);
  if (!qty.ok) {
    return { ok: false, error: { ...qty.error, field: "qty" } };
  }

  // Pemeriksaan role diulang di service (TB-11); fungsi DB tetap memverifikasi.
  const auth = await requireRole("admin");
  if (!auth.ok) {
    return {
      ok: false,
      error:
        auth.error.code === "AU001"
          ? auth.error
          : { code: "AC001", message: MESSAGES.AC001 },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_stock_in", {
    p_product_id: productId,
    p_qty: qty.data,
    p_referensi: typeof input.referensi === "string" && input.referensi.trim() !== ""
      ? input.referensi.trim()
      : null,
    p_catatan: typeof input.catatan === "string" && input.catatan.trim() !== ""
      ? input.catatan.trim()
      : null,
  });

  if (error) {
    reportServiceError("recordStockIn", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, error: { code: "GENERIC", message: MESSAGES.GENERIC } };
  }

  return { ok: true, data: data as StockInResult };
}

/**
 * TB-15: riwayat barang masuk (mutasi bertipe IN) terbaru, lengkap dengan
 * barang dan pembuat. Hanya admin; RLS juga membatasi ke admin.
 */
export async function listStockInHistory(): Promise<Result<StockInHistoryItem[]>> {
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
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id, tanggal, qty, referensi, catatan, products:products(kode, nama), profiles:profiles(nama)",
    )
    .eq("tipe", "IN")
    .order("tanggal", { ascending: false })
    .limit(100);

  if (error) {
    reportServiceError("listStockInHistory", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  const items: StockInHistoryItem[] = (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const product = row.products as { kode?: unknown; nama?: unknown } | null;
    const profile = row.profiles as { nama?: unknown } | null;
    return {
      id: String(row.id),
      tanggal: String(row.tanggal),
      qty: Number(row.qty),
      referensi: typeof row.referensi === "string" ? row.referensi : null,
      catatan: typeof row.catatan === "string" ? row.catatan : null,
      productKode: product?.kode != null ? String(product.kode) : "-",
      productNama: product?.nama != null ? String(product.nama) : "-",
      pembuatNama: profile?.nama != null ? String(profile.nama) : "-",
    };
  });

  return ok(items);
}

export type StockMonitoringItem = {
  id: string;
  kode: string;
  nama: string;
  stok: number;
  stokMin: number;
  status: "HABIS" | "MENIPIS";
};

/**
 * TB-21 / PB-STOK-02: barang aktif dengan stok kurang dari atau sama dengan
 * stok minimum (status Habis atau Menipis dari `resolveStockStatus`), diurutkan
 * dari stok terendah. Filter kolom-ke-kolom tidak didukung PostgREST, sehingga
 * pemilihan stok <= stok_min dilakukan pada baris hasil query. Hanya admin;
 * RLS juga membatasi ke admin.
 */
export async function listStockMonitoring(): Promise<Result<StockMonitoringItem[]>> {
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
  const { data, error } = await supabase
    .from("products")
    .select("id, kode, nama, stok, stok_min")
    .eq("aktif", true)
    .order("stok", { ascending: true });

  if (error) {
    reportServiceError("listStockMonitoring", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  const items: StockMonitoringItem[] = [];
  for (const raw of data ?? []) {
    const row = raw as Record<string, unknown>;
    const stok = Number(row.stok);
    const stokMin = Number(row.stok_min);
    const status = resolveStockStatus(stok, stokMin);
    if (status !== "HABIS" && status !== "MENIPIS") continue;
    items.push({
      id: String(row.id),
      kode: String(row.kode),
      nama: String(row.nama),
      stok,
      stokMin,
      status,
    });
  }

  return ok(items);
}

/**
 * TB-23 / PB-RWY-01: seluruh pergerakan stok (IN dari barang masuk dan OUT
 * dari penjualan) dibaca dari stock_movements — bukan disusun ulang dari UI.
 * Tidak menyediakan aksi perubahan. Hanya admin; RLS juga membatasi.
 */
export async function listStockMovements(): Promise<Result<StockMovementItem[]>> {
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
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id, tanggal, tipe, qty, referensi, catatan, products:products(kode, nama), profiles:profiles(nama)",
    )
    .order("tanggal", { ascending: false })
    .limit(100);

  if (error) {
    reportServiceError("listStockMovements", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  const items: StockMovementItem[] = (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const product = row.products as { kode?: unknown; nama?: unknown } | null;
    const profile = row.profiles as { nama?: unknown } | null;
    return {
      id: String(row.id),
      tanggal: String(row.tanggal),
      tipe: row.tipe === "OUT" ? "OUT" : "IN",
      qty: Number(row.qty),
      referensi: typeof row.referensi === "string" ? row.referensi : null,
      catatan: typeof row.catatan === "string" ? row.catatan : null,
      productKode: product?.kode != null ? String(product.kode) : "-",
      productNama: product?.nama != null ? String(product.nama) : "-",
      pembuatNama: profile?.nama != null ? String(profile.nama) : "-",
    };
  });

  return ok(items);
}
