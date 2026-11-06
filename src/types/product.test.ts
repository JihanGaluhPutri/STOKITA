import { describe, expect, expectTypeOf, it } from "vitest";

import { mapProductRow, type Product, type ProductRow } from "@/types/product";

const ROW: ProductRow = {
  id: "p-1",
  kode: "BRG-001",
  nama: "Kopi Susu",
  harga_beli: 10000,
  harga_jual: 15000,
  stok: 10,
  stok_min: 2,
  aktif: true,
  created_at: "2026-11-01T00:00:00Z",
};

describe("mapProductRow", () => {
  it("mengubah baris snake_case database menjadi objek Product camelCase", () => {
    expect(mapProductRow(ROW)).toEqual({
      id: "p-1",
      kode: "BRG-001",
      nama: "Kopi Susu",
      hargaBeli: 10000,
      hargaJual: 15000,
      stok: 10,
      stokMin: 2,
      aktif: true,
      createdAt: "2026-11-01T00:00:00Z",
    });
  });

  it("memetakan setiap kolom sumber ke kunci Product yang benar", () => {
    const product = mapProductRow(ROW);

    expect(Object.keys(product).sort()).toEqual([
      "aktif",
      "createdAt",
      "hargaBeli",
      "hargaJual",
      "id",
      "kode",
      "nama",
      "stok",
      "stokMin",
    ]);
  });

  it("mengubah id non-string menjadi string", () => {
    const product = mapProductRow({ ...ROW, id: 42 });

    expect(product.id).toBe("42");
    expect(typeof product.id).toBe("string");
  });

  it("mengubah harga berupa string menjadi angka", () => {
    const product = mapProductRow({
      ...ROW,
      harga_beli: "9500",
      harga_jual: "12750",
    });

    expect(product.hargaBeli).toBe(9500);
    expect(product.hargaJual).toBe(12750);
  });

  it("mengubah stok dan stokMin berupa string menjadi angka", () => {
    const product = mapProductRow({ ...ROW, stok: "7", stok_min: "3" });

    expect(product.stok).toBe(7);
    expect(product.stokMin).toBe(3);
  });

  it("mempertahankan nilai boolean aktif", () => {
    expect(mapProductRow({ ...ROW, aktif: false }).aktif).toBe(false);
    expect(mapProductRow({ ...ROW, aktif: 0 }).aktif).toBe(false);
    expect(mapProductRow({ ...ROW, aktif: true }).aktif).toBe(true);
  });

  it("mengubah tanggal menjadi string ISO", () => {
    const product = mapProductRow({ ...ROW, created_at: 1767225600000 });

    expect(product.createdAt).toBe("1767225600000");
  });
});

describe("kontrak tipe Product", () => {
  it("Product memakai kunci camelCase bertipe sesuai", () => {
    expectTypeOf<Product["hargaBeli"]>().toEqualTypeOf<number>();
    expectTypeOf<Product["aktif"]>().toEqualTypeOf<boolean>();
    expectTypeOf<Product["createdAt"]>().toEqualTypeOf<string>();
    expectTypeOf<keyof Product>().toEqualTypeOf<
      | "id"
      | "kode"
      | "nama"
      | "hargaBeli"
      | "hargaJual"
      | "stok"
      | "stokMin"
      | "aktif"
      | "createdAt"
    >();
  });
});
