import "server-only";

import { MESSAGES } from "@/lib/business/messages";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
  validateProductInput,
  validateProductUpdateInput,
  type ProductFormInput,
} from "@/lib/validation/product";
import type { Product } from "@/types/product";
import { mapProductRow, type ProductRow } from "@/types/product";
import { fail, ok, type Result } from "@/types/result";
import type { ServiceError } from "@/types/result";
import { mapSupabaseError, reportServiceError } from "./errors";

const PRODUCT_COLUMNS =
  "id, kode, nama, harga_beli, harga_jual, stok, stok_min, aktif, created_at";

function sanitizeSearchTerm(q: string): string {
  return q.replace(/[%_,()\\]/g, " ").trim();
}

export type ListProductsOptions = {
  q?: string;
  aktifOnly?: boolean;
};

/**
 * TB-12: daftar barang untuk halaman admin (semua status) dan pencarian
 * berbasis kode/nama. Otorisasi halaman ada di layout; RLS tetap berlaku.
 */
export async function listProducts(
  options: ListProductsOptions = {},
): Promise<Result<Product[]>> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("kode", { ascending: true });

  const q = typeof options.q === "string" ? sanitizeSearchTerm(options.q) : "";
  if (q !== "") {
    query = query.or(`kode.ilike.%${q}%,nama.ilike.%${q}%`);
  }
  if (options.aktifOnly) {
    query = query.eq("aktif", true);
  }

  const { data, error } = await query;
  if (error) {
    reportServiceError("listProducts", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  return ok(((data ?? []) as ProductRow[]).map(mapProductRow));
}

export async function getProductById(id: string): Promise<Result<Product>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    reportServiceError("getProductById", error);
    return { ok: false, error: mapSupabaseError(error) };
  }
  if (!data) {
    return fail({
      code: "PRODUCT_NOT_FOUND",
      message: MESSAGES.PRODUCT_NOT_FOUND,
    });
  }

  return ok(mapProductRow(data as ProductRow));
}

function mapDuplicateKode(error: unknown): ServiceError | null {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  if (code === "23505") {
    return {
      code: "PRODUCT_KODE_DUPLICATE",
      message: MESSAGES.PRODUCT_KODE_DUPLICATE,
      field: "kode",
    };
  }
  return null;
}

/**
 * PB-BRG-02: menambah barang sebagai admin. Stok awal disimpan saat insert
 * (kolom stok tidak dapat diubah lewat UPDATE — lihat migrasi 003).
 */
export async function createProduct(
  input: ProductFormInput,
): Promise<Result<Product>> {
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

  const validated = validateProductInput(input);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      kode: validated.data.kode,
      nama: validated.data.nama,
      harga_beli: validated.data.hargaBeli,
      harga_jual: validated.data.hargaJual,
      stok: validated.data.stokAwal,
      stok_min: validated.data.stokMin,
    })
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    reportServiceError("createProduct", error);
    const duplicate = mapDuplicateKode(error);
    if (duplicate) return { ok: false, error: duplicate };
    return { ok: false, error: mapSupabaseError(error) };
  }

  return ok(mapProductRow(data as ProductRow));
}

/**
 * PB-BRG-03: mengubah atribut barang (tanpa stok). Kode duplikat ditolak.
 */
export async function updateProduct(
  id: string,
  input: ProductFormInput,
): Promise<Result<Product>> {
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

  if (typeof id !== "string" || id.trim() === "") {
    return fail({
      code: "PRODUCT_NOT_FOUND",
      message: MESSAGES.PRODUCT_NOT_FOUND,
    });
  }

  const validated = validateProductUpdateInput(input);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      kode: validated.data.kode,
      nama: validated.data.nama,
      harga_beli: validated.data.hargaBeli,
      harga_jual: validated.data.hargaJual,
    })
    .eq("id", id)
    .select(PRODUCT_COLUMNS)
    .maybeSingle();

  if (error) {
    reportServiceError("updateProduct", error);
    const duplicate = mapDuplicateKode(error);
    if (duplicate) return { ok: false, error: duplicate };
    return { ok: false, error: mapSupabaseError(error) };
  }
  if (!data) {
    return fail({
      code: "PRODUCT_NOT_FOUND",
      message: MESSAGES.PRODUCT_NOT_FOUND,
    });
  }

  return ok(mapProductRow(data as ProductRow));
}

/**
 * PB-BRG-04: menonaktifkan barang tanpa menghapus riwayat (soft delete).
 */
export async function setProductActive(
  id: string,
  aktif: boolean,
): Promise<Result<Product>> {
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
    .update({ aktif })
    .eq("id", id)
    .select(PRODUCT_COLUMNS)
    .maybeSingle();

  if (error) {
    reportServiceError("setProductActive", error);
    return { ok: false, error: mapSupabaseError(error) };
  }
  if (!data) {
    return fail({
      code: "PRODUCT_NOT_FOUND",
      message: MESSAGES.PRODUCT_NOT_FOUND,
    });
  }

  return ok(mapProductRow(data as ProductRow));
}

/**
 * PB-BRG-04: penghapusan permanen hanya berhasil bila barang tidak punya
 * riwayat; jika punya, database menolak (FK restrict) dan dipetakan ke
 * pesan "Barang memiliki riwayat dan tidak dapat dihapus permanen."
 * Alur normal aplikasi menggunakan setProductActive(false).
 */
export async function deleteProduct(id: string): Promise<Result<void>> {
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
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    reportServiceError("deleteProduct", error);
    return { ok: false, error: mapSupabaseError(error) };
  }

  return ok(undefined);
}
