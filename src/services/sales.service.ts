import "server-only";

import { MESSAGES } from "@/lib/business/messages";
import { parseInteger, validatePositiveInteger } from "@/lib/business/quantity";
import { validateDateRange } from "@/lib/business/date-range";
import { requireRole } from "@/lib/auth/require-role";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { fail, type Result } from "@/types/result";
import type {
  SaleDetail,
  SaleDetailItem,
  SalesHistoryItem,
} from "@/types/history";
import type {
  CheckoutInput,
  CheckoutItemInput,
  CheckoutResult,
} from "@/types/sale";
import { mapSupabaseError, reportServiceError } from "./errors";

/**
 * Memproses checkout melalui fungsi PostgreSQL `checkout_sale`.
 * Harga, stok, total, dan nominal pembayaran terakhir diverifikasi di database.
 */
export async function checkoutSale(input: CheckoutInput): Promise<Result<CheckoutResult>> {
  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    return {
      ok: false,
      error: { code: "CT001", message: MESSAGES.CT001, field: "items" },
    };
  }

  const items: CheckoutItemInput[] = [];
  for (const item of input.items) {
    const productId = typeof item?.product_id === "string" ? item.product_id.trim() : "";
    if (productId === "") {
      return {
        ok: false,
        error: { code: "CT003", message: MESSAGES.CT003, field: "items" },
      };
    }

    const qty = validatePositiveInteger(item?.qty, MESSAGES.CT002);
    if (!qty.ok) {
      return { ok: false, error: { ...qty.error, field: "qty" } };
    }

    items.push({ product_id: productId, qty: qty.data });
  }

  const metodeBayar = input.metodeBayar;
  if (metodeBayar !== "TUNAI" && metodeBayar !== "NON_TUNAI") {
    return {
      ok: false,
      error: { code: "PY001", message: MESSAGES.PY001, field: "metodeBayar" },
    };
  }

  // Pemeriksaan role diulang di service (TB-11); fungsi DB tetap memverifikasi.
  const auth = await requireRole("kasir");
  if (!auth.ok) {
    return {
      ok: false,
      error:
        auth.error.code === "AU001"
          ? auth.error
          : { code: "AC002", message: MESSAGES.AC002 },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkout_sale", {
    p_items: items,
    p_metode_bayar: metodeBayar,
    p_bayar: parseInteger(input.bayar),
  });

  if (error) {
    reportServiceError("checkoutSale", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, error: { code: "GENERIC", message: MESSAGES.GENERIC } };
  }

  return { ok: true, data: data as CheckoutResult };
}

export type SalesHistoryFilter = {
  tanggalAwal?: string;
  tanggalAkhir?: string;
};

/**
 * TB-22 / PB-RWY-02: riwayat penjualan sesuai role — Admin Gudang melihat
 * transaksi seluruh kasir, Kasir hanya miliknya. Pembatasan diterapkan pada
 * query server (`eq kasir_id`) dan diperkuat RLS (sales_select_own/admin),
 * bukan hanya pada tampilan. Filter tanggal divalidasi ulang di server
 * (PB-RWY-03) dengan batas hari penuh zona waktu bisnis.
 */
export async function listSalesHistory(
  filter: SalesHistoryFilter = {},
): Promise<Result<SalesHistoryItem[]>> {
  const auth = await requireUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const profile = auth.data;

  const awal = typeof filter.tanggalAwal === "string" ? filter.tanggalAwal.trim() : "";
  const akhir = typeof filter.tanggalAkhir === "string" ? filter.tanggalAkhir.trim() : "";

  let tanggalAwalIso: string | null = null;
  let tanggalAkhirIso: string | null = null;
  if (awal !== "" || akhir !== "") {
    if (awal === "" || akhir === "") {
      return {
        ok: false,
        error: { code: "DATE_FILTER_INCOMPLETE", message: MESSAGES.DATE_FILTER_INCOMPLETE },
      };
    }
    const range = validateDateRange(awal, akhir);
    if (!range.ok) {
      return { ok: false, error: range.error };
    }
    tanggalAwalIso = range.data.tanggalAwal.toISOString();
    tanggalAkhirIso = range.data.tanggalAkhir.toISOString();
  }

  const supabase = await createClient();
  let query = supabase
    .from("sales")
    .select("id, no_transaksi, tanggal, total, metode_bayar, profiles:profiles(nama)")
    .order("tanggal", { ascending: false })
    .limit(100);

  if (profile.role !== "admin") {
    query = query.eq("kasir_id", profile.id);
  }
  if (tanggalAwalIso !== null) {
    query = query.gte("tanggal", tanggalAwalIso);
  }
  if (tanggalAkhirIso !== null) {
    query = query.lte("tanggal", tanggalAkhirIso);
  }

  const { data, error } = await query;
  if (error) {
    reportServiceError("listSalesHistory", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  const items: SalesHistoryItem[] = (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const profileRow = row.profiles as { nama?: unknown } | null;
    return {
      id: String(row.id),
      noTransaksi: String(row.no_transaksi),
      tanggal: String(row.tanggal),
      total: Number(row.total),
      metodeBayar: row.metode_bayar === "NON_TUNAI" ? "NON_TUNAI" : "TUNAI",
      kasirNama: profileRow?.nama != null ? String(profileRow.nama) : "-",
    };
  });

  return { ok: true, data: items };
}

/**
 * TB-22 / PB-RWY-02: detail transaksi sesuai role. Admin dapat membuka
 * transaksi mana pun; Kasir hanya miliknya (eq kasir_id + RLS). Transaksi
 * yang tidak ditemukan atau tidak berhak dipetakan ke pesan yang sama.
 */
export async function getSaleDetail(id: string): Promise<Result<SaleDetail>> {
  const auth = await requireUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }
  const profile = auth.data;

  if (typeof id !== "string" || id.trim() === "") {
    return fail({ code: "SALE_NOT_FOUND", message: MESSAGES.SALE_NOT_FOUND });
  }

  const supabase = await createClient();
  let query = supabase
    .from("sales")
    .select(
      "id, no_transaksi, tanggal, total, metode_bayar, bayar, kembalian, kasir_id, profiles:profiles(nama), sale_items(qty, harga_satuan, subtotal, products:products(kode, nama))",
    )
    .eq("id", id);

  if (profile.role !== "admin") {
    query = query.eq("kasir_id", profile.id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    reportServiceError("getSaleDetail", error);
    return { ok: false, error: mapSupabaseError(error) };
  }
  if (!data) {
    return fail({ code: "SALE_NOT_FOUND", message: MESSAGES.SALE_NOT_FOUND });
  }

  const row = data as Record<string, unknown>;
  const profileRow = row.profiles as { nama?: unknown } | null;
  const items: SaleDetailItem[] = ((row.sale_items ?? []) as Array<Record<string, unknown>>).map(
    (item) => {
      const product = item.products as { kode?: unknown; nama?: unknown } | null;
      return {
        productKode: product?.kode != null ? String(product.kode) : "-",
        productNama: product?.nama != null ? String(product.nama) : "-",
        qty: Number(item.qty),
        hargaSatuan: Number(item.harga_satuan),
        subtotal: Number(item.subtotal),
      };
    },
  );

  return {
    ok: true,
    data: {
      id: String(row.id),
      noTransaksi: String(row.no_transaksi),
      tanggal: String(row.tanggal),
      total: Number(row.total),
      metodeBayar: row.metode_bayar === "NON_TUNAI" ? "NON_TUNAI" : "TUNAI",
      bayar: Number(row.bayar),
      kembalian: Number(row.kembalian),
      kasirNama: profileRow?.nama != null ? String(profileRow.nama) : "-",
      items,
    },
  };
}
