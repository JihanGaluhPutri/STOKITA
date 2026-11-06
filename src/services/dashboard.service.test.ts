import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGES } from "@/lib/business/messages";
import { getDashboardSummary } from "@/services/dashboard.service";

vi.mock("@/lib/supabase/server", () =>
  import("@/test-utils/supabase-server-mock"),
);

const { getFake, resetFake } = await import("@/test-utils/supabase-server-mock");

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

describe("getDashboardSummary", () => {
  it("menolak tanpa sesi (AU001)", async () => {
    const result = await getDashboardSummary();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("AU001");
    expect(result.error.message).toBe(MESSAGES.AU001);
    expect(getFake().findCalls(/^products\./)).toHaveLength(0);
  });

  it("menolak role selain admin (ACCESS)", async () => {
    signedInKasir();

    const result = await getDashboardSummary();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ACCESS");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
  });

  it("mengembalikan error produk tanpa pernah menyentuh tabel sales", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    const fake = getFake();
    fake.table("products", {
      data: null,
      error: { code: "42501", message: "permission denied" },
    });
    fake.table("sales", { data: [], error: null });

    const result = await getDashboardSummary();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("42501");
    expect(result.error.message).toBe(MESSAGES.ACCESS);
    expect(fake.findCalls(/^sales\./)).toHaveLength(0);
  });

  it("mengembalikan error penjualan sebagai ServiceError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signedInAdmin();
    getFake().table("products", { data: [], error: null });
    getFake().table("sales", {
      data: null,
      error: { code: "PGRST301", message: "JWT expired" },
    });

    const result = await getDashboardSummary();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PGRST301");
    expect(result.error.message).toBe(MESSAGES.AU001);
  });

  it("menghitung menipis/habis dari produk dan total transaksi hari ini", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("products", {
      data: [
        { stok: 0, stok_min: 3 }, // habis + menipis
        { stok: 2, stok_min: 3 }, // menipis
        { stok: 3, stok_min: 3 }, // menipis (sama dengan minimum)
        { stok: 10, stok_min: 3 }, // aman — tidak dihitung
        { stok: 0, stok_min: 0 }, // habis + menipis
      ],
      error: null,
    });
    fake.table("sales", {
      data: [{ total: 1000 }, { total: "2000.5" }, { total: null }],
      error: null,
    });

    const result = await getDashboardSummary();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      totalPenjualanHariIni: 3000.5,
      jumlahTransaksiHariIni: 3,
      jumlahMenipis: 4,
      jumlahHabis: 2,
    });
    expect(fake.findCalls(/^products\.eq$/)[0].args).toEqual(["aktif", true]);
    // Penjualan dibatasi hari bisnis (zona Asia/Jakarta) lewat gte + lt.
    expect(fake.findCalls(/^sales\.gte$/)).toHaveLength(1);
    expect(fake.findCalls(/^sales\.gte$/)[0].args[0]).toBe("tanggal");
    expect(fake.findCalls(/^sales\.lt$/)).toHaveLength(1);
    expect(fake.findCalls(/^sales\.lt$/)[0].args[0]).toBe("tanggal");
  });

  it("mengembalikan nol untuk semua angka bila tidak ada data", async () => {
    signedInAdmin();
    const fake = getFake();
    fake.table("products", { data: [], error: null });
    fake.table("sales", { data: [], error: null });

    const result = await getDashboardSummary();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      totalPenjualanHariIni: 0,
      jumlahTransaksiHariIni: 0,
      jumlahMenipis: 0,
      jumlahHabis: 0,
    });
    expect(fake.findCalls(/^products\./)).toHaveLength(2);
  });
});
