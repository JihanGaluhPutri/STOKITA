import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * Klien service-role — HANYA untuk menyiapkan dan membersihkan data uji.
 * Seluruh perilaku aplikasi yang diuji tetap lewat UI + server action.
 */
export function apiAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}

export type BarangUji = {
  kode: string;
  nama: string;
  hargaJual: number;
  stok: number;
  stokMin: number;
  hargaBeli?: number;
};

/**
 * Menyiapkan barang uji secara idempoten (insert bila belum ada, selaraskan
 * bila sudah ada). Semua barang uji memakai awalan "E2E-" agar mudah dikenali
 * dan dibersihkan.
 */
export async function siapkanBarang(input: BarangUji): Promise<void> {
  const supabase = apiAdmin();
  const payload = {
    kode: input.kode,
    nama: input.nama,
    harga_beli: input.hargaBeli ?? Math.max(0, input.hargaJual - 1000),
    harga_jual: input.hargaJual,
    stok: input.stok,
    stok_min: input.stokMin,
    aktif: true,
  };

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("kode", input.kode)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("products").insert(payload);
    if (error) {
      throw new Error(`Gagal menyiapkan barang uji ${input.kode}: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", existing.id);
  if (error) {
    throw new Error(`Gagal menyelaraskan barang uji ${input.kode}: ${error.message}`);
  }
}

/**
 * Relasi `products` dari PostgREST bisa berupa objek atau array tergantung
 * inferensi cardinality — dinormalkan menjadi string kode.
 */
function kodeProduk(relation: unknown): string {
  if (Array.isArray(relation)) {
    const first = relation[0] as { kode?: unknown } | undefined;
    return typeof first?.kode === "string" ? first.kode : "";
  }
  const single = relation as { kode?: unknown } | null;
  return typeof single?.kode === "string" ? single.kode : "";
}

/**
 * Membersihkan barang uji beserta jejak transaksinya:
 * 1. penjualan yang HANYA memuat barang uji (dihapus — sale_items cascade),
 * 2. mutasi stok barang uji,
 * 3. baris barangnya.
 * Bila barang masih punya riwayat yang tidak bisa dihapus, ia dinonaktifkan
 * agar tidak mengganggu data produksi.
 */
export async function bersihkanBarangUji(kode: string): Promise<void> {
  const supabase = apiAdmin();

  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("kode", kode);

  for (const product of products ?? []) {
    const { data: rows } = await supabase
      .from("sale_items")
      .select("sale_id, products!inner(kode)")
      .eq("product_id", product.id);

    const saleIds = [...new Set((rows ?? []).map((row) => row.sale_id as string))];
    for (const saleId of saleIds) {
      const { data: allItems } = await supabase
        .from("sale_items")
        .select("products!inner(kode)")
        .eq("sale_id", saleId);
      const hanyaUji = (allItems ?? []).every((row) =>
        kodeProduk(row.products).startsWith("E2E-"),
      );
      if (hanyaUji) {
        await supabase.from("sales").delete().eq("id", saleId);
      }
    }

    await supabase.from("stock_movements").delete().eq("product_id", product.id);

    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      await supabase.from("products").update({ aktif: false }).eq("id", product.id);
    }
  }
}
