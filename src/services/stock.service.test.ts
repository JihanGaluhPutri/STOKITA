import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import {
  listStockInHistory,
  listStockMonitoring,
  listStockMovements,
  recordStockIn,
} from "@/services/stock.service";

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

const STOCK_IN_RESULT = {
  product_id: "p-1",
  stok_sebelum: 5,
  stok_sesudah: 15,
};

const STOCK_IN_ROW = {
  id: "m-1",
  tanggal: "2026-11-05T08:00:00+07:00",
  qty: "10",
  referensi: "PO-1",
  catatan: "dari supplier",
  products: { kode: "BRG-1", nama: "Kopi" },
  profiles: { nama: "Admin" },
};

const STOCK_IN_ROW_KOSONG = {
  id: "m-2",
  tanggal: "2026-11-04T07:00:00+07:00",
  qty: 5,
  referensi: 123,
  catatan: null,
  products: null,
  profiles: null,
};

const MOVEMENT_ROW_IN = {
  id: "m-1",
  tanggal: "2026-11-05T08:00:00+07:00",
  tipe: "IN",
  qty: 10,
  referensi: "PO-1",
  catatan: "masuk",
  products: { kode: "BRG-1", nama: "Kopi" },
  profiles: { nama: "Admin" },
};

const MOVEMENT_ROW_OUT_LAIN = {
  id: "m-2",
  tanggal: "2026-11-05T09:00:00+07:00",
  tipe: "LAINNYA",
  qty: "2",
  referensi: null,
  catatan: 42,
  products: null,
  profiles: null,
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

describe("recordStockIn", () => {
  it("menolak product_id kosong (IN002)", async () => {
    const result = await recordStockIn({ product_id: "  ", qty: 1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("IN002");
    expect(result.error.message).toBe(MESSAGES.IN002);
    expect(result.error.field).toBe("product_id");
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("menolak qty tidak valid (IN001) sebelum menyentuh database", async () => {
    signedInAdmin();

    const result = await recordStockIn({ product_id: "p-1", qty: -3 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INTEGER");
    expect(result.error.message).toBe(MESSAGES.IN001);
    expect(result.error.field).toBe("qty");
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("menolak tanpa sesi (AU001)", async () => {
    const result = await recordStockIn({ product_id: "p-1", qty: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(result.error.message).toBe(MESSAGES.AU001);
  });

  it("menolak role selain admin (AC001)", async () => {
    signedInKasir();

    const result = await recordStockIn({ product_id: "p-1", qty: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Service mereduksi semua kecuali AU001 menjadi AC001.
    expect(result.error.code).toBe("AC001");
    expect(result.error.message).toBe(MESSAGES.AC001);
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("mengirim referensi dan catatan kosong sebagai null", async () => {
    signedInAdmin();
    const fake = getFake();
    queueRpc("add_stock_in", { data: STOCK_IN_RESULT, error: null });

    const result = await recordStockIn({
      product_id: "p-1",
      qty: 10,
      referensi: "   ",
      catatan: null,
    });

    expect(result.ok).toBe(true);
    expect(fake.findCalls("add_stock_in")[0].args[0]).toEqual({
      p_product_id: "p-1",
      p_qty: 10,
      p_referensi: null,
      p_catatan: null,
    });
  });

  it("memotong referensi dan catatan yang terisi sebelum dikirim", async () => {
    signedInAdmin();
    const fake = getFake();
    queueRpc("add_stock_in", { data: STOCK_IN_RESULT, error: null });

    const result = await recordStockIn({
      product_id: " p-1 ",
      qty: "10",
      referensi: "  PO-1  ",
      catatan: " catatan ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.stok_sesudah).toBe(15);
    expect(fake.findCalls("add_stock_in")[0].args[0]).toEqual({
      p_product_id: "p-1",
      p_qty: 10,
      p_referensi: "PO-1",
      p_catatan: "catatan",
    });
  });

  it("meneruskan error fungsi DB sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    queueRpc("add_stock_in", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await recordStockIn({ product_id: "p-1", qty: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("42501");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });

  it("menolak bila fungsi DB tidak mengembalikan baris (GENERIC)", async () => {
    signedInAdmin();
    queueRpc("add_stock_in", { data: null, error: null });

    const result = await recordStockIn({ product_id: "p-1", qty: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("GENERIC");
    expect(result.error.message).toBe(MESSAGES.GENERIC);
  });
});

describe("listStockMonitoring", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await listStockMonitoring();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(getFake().findCalls(/^products\./)).toHaveLength(0);
  });

  it("menolak role selain admin (ACCESS)", async () => {
    signedInKasir();

    const result = await listStockMonitoring();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ACCESS");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });

  it("hanya menampilkan barang HABIS/MENIPIS sesuai urutan stok terendah", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("products", {
      data: [
        { id: "p-1", kode: "A", nama: "Habis", stok: 0, stok_min: 5 },
        { id: "p-2", kode: "B", nama: "Menipis", stok: 3, stok_min: 5 },
        // Stok aman harus dilewati oleh filter baris.
        { id: "p-3", kode: "C", nama: "Aman", stok: 50, stok_min: 5 },
        // Stok sama dengan minimum tetap dihitung menipis.
        { id: "p-4", kode: "D", nama: "Pas", stok: 5, stok_min: 5 },
      ],
      error: null,
    });

    const result = await listStockMonitoring();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.id)).toEqual(["p-1", "p-2", "p-4"]);
    expect(result.data.map((item) => item.status)).toEqual([
      "HABIS",
      "MENIPIS",
      "MENIPIS",
    ]);
    expect(result.data[1]).toEqual({
      id: "p-2",
      kode: "B",
      nama: "Menipis",
      stok: 3,
      stokMin: 5,
      status: "MENIPIS",
    });
    expect(fake.findCalls(/^products\.eq$/)[0].args).toEqual(["aktif", true]);
    expect(fake.findCalls(/^products\.order$/)[0].args).toEqual([
      "stok",
      { ascending: true },
    ]);
  });

  it("meneruskan error database sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await listStockMonitoring();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("42501");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });
});

describe("listStockInHistory", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await listStockInHistory();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("menolak role selain admin (ACCESS)", async () => {
    signedInKasir();

    const result = await listStockInHistory();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ACCESS");
  });

  it("memetakan baris barang masuk termasuk fallback produk dan pembuat", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("stock_movements", {
      data: [STOCK_IN_ROW, STOCK_IN_ROW_KOSONG],
      error: null,
    });

    const result = await listStockInHistory();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([
      {
        id: "m-1",
        tanggal: "2026-11-05T08:00:00+07:00",
        qty: 10,
        referensi: "PO-1",
        catatan: "dari supplier",
        productKode: "BRG-1",
        productNama: "Kopi",
        pembuatNama: "Admin",
      },
      {
        id: "m-2",
        tanggal: "2026-11-04T07:00:00+07:00",
        qty: 5,
        // referensi non-string dipetakan null, bukan dipaksa jadi teks.
        referensi: null,
        catatan: null,
        productKode: "-",
        productNama: "-",
        pembuatNama: "-",
      },
    ]);
    expect(fake.findCalls(/^stock_movements\.eq$/)[0].args).toEqual([
      "tipe",
      "IN",
    ]);
    expect(fake.findCalls(/^stock_movements\.limit$/)[0].args).toEqual([100]);
  });

  it("meneruskan error database sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("stock_movements", {
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    const result = await listStockInHistory();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("23505");
    expect(result.error.message).toBe(MESSAGES.DUPLICATE);
  });
});

describe("listStockMovements", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await listStockMovements();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("memetakan baris pergerakan stok termasuk tipe dan fallback", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("stock_movements", {
      data: [MOVEMENT_ROW_IN, MOVEMENT_ROW_OUT_LAIN],
      error: null,
    });

    const result = await listStockMovements();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([
      {
        id: "m-1",
        tanggal: "2026-11-05T08:00:00+07:00",
        tipe: "IN",
        qty: 10,
        referensi: "PO-1",
        catatan: "masuk",
        productKode: "BRG-1",
        productNama: "Kopi",
        pembuatNama: "Admin",
      },
      {
        id: "m-2",
        tanggal: "2026-11-05T09:00:00+07:00",
        // Tipe di luar OUT selalu dipetakan aman ke IN.
        tipe: "IN",
        qty: 2,
        referensi: null,
        // catatan non-string dipetakan null.
        catatan: null,
        productKode: "-",
        productNama: "-",
        pembuatNama: "-",
      },
    ]);
    expect(fake.findCalls(/^stock_movements\.eq$/)).toHaveLength(0);
    expect(fake.findCalls(/^stock_movements\.order$/)[0].args).toEqual([
      "tanggal",
      { ascending: false },
    ]);
  });

  it("meneruskan error database sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("stock_movements", {
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
    });

    const result = await listStockMovements();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe(MESSAGES.AU001);
  });
});
