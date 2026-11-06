import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import { mapSupabaseError, reportServiceError } from "@/services/errors";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("mapSupabaseError", () => {
  it("memetakan kode kustom fungsi langsung dari MESSAGES", () => {
    expect(mapSupabaseError({ code: "AU001", message: "jwt expired" })).toEqual({
      code: "AU001",
      message: MESSAGES.AU001,
    });
    expect(mapSupabaseError({ code: "ST001", message: "stok kurang" })).toEqual({
      code: "ST001",
      message: MESSAGES.ST001,
    });
    expect(mapSupabaseError({ code: "AC002", message: "dilarang" })).toEqual({
      code: "AC002",
      message: MESSAGES.AC002,
    });
  });

  it("mempertahankan pesan mentah database dari katalog pesan", () => {
    // Pesan mentah tidak dibawa ke pengguna; hanya kode dan teks bisnis.
    const mapped = mapSupabaseError({
      code: "CT001",
      message: "raw database text",
    });

    expect(mapped.message).toBe(MESSAGES.CT001);
    expect(mapped.message).not.toContain("raw database text");
  });

  it("menerjemahkan SQLSTATE 42501 ke pesan ACCESS", () => {
    const mapped = mapSupabaseError({
      code: "42501",
      message: "permission denied for table sales",
    });

    expect(mapped.code).toBe("42501");
    expect(mapped.message).toBe(MESSAGES.ACCESS);
  });

  it("menerjemahkan duplikat 23505 ke pesan DUPLICATE", () => {
    const mapped = mapSupabaseError({
      code: "23505",
      message: "duplicate key value violates unique constraint",
    });

    expect(mapped.code).toBe("23505");
    expect(mapped.message).toBe(MESSAGES.DUPLICATE);
  });

  it("menerjemahkan PGRST301 (JWT kedaluwarsa) ke AU001", () => {
    const mapped = mapSupabaseError({
      code: "PGRST301",
      message: "JWT expired",
    });

    expect(mapped.code).toBe("PGRST301");
    expect(mapped.message).toBe(MESSAGES.AU001);
  });

  it("mengembalikan UNKNOWN/GENERIC bila kode kosong", () => {
    expect(mapSupabaseError({ message: "tanpa kode" })).toEqual({
      code: "UNKNOWN",
      message: MESSAGES.GENERIC,
    });
    expect(mapSupabaseError({ code: "", message: "kosong" })).toEqual({
      code: "UNKNOWN",
      message: MESSAGES.GENERIC,
    });
  });

  it("mengembalikan UNKNOWN/GENERIC untuk error bukan objek", () => {
    expect(mapSupabaseError("meledak")).toEqual({
      code: "UNKNOWN",
      message: MESSAGES.GENERIC,
    });
    expect(mapSupabaseError(null)).toEqual({
      code: "UNKNOWN",
      message: MESSAGES.GENERIC,
    });
  });

  it("menerjemahkan SQLSTATE lain yang dikenal (23503, 22003, PGRST302)", () => {
    expect(mapSupabaseError({ code: "23503" }).message).toBe(MESSAGES.FK_HISTORY);
    expect(mapSupabaseError({ code: "22003" }).message).toBe(MESSAGES.OVERFLOW);
    expect(mapSupabaseError({ code: "PGRST302" }).message).toBe(MESSAGES.AU001);
  });
});

describe("reportServiceError", () => {
  it("mencatat konteks, kode, dan pesan error ke console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    reportServiceError("checkoutSale", {
      code: "ST001",
      message: "Stok barang tidak mencukupi",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "[stokita:checkoutSale] ST001: Stok barang tidak mencukupi",
    );
  });

  it("memakai kode UNKNOWN untuk error tanpa kode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    reportServiceError("listSalesHistory", new Error("koneksi putus"));

    expect(spy).toHaveBeenCalledWith(
      "[stokita:listSalesHistory] UNKNOWN: koneksi putus",
    );
  });

  it("memakai String() untuk error yang bukan objek", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    reportServiceError("getSaleDetail", "koneksi putus");

    expect(spy).toHaveBeenCalledWith(
      "[stokita:getSaleDetail] UNKNOWN: koneksi putus",
    );
  });
});
