import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createProductAction,
  deleteProductAction,
  setProductStatusAction,
  updateProductAction,
} from "@/app/admin/barang/actions";
import { MESSAGES } from "@/lib/business/messages";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

const PRODUCT_ROW = {
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

function signedInAdmin() {
  getFake().signedInAs({
    id: "admin-1",
    nama: "Admin",
    username: "admin",
    role: "admin",
  });
}

function productForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("kode", "BRG-001");
  fd.set("nama", "Kopi Susu");
  fd.set("hargaBeli", "10000");
  fd.set("hargaJual", "15000");
  fd.set("stokAwal", "10");
  fd.set("stokMin", "2");
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

function boom(): never {
  throw new Error("database down");
}

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("createProductAction", () => {
  it("menyimpan barang baru sebagai admin lalu redirect dengan ok=created", async () => {
    signedInAdmin();
    getFake().table("products", { data: PRODUCT_ROW, error: null });

    const state = await createProductAction(null, productForm());

    expect(state).toBeUndefined();
    expect(redirect).toHaveBeenCalledWith("/admin/barang?ok=created");
    expect(getFake().findCalls("products.insert")).toHaveLength(1);
  });

  it("mengembalikan fieldErrors saat kode barang kosong (validasi gagal)", async () => {
    signedInAdmin();

    const state = await createProductAction(
      null,
      productForm({ kode: "" }),
    );

    expect(state).toEqual({
      fieldErrors: { kode: "Kode barang wajib diisi." },
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(getFake().findCalls("products.insert")).toHaveLength(0);
  });

  it("mengembalikan fieldErrors saat kode duplikat (23505)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", {
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    const state = await createProductAction(null, productForm());

    expect(state).toEqual({
      fieldErrors: { kode: MESSAGES.PRODUCT_KODE_DUPLICATE },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan error umum saat service menolak tanpa sesi (AU001)", async () => {
    const state = await createProductAction(null, productForm());

    expect(state).toEqual({ error: MESSAGES.AU001 });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan pesan fallback dan log saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", boom);

    const state = await createProductAction(null, productForm());

    expect(state).toEqual({
      error: "Gagal menyimpan barang. Silakan coba lagi.",
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:createProductAction]"),
    );
  });
});

describe("updateProductAction", () => {
  it("memperbarui barang lalu redirect dengan ok=updated", async () => {
    signedInAdmin();
    getFake().table("products", { data: PRODUCT_ROW, error: null });

    const state = await updateProductAction("p-1", null, productForm());

    expect(state).toBeUndefined();
    expect(redirect).toHaveBeenCalledWith("/admin/barang?ok=updated");
    expect(getFake().findCalls("products.update")).toHaveLength(1);
  });

  it("mengembalikan fieldErrors saat input edit tidak valid (hargaJual bukan angka)", async () => {
    signedInAdmin();

    const state = await updateProductAction(
      "p-1",
      null,
      productForm({ hargaJual: "bukan-angka" }),
    );

    expect(state).toEqual({
      fieldErrors: {
        hargaJual: "Harga jual harus berupa bilangan bulat tidak negatif.",
      },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan error barang tidak ditemukan tanpa redirect", async () => {
    signedInAdmin();
    getFake().table("products", { data: null, error: null });

    const state = await updateProductAction("p-404", null, productForm());

    expect(state).toEqual({ error: MESSAGES.PRODUCT_NOT_FOUND });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan pesan fallback dan log saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", boom);

    const state = await updateProductAction("p-1", null, productForm());

    expect(state).toEqual({
      error: "Gagal menyimpan perubahan. Silakan coba lagi.",
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:updateProductAction]"),
    );
  });
});

describe("setProductStatusAction", () => {
  it("mengaktifkan barang dan mengembalikan done=activated", async () => {
    signedInAdmin();
    getFake().table("products", { data: PRODUCT_ROW, error: null });

    const state = await setProductStatusAction("p-1", true, null, new FormData());

    expect(state).toEqual({ done: "activated" });
    expect(redirect).not.toHaveBeenCalled();
    expect(getFake().findCalls("products.update")[0].args).toEqual([
      { aktif: true },
    ]);
  });

  it("menonaktifkan barang dan mengembalikan done=deactivated", async () => {
    signedInAdmin();
    getFake().table("products", {
      data: { ...PRODUCT_ROW, aktif: false },
      error: null,
    });

    const state = await setProductStatusAction(
      "p-1",
      false,
      null,
      new FormData(),
    );

    expect(state).toEqual({ done: "deactivated" });
    expect(redirect).not.toHaveBeenCalled();
    expect(getFake().findCalls("products.update")[0].args).toEqual([
      { aktif: false },
    ]);
  });

  it("mengembalikan error dan errorCode saat service menolak (tanpa sesi)", async () => {
    const state = await setProductStatusAction("p-1", true, null, new FormData());

    expect(state).toEqual({ error: MESSAGES.AU001, errorCode: "AU001" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan pesan gagal mengaktifkan saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", boom);

    const state = await setProductStatusAction("p-1", true, null, new FormData());

    expect(state).toEqual({
      error: "Gagal mengaktifkan barang. Silakan coba lagi.",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:setProductStatusAction]"),
    );
  });

  it("mengembalikan pesan gagal menonaktifkan saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", boom);

    const state = await setProductStatusAction(
      "p-1",
      false,
      null,
      new FormData(),
    );

    expect(state).toEqual({
      error: "Gagal menonaktifkan barang. Silakan coba lagi.",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:setProductStatusAction]"),
    );
  });
});

describe("deleteProductAction", () => {
  it("menghapus barang permanen dan mengembalikan done=deleted", async () => {
    signedInAdmin();
    getFake().table("products", { data: null, error: null });

    const state = await deleteProductAction("p-1", null, new FormData());

    expect(state).toEqual({ done: "deleted" });
    expect(redirect).not.toHaveBeenCalled();
    expect(getFake().findCalls("products.delete")).toHaveLength(1);
  });

  it("mengembalikan error+errorCode FK saat barang memiliki riwayat (23503)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", {
      data: null,
      error: { code: "23503", message: "foreign key violation" },
    });

    const state = await deleteProductAction("p-1", null, new FormData());

    expect(state).toEqual({
      error: MESSAGES.FK_HISTORY,
      errorCode: "23503",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("mengembalikan pesan fallback dan log saat service melempar error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", boom);

    const state = await deleteProductAction("p-1", null, new FormData());

    expect(state).toEqual({
      error: "Gagal menghapus barang. Silakan coba lagi.",
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stokita:deleteProductAction]"),
    );
  });
});
