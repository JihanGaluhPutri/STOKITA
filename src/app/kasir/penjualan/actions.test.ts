import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkoutAction } from "@/app/kasir/penjualan/actions";
import { MESSAGES } from "@/lib/business/messages";
import type { CheckoutResult } from "@/types/sale";

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

const RECEIPT: CheckoutResult = {
  sale_id: "s-1",
  no_transaksi: "TRX-20261106-001",
  total: 30000,
  metode_bayar: "TUNAI",
  bayar: 40000,
  kembalian: 10000,
  tanggal: "2026-11-06T10:00:00Z",
  items: [
    {
      product_id: "p-1",
      kode: "BRG-001",
      nama: "Kopi Susu",
      qty: 2,
      harga_satuan: 15000,
      subtotal: 30000,
    },
  ],
};

function signedInKasir() {
  getFake().signedInAs({
    id: "kasir-1",
    nama: "Kasir",
    username: "kasir",
    role: "kasir",
  });
}

function checkoutForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("items", JSON.stringify([{ product_id: "p-1", qty: 2 }]));
  fd.set("metodeBayar", "TUNAI");
  fd.set("bayar", "40000");
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

describe("checkoutAction", () => {
  it("memproses checkout kasir dan mengembalikan struk", async () => {
    signedInKasir();
    queueRpc("checkout_sale", { data: RECEIPT, error: null });

    const state = await checkoutAction(null, checkoutForm());

    expect(state).toEqual({ receipt: RECEIPT });
    const call = getFake().findCalls("checkout_sale")[0];
    expect(call.args[0]).toEqual({
      p_items: [{ product_id: "p-1", qty: 2 }],
      p_metode_bayar: "TUNAI",
      p_bayar: 40000,
    });
  });

  it("mengembalikan CT001 saat keranjang kosong", async () => {
    signedInKasir();

    const state = await checkoutAction(null, checkoutForm({ items: "" }));

    expect(state).toEqual({ error: MESSAGES.CT001 });
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("mengembalikan CT001 saat daftar items bukan JSON valid", async () => {
    signedInKasir();

    const state = await checkoutAction(
      null,
      checkoutForm({ items: "{tidak-valid" }),
    );

    expect(state).toEqual({ error: MESSAGES.CT001 });
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("mengembalikan CT002 saat qty tidak positif", async () => {
    signedInKasir();

    const state = await checkoutAction(
      null,
      checkoutForm({ items: JSON.stringify([{ product_id: "p-1", qty: 0 }]) }),
    );

    expect(state).toEqual({ error: MESSAGES.CT002 });
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("menolak metode pembayaran yang tidak dikenal (PY001)", async () => {
    signedInKasir();

    const state = await checkoutAction(
      null,
      checkoutForm({ metodeBayar: "QRIS" }),
    );

    expect(state).toEqual({ error: MESSAGES.PY001 });
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("mengembalikan AU001 saat tanpa sesi login", async () => {
    const state = await checkoutAction(null, checkoutForm());

    expect(state).toEqual({ error: MESSAGES.AU001 });
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("mengembalikan AC002 saat role bukan kasir", async () => {
    getFake().signedInAs({
      id: "admin-1",
      nama: "Admin",
      username: "admin",
      role: "admin",
    });

    const state = await checkoutAction(null, checkoutForm());

    expect(state).toEqual({ error: MESSAGES.AC002 });
    expect(getFake().findCalls("checkout_sale")).toHaveLength(0);
  });

  it("mengembalikan pesan stok kurang saat RPC menolak (ST001)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInKasir();
    queueRpc("checkout_sale", {
      data: null,
      error: { code: "ST001", message: "insufficient stock" },
    });

    const state = await checkoutAction(null, checkoutForm());

    expect(state).toEqual({ error: MESSAGES.ST001 });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:checkoutSale]"),
    );
  });

  it("mengembalikan pesan fallback dan log saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInKasir();
    queueRpc("checkout_sale", boom);

    const state = await checkoutAction(null, checkoutForm());

    expect(state).toEqual({
      error: "Gagal memproses transaksi. Silakan coba lagi.",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:checkoutAction]"),
    );
  });
});
