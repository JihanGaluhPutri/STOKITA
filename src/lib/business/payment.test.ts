import { describe, expect, it } from "vitest";

import {
  calculateChange,
  calculateSubtotal,
  calculateTotal,
  resolvePayment,
} from "@/lib/business/payment";

describe("calculateSubtotal", () => {
  it("menghitung harga × qty", () => {
    const result = calculateSubtotal(1000, 3);
    expect(result).toEqual({ ok: true, data: 3000 });
  });

  it("mengizinkan harga 0 (barang gratis)", () => {
    expect(calculateSubtotal(0, 5)).toEqual({ ok: true, data: 0 });
  });

  it("menolak harga negatif", () => {
    const result = calculateSubtotal(-1000, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CALC");
  });

  it("menolak qty 0 dan negatif", () => {
    for (const qty of [0, -2]) {
      const result = calculateSubtotal(1000, qty);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("CALC");
    }
  });

  it("menolak input bukan bilangan bulat aman", () => {
    expect(calculateSubtotal(1000.5, 1).ok).toBe(false);
    expect(calculateSubtotal(1000, 1.5).ok).toBe(false);
    expect(calculateSubtotal(Number.MAX_SAFE_INTEGER, 2).ok).toBe(false);
  });
});

describe("calculateTotal", () => {
  it("menjumlahkan beberapa baris", () => {
    const result = calculateTotal([
      { hargaSatuan: 1000, qty: 2 },
      { hargaSatuan: 500, qty: 1 },
    ]);
    expect(result).toEqual({ ok: true, data: 2500 });
  });

  it("mengembalikan 0 untuk keranjang kosong", () => {
    expect(calculateTotal([])).toEqual({ ok: true, data: 0 });
  });

  it("gagal lebih dulu pada baris yang tidak valid", () => {
    const result = calculateTotal([
      { hargaSatuan: 1000, qty: 1 },
      { hargaSatuan: 1000, qty: 0 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CALC");
  });

  it("gagal saat akumulasi total melebihi batas bilangan bulat aman", () => {
    const result = calculateTotal([
      { hargaSatuan: Number.MAX_SAFE_INTEGER, qty: 1 },
      { hargaSatuan: 1, qty: 1 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("OVERFLOW");
  });
});

describe("calculateChange", () => {
  it("menghitung kembalian bayar − total", () => {
    expect(calculateChange(10000, 7500)).toEqual({ ok: true, data: 2500 });
  });

  it("mengizinkan bayar pas dengan total (kembalian 0)", () => {
    expect(calculateChange(7500, 7500)).toEqual({ ok: true, data: 0 });
  });

  it("menolak bayar kurang dari total (PY003)", () => {
    const result = calculateChange(5000, 7500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PY003");
  });

  it("menolak bayar negatif dan bukan bilangan bulat (PY002)", () => {
    for (const bayar of [-1, 1000.5, Number.NaN]) {
      const result = calculateChange(bayar, 1000);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("PY002");
    }
  });
});

describe("resolvePayment", () => {
  it("NON_TUNAI memaksa bayar = total dan kembalian = 0", () => {
    const result = resolvePayment("NON_TUNAI", 7500, 999999);
    expect(result).toEqual({
      ok: true,
      data: { metodeBayar: "NON_TUNAI", bayar: 7500, kembalian: 0 },
    });
  });

  it("TUNAI dengan nominal valid menghitung kembalian", () => {
    const result = resolvePayment("TUNAI", 7500, 10000);
    expect(result).toEqual({
      ok: true,
      data: { metodeBayar: "TUNAI", bayar: 10000, kembalian: 2500 },
    });
  });

  it("TUNAI tanpa nominal gagal (PY002)", () => {
    for (const bayar of [null, undefined]) {
      const result = resolvePayment("TUNAI", 7500, bayar);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("PY002");
    }
  });

  it("TUNAI dengan bayar kurang gagal (PY003)", () => {
    const result = resolvePayment("TUNAI", 7500, 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PY003");
  });

  it("metode tidak dikenal ditolak (PY001)", () => {
    const result = resolvePayment("QRIS", 7500, 10000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PY001");
  });

  it("total tidak valid ditolak (CALC)", () => {
    const result = resolvePayment("NON_TUNAI", -1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CALC");
  });
});
