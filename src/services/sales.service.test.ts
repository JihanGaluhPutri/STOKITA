import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import {
  checkoutSale,
  getSaleDetail,
  listSalesHistory,
} from "@/services/sales.service";
import type { CheckoutInput } from "@/types/sale";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

/**
 * Mengatur respons RPC untuk satu nama fungsi.
 *
 * Catatan: versi lama FakeSupabase pernah mendefinisikan `rpc()` dua kali
 * (konfigurasi vs pemanggilan). Bug itu sudah diperbaiki — konfigurasi resmi
 * kini bernama `rpcResult()`. Helper ini memakai jalur tersebut agar tidak
 * bergantung pada akses field internal.
 */
function queueRpc(
  name: string,
  responder: { data: unknown; error: unknown },
): void {
  getFake().rpcResult(name, responder);
}

const VALID_CHECKOUT: CheckoutInput = {
  items: [{ product_id: "p-1", qty: 2 }],
  metodeBayar: "TUNAI",
  bayar: 50000,
};

const CHECKOUT_RESULT = {
  sale_id: "s-1",
  no_transaksi: "TRX-001",
  total: 30000,
  metode_bayar: "TUNAI",
  bayar: 50000,
  kembalian: 20000,
  tanggal: "2026-11-05T10:00:00+07:00",
  items: [],
};

const SALE_ROW = {
  id: "s-1",
  no_transaksi: "TRX-001",
  tanggal: "2026-11-05T10:00:00+07:00",
  total: "25000.5",
  metode_bayar: "NON_TUNAI",
  profiles: { nama: "Budi" },
};

const SALE_ROW_TANPA_PROFILES = {
  id: "s-2",
  no_transaksi: "TRX-002",
  tanggal: "2026-11-04T09:00:00+07:00",
  total: 10000,
  metode_bayar: "QRIS",
  profiles: null,
};

const SALE_DETAIL_ROW = {
  id: "s-1",
  no_transaksi: "TRX-001",
  tanggal: "2026-11-05T10:00:00+07:00",
  total: 30000,
  metode_bayar: "NON_TUNAI",
  bayar: 50000,
  kembalian: 20000,
  kasir_id: "kasir-1",
  profiles: null,
  sale_items: [
    { qty: 2, harga_satuan: 15000, subtotal: 30000, products: null },
    {
      qty: 1,
      harga_satuan: "5000",
      subtotal: "5000",
      products: { kode: "BRG-9", nama: "Teh" },
    },
  ],
};

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

function signedInKasir() {
  getFake().signedInAs({
    id: "kasir-1",
    nama: "Budi",
    username: "budi",
    role: "kasir",
  });
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("checkoutSale", () => {
  it("menolak keranjang kosong (CT001)", async () => {
    const result = await checkoutSale({
      items: [],
      metodeBayar: "TUNAI",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("CT001");
    expect(result.error.message).toBe(MESSAGES.CT001);
    expect(result.error.field).toBe("items");
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("menolak product_id kosong (CT003)", async () => {
    const result = await checkoutSale({
      items: [{ product_id: "   ", qty: 1 }],
      metodeBayar: "TUNAI",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("CT003");
    expect(result.error.message).toBe(MESSAGES.CT003);
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("menolak qty tidak valid (CT002) sebelum menyentuh database", async () => {
    signedInKasir();

    const result = await checkoutSale({
      items: [{ product_id: "p-1", qty: 0 }],
      metodeBayar: "TUNAI",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INTEGER");
    expect(result.error.message).toBe(MESSAGES.CT002);
    expect(result.error.field).toBe("qty");
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("menolak metode bayar di luar TUNAI/NON_TUNAI (PY001)", async () => {
    signedInKasir();

    const result = await checkoutSale({
      items: [{ product_id: "p-1", qty: 1 }],
      metodeBayar: "QRIS",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PY001");
    expect(result.error.message).toBe(MESSAGES.PY001);
    expect(result.error.field).toBe("metodeBayar");
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("menolak tanpa sesi (AU001)", async () => {
    const result = await checkoutSale(VALID_CHECKOUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(result.error.message).toBe(MESSAGES.AU001);
  });

  it("menolak role selain kasir (AC002)", async () => {
    signedInAdmin();

    const result = await checkoutSale(VALID_CHECKOUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Service mereduksi semua kecuali AU001 menjadi AC002.
    expect(result.error.code).toBe("AC002");
    expect(result.error.message).toBe(MESSAGES.AC002);
  });

  it("meneruskan error fungsi DB sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInKasir();
    queueRpc("checkout_sale", {
      data: null,
      error: { code: "ST001", message: "stok kurang" },
    });

    const result = await checkoutSale(VALID_CHECKOUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ST001");
    expect(result.error.message).toBe(MESSAGES.ST001);
  });

  it("menolak bila fungsi DB tidak mengembalikan baris (GENERIC)", async () => {
    signedInKasir();
    queueRpc("checkout_sale", { data: null, error: null });

    const result = await checkoutSale(VALID_CHECKOUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("GENERIC");
    expect(result.error.message).toBe(MESSAGES.GENERIC);
  });

  it("memproses checkout kasir dan meneruskan argumen ke RPC", async () => {
    signedInKasir();
    const fake = getFake();
    queueRpc("checkout_sale", { data: CHECKOUT_RESULT, error: null });

    const result = await checkoutSale({
      items: [
        { product_id: " p-1 ", qty: 2 },
        { product_id: "p-2", qty: 1 },
      ],
      metodeBayar: "NON_TUNAI",
      bayar: "50000",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.no_transaksi).toBe("TRX-001");
    const rpcCall = fake.findCalls("checkout_sale")[0];
    expect(rpcCall.args[0]).toEqual({
      p_items: [
        { product_id: "p-1", qty: 2 },
        { product_id: "p-2", qty: 1 },
      ],
      p_metode_bayar: "NON_TUNAI",
      p_bayar: 50000,
    });
  });
});

describe("listSalesHistory", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await listSalesHistory();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(getFake().findCalls(/^sales\./)).toHaveLength(0);
  });

  it("menolak filter tanggal yang hanya terisi salah satu sisi", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("sales", { data: [], error: null });

    const tanpaAkhir = await listSalesHistory({ tanggalAwal: "2026-01-01" });
    const tanpaAwal = await listSalesHistory({ tanggalAkhir: "2026-01-31" });

    for (const result of [tanpaAkhir, tanpaAwal]) {
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("DATE_FILTER_INCOMPLETE");
      expect(result.error.message).toBe(MESSAGES.DATE_FILTER_INCOMPLETE);
    }
    expect(fake.findCalls(/^sales\./)).toHaveLength(0);
  });

  it("menolak rentang tanggal terbalik (DATE_RANGE_INVALID)", async () => {
    signedInAdmin();
    getFake().table("sales", { data: [], error: null });

    const result = await listSalesHistory({
      tanggalAwal: "2026-02-01",
      tanggalAkhir: "2026-01-01",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("DATE_RANGE_INVALID");
    expect(getFake().findCalls(/^sales\./)).toHaveLength(0);
  });

  it("menerapkan rentang tanggal penuh zona waktu bisnis", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("sales", { data: [], error: null });

    const result = await listSalesHistory({
      tanggalAwal: "2026-01-01",
      tanggalAkhir: "2026-01-31",
    });

    expect(result.ok).toBe(true);
    // Hari penuh Asia/Jakarta dikonversi ke UTC oleh query.
    expect(fake.findCalls(/^sales\.gte$/)[0].args).toEqual([
      "tanggal",
      "2025-12-31T17:00:00.000Z",
    ]);
    expect(fake.findCalls(/^sales\.lte$/)[0].args).toEqual([
      "tanggal",
      "2026-01-31T16:59:59.999Z",
    ]);
  });

  it("admin melihat seluruh transaksi tanpa pembatas kasir_id", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("sales", { data: [], error: null });

    const result = await listSalesHistory();

    expect(result.ok).toBe(true);
    expect(fake.findCalls(/^sales\.eq$/)).toHaveLength(0);
    expect(fake.findCalls(/^sales\.order$/)[0].args).toEqual([
      "tanggal",
      { ascending: false },
    ]);
    expect(fake.findCalls(/^sales\.limit$/)[0].args).toEqual([100]);
  });

  it("kasir dibatasi ke transaksinya sendiri (eq kasir_id)", async () => {
    signedInKasir();
    const fake = getFake();
    fake.table("sales", { data: [], error: null });

    const result = await listSalesHistory();

    expect(result.ok).toBe(true);
    const eqCalls = fake.findCalls(/^sales\.eq$/);
    expect(eqCalls).toHaveLength(1);
    expect(eqCalls[0].args).toEqual(["kasir_id", "kasir-1"]);
  });

  it("memetakan baris riwayat termasuk fallback kasirNama dan metode bayar", async () => {
    signedInAdmin();
    getFake().table("sales", {
      data: [SALE_ROW, SALE_ROW_TANPA_PROFILES],
      error: null,
    });

    const result = await listSalesHistory();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([
      {
        id: "s-1",
        noTransaksi: "TRX-001",
        tanggal: "2026-11-05T10:00:00+07:00",
        total: 25000.5,
        metodeBayar: "NON_TUNAI",
        kasirNama: "Budi",
      },
      {
        id: "s-2",
        noTransaksi: "TRX-002",
        tanggal: "2026-11-04T09:00:00+07:00",
        total: 10000,
        // Metode di luar NON_TUNAI selalu dipetakan aman ke TUNAI.
        metodeBayar: "TUNAI",
        kasirNama: "-",
      },
    ]);
  });

  it("meneruskan error database sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("sales", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await listSalesHistory();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("42501");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });
});

describe("getSaleDetail", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await getSaleDetail("s-1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("menolak id kosong (SALE_NOT_FOUND) tanpa query", async () => {
    signedInKasir();
    const fake = getFake();
    fake.table("sales", { data: SALE_DETAIL_ROW, error: null });

    const result = await getSaleDetail("   ");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("SALE_NOT_FOUND");
    expect(result.error.message).toBe(MESSAGES.SALE_NOT_FOUND);
    expect(fake.findCalls(/^sales\./)).toHaveLength(0);
  });

  it("mengembalikan SALE_NOT_FOUND bila baris tidak ada", async () => {
    signedInAdmin();
    getFake().table("sales", { data: null, error: null });

    const result = await getSaleDetail("tidak-ada");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("SALE_NOT_FOUND");
  });

  it("kasir hanya dapat membuka transaksinya sendiri (eq kasir_id)", async () => {
    signedInKasir();
    const fake = getFake();
    fake.table("sales", { data: SALE_DETAIL_ROW, error: null });

    const result = await getSaleDetail("s-1");

    expect(result.ok).toBe(true);
    const eqCalls = fake.findCalls(/^sales\.eq$/);
    expect(eqCalls).toHaveLength(2);
    expect(eqCalls[1].args).toEqual(["kasir_id", "kasir-1"]);
  });

  it("memetakan detail transaksi termasuk item dan fallback produk '-'", async () => {
    signedInAdmin();
    getFake().table("sales", { data: SALE_DETAIL_ROW, error: null });

    const result = await getSaleDetail("s-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      id: "s-1",
      noTransaksi: "TRX-001",
      tanggal: "2026-11-05T10:00:00+07:00",
      total: 30000,
      metodeBayar: "NON_TUNAI",
      bayar: 50000,
      kembalian: 20000,
      kasirNama: "-",
      items: [
        {
          productKode: "-",
          productNama: "-",
          qty: 2,
          hargaSatuan: 15000,
          subtotal: 30000,
        },
        {
          productKode: "BRG-9",
          productNama: "Teh",
          qty: 1,
          hargaSatuan: 5000,
          subtotal: 5000,
        },
      ],
    });
  });

  it("mengembalikan daftar item kosong bila sale_items null", async () => {
    signedInAdmin();
    getFake().table("sales", {
      data: { ...SALE_DETAIL_ROW, sale_items: null },
      error: null,
    });

    const result = await getSaleDetail("s-1");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.items).toEqual([]);
  });

  it("meneruskan error database sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("sales", {
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
    });

    const result = await getSaleDetail("s-1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe(MESSAGES.AU001);
  });
});
