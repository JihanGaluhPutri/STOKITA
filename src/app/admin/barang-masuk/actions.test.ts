import { beforeEach, describe, expect, it, vi } from "vitest";

import { stockInAction } from "@/app/admin/barang-masuk/actions";
import { MESSAGES } from "@/lib/business/messages";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

/**
 * Mengatur respons RPC untuk satu nama fungsi.
 *
 * Catatan: `FakeSupabase` mendefinisikan `rpc()` dua kali — metode konfigurasi
 * (`this.rpcs.set`) tertimpa oleh `async rpc()` pemanggilan service, sehingga
 * `fake.rpc(nama, responder)` tidak benar-benar mengatur antrean respons.
 * Karena `src/test-utils/**` tidak boleh diubah, antrean internal `rpcs`
 * diset langsung dari sini (mekanisme yang sama dengan metode konfigurasi).
 */
function queueRpc(
  name: string,
  responder: { data: unknown; error: unknown } | (() => never),
): void {
  getFake().rpcResult(name, responder);
}

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

function stockInForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("productId", "p-1");
  fd.set("qty", "3");
  fd.set("referensi", "PO-001");
  fd.set("catatan", "Restock mingguan");
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

function boom(): never {
  throw new Error("koneksi putus");
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("stockInAction", () => {
  it("mencatat barang masuk dan mengembalikan ringkasan stok admin", async () => {
    signedInAdmin();
    queueRpc("add_stock_in", {
      data: { product_id: "p-1", stok_sebelum: 5, stok_sesudah: 8 },
      error: null,
    });

    const state = await stockInAction(null, stockInForm());

    expect(state).toEqual({
      success: { qty: 3, stokSebelum: 5, stokSesudah: 8 },
    });
    const call = getFake().findCalls("add_stock_in")[0];
    expect(call.args[0]).toEqual({
      p_product_id: "p-1",
      p_qty: 3,
      p_referensi: "PO-001",
      p_catatan: "Restock mingguan",
    });
  });

  it("mengirim referensi & catatan kosong sebagai null ke RPC", async () => {
    signedInAdmin();
    queueRpc("add_stock_in", {
      data: { product_id: "p-1", stok_sebelum: 1, stok_sesudah: 4 },
      error: null,
    });

    const state = await stockInAction(
      null,
      stockInForm({ referensi: "", catatan: "" }),
    );

    expect(state?.success).toBeDefined();
    const call = getFake().findCalls("add_stock_in")[0];
    expect(call.args[0]).toMatchObject({
      p_referensi: null,
      p_catatan: null,
    });
  });

  it("menolak qty tidak valid sebelum menyentuh RPC", async () => {
    signedInAdmin();

    const state = await stockInAction(null, stockInForm({ qty: "0" }));

    expect(state).toEqual({ error: MESSAGES.IN001 });
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("menolak productId kosong dengan pesan barang tidak ditemukan", async () => {
    signedInAdmin();

    const state = await stockInAction(null, stockInForm({ productId: "" }));

    expect(state).toEqual({ error: MESSAGES.IN002 });
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("mengembalikan AU001 saat tanpa sesi login", async () => {
    const state = await stockInAction(null, stockInForm());

    expect(state).toEqual({ error: MESSAGES.AU001 });
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("mengembalikan AC001 saat role bukan admin", async () => {
    getFake().signedInAs({
      id: "kasir-1",
      nama: "Kasir",
      username: "kasir",
      role: "kasir",
    });

    const state = await stockInAction(null, stockInForm());

    expect(state).toEqual({ error: MESSAGES.AC001 });
    expect(getFake().findCalls("add_stock_in")).toHaveLength(0);
  });

  it("mengembalikan pesan error database saat RPC menolak (IN002)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    queueRpc("add_stock_in", {
      data: null,
      error: { code: "IN002", message: "product not found" },
    });

    const state = await stockInAction(null, stockInForm());

    expect(state).toEqual({ error: MESSAGES.IN002 });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:recordStockIn]"),
    );
  });

  it("mengembalikan pesan fallback dan log saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    queueRpc("add_stock_in", boom);

    const state = await stockInAction(null, stockInForm());

    expect(state).toEqual({
      error: "Gagal mencatat barang masuk. Silakan coba lagi.",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:stockInAction]"),
    );
  });
});
