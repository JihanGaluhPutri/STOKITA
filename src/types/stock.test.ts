import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  StockInHistoryItem,
  StockInInput,
  StockInResult,
} from "@/types/stock";

describe("kontrak tipe StockInInput", () => {
  it("menerima input barang masuk lengkap", () => {
    const input: StockInInput = {
      product_id: "p-1",
      qty: 5,
      referensi: "PO-001",
      catatan: "Pembelian harian",
    };

    expect(input).toEqual({
      product_id: "p-1",
      qty: 5,
      referensi: "PO-001",
      catatan: "Pembelian harian",
    });
  });

  it("membuat referensi dan catatan opsional", () => {
    const input: StockInInput = { product_id: "p-1", qty: "3" };

    expect(input).toEqual({ product_id: "p-1", qty: "3" });
    expect(input).not.toHaveProperty("referensi");
    expect(input).not.toHaveProperty("catatan");
  });

  it("mengizinkan qty berupa number atau string", () => {
    expectTypeOf<StockInInput["qty"]>().toEqualTypeOf<number | string>();
    expectTypeOf<StockInInput["referensi"]>().toEqualTypeOf<
      string | null | undefined
    >();
  });
});

describe("kontrak tipe StockInResult", () => {
  it("memuat id produk serta stok sebelum dan sesudah", () => {
    const result: StockInResult = {
      product_id: "p-1",
      stok_sebelum: 8,
      stok_sesudah: 13,
    };

    expect(Object.keys(result).sort()).toEqual([
      "product_id",
      "stok_sebelum",
      "stok_sesudah",
    ]);
    expect(result.stok_sesudah - result.stok_sebelum).toBe(5);
  });

  it("semua angka stok bertipe number", () => {
    expectTypeOf<StockInResult["stok_sebelum"]>().toEqualTypeOf<number>();
    expectTypeOf<StockInResult["stok_sesudah"]>().toEqualTypeOf<number>();
  });
});

describe("kontrak tipe StockInHistoryItem", () => {
  const item: StockInHistoryItem = {
    id: "h-1",
    tanggal: "2026-11-05T08:00:00Z",
    qty: 10,
    referensi: "PO-001",
    catatan: "Pembelian harian",
    productKode: "BRG-001",
    productNama: "Kopi Susu",
    pembuatNama: "Admin",
  };

  it("memuat data produk dan pembuat pada satu baris riwayat", () => {
    expect(Object.keys(item).sort()).toEqual([
      "catatan",
      "id",
      "pembuatNama",
      "productKode",
      "productNama",
      "qty",
      "referensi",
      "tanggal",
    ]);
  });

  it("mengizinkan referensi dan catatan bernilai null", () => {
    const tanpaCatatan: StockInHistoryItem = {
      ...item,
      referensi: null,
      catatan: null,
    };

    expect(tanpaCatatan.referensi).toBeNull();
    expect(tanpaCatatan.catatan).toBeNull();
    expectTypeOf(tanpaCatatan.referensi).toEqualTypeOf<string | null>();
  });
});
