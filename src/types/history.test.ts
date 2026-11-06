import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  DashboardSummary,
  SaleDetail,
  SaleDetailItem,
  SalesHistoryItem,
  StockMovementItem,
} from "@/types/history";

describe("kontrak tipe DashboardSummary", () => {
  it("memuat empat angka ringkasan dasbor", () => {
    const summary: DashboardSummary = {
      totalPenjualanHariIni: 150000,
      jumlahTransaksiHariIni: 7,
      jumlahMenipis: 3,
      jumlahHabis: 1,
    };

    expect(Object.keys(summary).sort()).toEqual([
      "jumlahHabis",
      "jumlahMenipis",
      "jumlahTransaksiHariIni",
      "totalPenjualanHariIni",
    ]);
    expect(summary.totalPenjualanHariIni).toBeGreaterThanOrEqual(0);
    expect(summary.jumlahHabis).toBeGreaterThanOrEqual(0);
  });

  it("semua nilai berupa number", () => {
    expectTypeOf<DashboardSummary["totalPenjualanHariIni"]>().toEqualTypeOf<number>();
    expectTypeOf<DashboardSummary["jumlahTransaksiHariIni"]>().toEqualTypeOf<number>();
    expectTypeOf<DashboardSummary["jumlahMenipis"]>().toEqualTypeOf<number>();
    expectTypeOf<DashboardSummary["jumlahHabis"]>().toEqualTypeOf<number>();
  });
});

describe("kontrak tipe SalesHistoryItem", () => {
  it("memuat baris riwayat penjualan dengan metode bayar literal", () => {
    const item: SalesHistoryItem = {
      id: "s-1",
      noTransaksi: "TRX-001",
      tanggal: "2026-11-05T09:00:00Z",
      total: 30000,
      metodeBayar: "NON_TUNAI",
      kasirNama: "Kasir Satu",
    };

    expect(Object.keys(item).sort()).toEqual([
      "id",
      "kasirNama",
      "metodeBayar",
      "noTransaksi",
      "tanggal",
      "total",
    ]);
    expect(item.metodeBayar).toBe("NON_TUNAI");
  });

  it("metodeBayar hanya TUNAI atau NON_TUNAI", () => {
    expectTypeOf<SalesHistoryItem["metodeBayar"]>().toEqualTypeOf<
      "TUNAI" | "NON_TUNAI"
    >();
  });
});

describe("kontrak tipe SaleDetail", () => {
  const detailItem: SaleDetailItem = {
    productKode: "BRG-001",
    productNama: "Kopi Susu",
    qty: 2,
    hargaSatuan: 15000,
    subtotal: 30000,
  };

  it("memuat rincian tiap barang beserta subtotalnya", () => {
    expect(detailItem.subtotal).toBe(detailItem.qty * detailItem.hargaSatuan);
    expect(Object.keys(detailItem).sort()).toEqual([
      "hargaSatuan",
      "productKode",
      "productNama",
      "qty",
      "subtotal",
    ]);
  });

  it("memuat transaksi lengkap dengan pembayaran dan kembalian", () => {
    const detail: SaleDetail = {
      id: "s-1",
      noTransaksi: "TRX-001",
      tanggal: "2026-11-05T09:00:00Z",
      total: 30000,
      metodeBayar: "TUNAI",
      bayar: 50000,
      kembalian: 20000,
      kasirNama: "Kasir Satu",
      items: [detailItem],
    };

    expect(Object.keys(detail).sort()).toEqual([
      "bayar",
      "id",
      "items",
      "kasirNama",
      "kembalian",
      "metodeBayar",
      "noTransaksi",
      "tanggal",
      "total",
    ]);
    expect(detail.kembalian).toBe(detail.bayar - detail.total);
  });
});

describe("kontrak tipe StockMovementItem", () => {
  it("memuat pergerakan stok masuk dengan data produk dan pembuat", () => {
    const movement: StockMovementItem = {
      id: "m-1",
      tanggal: "2026-11-05T08:00:00Z",
      tipe: "IN",
      qty: 10,
      referensi: "PO-001",
      catatan: "Pembelian harian",
      productKode: "BRG-001",
      productNama: "Kopi Susu",
      pembuatNama: "Admin",
    };

    expect(movement.tipe).toBe("IN");
    expect(Object.keys(movement).sort()).toEqual([
      "catatan",
      "id",
      "pembuatNama",
      "productKode",
      "productNama",
      "qty",
      "referensi",
      "tanggal",
      "tipe",
    ]);
  });

  it("mengizinkan tipe OUT serta referensi/catatan null", () => {
    const keluar: StockMovementItem = {
      id: "m-2",
      tanggal: "2026-11-05T10:00:00Z",
      tipe: "OUT",
      qty: 2,
      referensi: null,
      catatan: null,
      productKode: "BRG-001",
      productNama: "Kopi Susu",
      pembuatNama: "Kasir Satu",
    };

    expect(keluar.tipe).toBe("OUT");
    expect(keluar.referensi).toBeNull();
    expectTypeOf(keluar.tipe).toEqualTypeOf<"IN" | "OUT">();
  });
});
