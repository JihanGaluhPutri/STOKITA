import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  CheckoutInput,
  CheckoutResult,
  CheckoutResultItem,
  PaymentMethod,
} from "@/types/sale";

describe("kontrak tipe PaymentMethod", () => {
  it("hanya mengizinkan TUNAI atau NON_TUNAI", () => {
    expectTypeOf<PaymentMethod>().toEqualTypeOf<"TUNAI" | "NON_TUNAI">();
  });

  it("nilai runtime sesuai dengan literal yang diizinkan", () => {
    const metode: PaymentMethod[] = ["TUNAI", "NON_TUNAI"];

    expect(metode).toEqual(["TUNAI", "NON_TUNAI"]);
    expect(metode.every((m) => m === "TUNAI" || m === "NON_TUNAI")).toBe(true);
  });
});

describe("kontrak tipe CheckoutInput", () => {
  it("menerima item dan metode pembayaran", () => {
    const input: CheckoutInput = {
      items: [{ product_id: "p-1", qty: 2 }],
      metodeBayar: "TUNAI",
    };

    expect(input.items).toHaveLength(1);
    expect(input.items[0]).toEqual({ product_id: "p-1", qty: 2 });
  });

  it("membuat bayar opsional dan longgar tipenya (divalidasi layanan)", () => {
    const tunai: CheckoutInput = {
      items: [],
      metodeBayar: "TUNAI",
      bayar: 50000,
    };
    const nonTunai: CheckoutInput = {
      items: [],
      metodeBayar: "NON_TUNAI",
      bayar: null,
    };

    expect(tunai.bayar).toBe(50000);
    expect(nonTunai.bayar).toBeNull();
    expectTypeOf<CheckoutInput["metodeBayar"]>().toEqualTypeOf<unknown>();
    expectTypeOf<CheckoutInput["bayar"]>().toEqualTypeOf<
      number | string | null | undefined
    >();
  });
});

describe("kontrak tipe CheckoutResult", () => {
  const item: CheckoutResultItem = {
    product_id: "p-1",
    kode: "BRG-001",
    nama: "Kopi Susu",
    qty: 2,
    harga_satuan: 15000,
    subtotal: 30000,
  };

  it("membawa rincian item dengan harga dan subtotal", () => {
    expect(item.subtotal).toBe(item.qty * item.harga_satuan);
    expect(Object.keys(item).sort()).toEqual([
      "harga_satuan",
      "kode",
      "nama",
      "product_id",
      "qty",
      "subtotal",
    ]);
  });

  it("membawa ringkasan transaksi lengkap", () => {
    const result: CheckoutResult = {
      sale_id: "s-1",
      no_transaksi: "TRX-001",
      total: 30000,
      metode_bayar: "TUNAI",
      bayar: 50000,
      kembalian: 20000,
      tanggal: "2026-11-05T09:00:00Z",
      items: [item],
    };

    expect(Object.keys(result).sort()).toEqual([
      "bayar",
      "items",
      "kembalian",
      "metode_bayar",
      "no_transaksi",
      "sale_id",
      "tanggal",
      "total",
    ]);
    expect(result.kembalian).toBe(result.bayar - result.total);
    expect(result.metode_bayar).toBe("TUNAI");
  });

  it("metode_bayar bertipe PaymentMethod", () => {
    expectTypeOf<CheckoutResult["metode_bayar"]>().toEqualTypeOf<PaymentMethod>();
    expectTypeOf<CheckoutResult["items"]>().toEqualTypeOf<
      CheckoutResultItem[]
    >();
  });
});
