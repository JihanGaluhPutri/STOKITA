import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  setProductActive,
  updateProduct,
} from "@/services/product.service";
import type { ProductFormInput } from "@/lib/validation/product";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

const VALID_INPUT: ProductFormInput = {
  kode: "BRG-001",
  nama: "Kopi Susu",
  hargaBeli: 10000,
  hargaJual: 15000,
  stokAwal: 10,
  stokMin: 2,
};

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

beforeEach(() => {
  resetFake();
  vi.restoreAllMocks();
});

describe("listProducts", () => {
  it("mengembalikan daftar produk ter-mapping", async () => {
    getFake().table("products", { data: [PRODUCT_ROW], error: null });

    const result = await listProducts();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([
      {
        id: "p-1",
        kode: "BRG-001",
        nama: "Kopi Susu",
        hargaBeli: 10000,
        hargaJual: 15000,
        stok: 10,
        stokMin: 2,
        aktif: true,
        createdAt: "2026-11-01T00:00:00Z",
      },
    ]);
  });

  it("menerapkan pencarian aman (karakter wildcard dibersihkan)", async () => {
    const fake = getFake();
    fake.table("products", { data: [], error: null });

    await listProducts({ q: "%_,()\\kopi" });

    const orCall = fake.findCalls(/^products\.or$/)[0];
    expect(orCall).toBeDefined();
    const filter = String(orCall.args[0]);
    // Wildcard %...% ditambahkan PostgREST sendiri untuk ilike; yang wajib
    // hilang adalah karakter khusus milik user (pencegah eksploitasi filter).
    expect(filter).toBe("kode.ilike.%kopi%,nama.ilike.%kopi%");
    expect(filter).not.toContain("_");
    expect(filter).not.toContain("(");
    expect(filter).not.toContain("\\");
  });

  it("menerapkan filter aktifOnly bila diminta", async () => {
    const fake = getFake();
    fake.table("products", { data: [], error: null });

    await listProducts({ aktifOnly: true });

    expect(fake.findCalls("products.eq")).toHaveLength(1);
    expect(fake.findCalls("products.eq")[0].args).toEqual(["aktif", true]);
  });

  it("mengembalikan error ter-mapping saat query gagal", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getFake().table("products", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await listProducts();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("42501");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });
});

describe("getProductById", () => {
  it("mengembalikan produk yang ditemukan", async () => {
    getFake().table("products", { data: PRODUCT_ROW, error: null });

    const result = await getProductById("p-1");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.kode).toBe("BRG-001");
  });

  it("mengembalikan PRODUCT_NOT_FOUND bila baris tidak ada", async () => {
    getFake().table("products", { data: null, error: null });

    const result = await getProductById("tidak-ada");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PRODUCT_NOT_FOUND");
    expect(result.error.message).toBe(MESSAGES.PRODUCT_NOT_FOUND);
  });

  it("meneruskan error database sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getFake().table("products", {
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
    });

    const result = await getProductById("p-1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe(MESSAGES.AU001);
  });
});

describe("createProduct", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await createProduct(VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });

  it("menolak role selain admin", async () => {
    getFake().signedInAs({
      id: "kasir-1",
      nama: "Kasir",
      username: "kasir",
      role: "kasir",
    });

    const result = await createProduct(VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Service mereduksi semua kecuali AU001 menjadi ACCESS.
    expect(result.error.code).toBe("ACCESS");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });

  it("menolak input tidak valid sebelum menyentuh database", async () => {
    signedInAdmin();

    const result = await createProduct({ ...VALID_INPUT, kode: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("kode");
    expect(getFake().findCalls("products.insert")).toHaveLength(0);
  });

  it("menyimpan produk baru sebagai admin", async () => {
    signedInAdmin();
    getFake().table("products", { data: PRODUCT_ROW, error: null });

    const result = await createProduct(VALID_INPUT);

    expect(result.ok).toBe(true);
    const insert = getFake().findCalls("products.insert")[0];
    expect(insert).toBeDefined();
    expect(insert.args[0]).toMatchObject({
      kode: "BRG-001",
      nama: "Kopi Susu",
      harga_beli: 10000,
      harga_jual: 15000,
      stok: 10,
      stok_min: 2,
    });
  });

  it("menerjemahkan duplikat kode (23505) ke PRODUCT_KODE_DUPLICATE", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", {
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });

    const result = await createProduct(VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PRODUCT_KODE_DUPLICATE");
    expect(result.error.field).toBe("kode");
  });

  it("menerjemahkan error lain ke pesan bisnis umum", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", {
      data: null,
      error: { code: "22003", message: "numeric out of range" },
    });

    const result = await createProduct(VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe(MESSAGES.OVERFLOW);
  });
});

describe("updateProduct", () => {
  it("menolak id kosong", async () => {
    signedInAdmin();

    const result = await updateProduct("  ", VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("menolak input edit yang tidak valid", async () => {
    signedInAdmin();

    const result = await updateProduct("p-1", {
      ...VALID_INPUT,
      hargaJual: "bukan-angka",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("hargaJual");
  });

  it("memperbarui atribut barang tanpa kolom stok", async () => {
    signedInAdmin();
    getFake().table("products", { data: PRODUCT_ROW, error: null });

    const result = await updateProduct("p-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    const update = getFake().findCalls("products.update")[0];
    expect(update).toBeDefined();
    expect(update.args[0]).not.toHaveProperty("stok");
    expect(update.args[0]).toMatchObject({ kode: "BRG-001" });
  });

  it("mengembalikan PRODUCT_NOT_FOUND bila baris hilang", async () => {
    signedInAdmin();
    getFake().table("products", { data: null, error: null });

    const result = await updateProduct("p-1", VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("menolak role selain admin", async () => {
    getFake().signedInAs({
      id: "kasir-1",
      nama: "Kasir",
      username: "kasir",
      role: "kasir",
    });

    const result = await updateProduct("p-1", VALID_INPUT);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ACCESS");
  });
});

describe("setProductActive", () => {
  it("menonaktifkan barang (soft delete)", async () => {
    signedInAdmin();
    getFake().table("products", {
      data: { ...PRODUCT_ROW, aktif: false },
      error: null,
    });

    const result = await setProductActive("p-1", false);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.aktif).toBe(false);
    expect(getFake().findCalls("products.update")[0].args).toEqual([
      { aktif: false },
    ]);
  });

  it("mengembalikan error saat baris tidak ditemukan", async () => {
    signedInAdmin();
    getFake().table("products", { data: null, error: null });

    const result = await setProductActive("p-1", false);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("menolak tanpa sesi", async () => {
    const result = await setProductActive("p-1", false);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });
});

describe("deleteProduct", () => {
  it("menghapus permanen bila tidak ada riwayat", async () => {
    signedInAdmin();
    getFake().table("products", { data: null, error: null });

    const result = await deleteProduct("p-1");

    expect(result.ok).toBe(true);
    expect(getFake().findCalls("products.delete")).toHaveLength(1);
  });

  it("menolak bila barang memiliki riwayat (FK 23503)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", {
      data: null,
      error: { code: "23503", message: "foreign key violation" },
    });

    const result = await deleteProduct("p-1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe(MESSAGES.FK_HISTORY);
  });

  it("menolak tanpa sesi", async () => {
    const result = await deleteProduct("p-1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
  });
});
