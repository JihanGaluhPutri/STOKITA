import { describe, expect, it } from "vitest";

import {
  BUSINESS_TIMEZONE,
  DATE_INVALID,
  DATE_RANGE_INVALID,
  getBusinessDayBounds,
  validateDateRange,
} from "@/lib/business/date-range";

describe("validateDateRange", () => {
  it("pola YYYY-MM-DD dibaca sebagai hari penuh Asia/Jakarta", () => {
    const result = validateDateRange("2026-01-10", "2026-01-12");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.tanggalAwal.getTime()).toBe(
      Date.parse("2026-01-10T00:00:00+07:00"),
    );
    expect(result.data.tanggalAkhir.getTime()).toBe(
      Date.parse("2026-01-12T23:59:59.999+07:00"),
    );
  });

  it("menerima tanggal awal = tanggal akhir (rentang sehari)", () => {
    const result = validateDateRange("2026-01-10", "2026-01-10");
    expect(result.ok).toBe(true);
  });

  it("menolak tanggal akhir sebelum tanggal awal", () => {
    const result = validateDateRange("2026-01-12", "2026-01-10");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(DATE_RANGE_INVALID);
  });

  it("menolak format tanggal tidak valid", () => {
    for (const [awal, akhir] of [
      ["2026-13-01", "2026-01-12"],
      ["2026-01-10", "32/01/2026"],
      ["", "2026-01-12"],
      ["bukan-tanggal", "2026-01-12"],
    ]) {
      const result = validateDateRange(awal, akhir);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(DATE_INVALID);
    }
  });

  it("menolak nilai selain string tanggal ISO dan Date", () => {
    expect(validateDateRange(null, "2026-01-12").ok).toBe(false);
    expect(validateDateRange("2026-01-10", 20260112).ok).toBe(false);
    expect(validateDateRange(new Date("invalid"), "2026-01-12").ok).toBe(false);
  });

  it("menerima objek Date yang valid", () => {
    const result = validateDateRange(
      new Date("2026-01-10T00:00:00+07:00"),
      new Date("2026-01-12T23:59:59.999+07:00"),
    );
    expect(result.ok).toBe(true);
  });
});

describe("getBusinessDayBounds", () => {
  it("zona waktu bisnis Asia/Jakarta", () => {
    expect(BUSINESS_TIMEZONE).toBe("Asia/Jakarta");
  });

  it("menghitung batas hari sesuai kalender Jakarta, bukan UTC", () => {
    // 17:30Z = 00:30 WIB keesokan hari → hari bisnis berganti.
    const bounds = getBusinessDayBounds(new Date("2026-01-10T17:30:00Z"));
    expect(bounds.startIso).toBe("2026-01-11T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-01-12T00:00:00+07:00");
  });

  it("sebelum tengah malam WIB hari yang sama masih terhitung hari itu", () => {
    // 16:59:59Z = 23:59:59 WIB → masih 10 Januari.
    const bounds = getBusinessDayBounds(new Date("2026-01-10T16:59:59Z"));
    expect(bounds.startIso).toBe("2026-01-10T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-01-11T00:00:00+07:00");
  });

  it("batas akhir hari inklusif menjadi batas eksklusif hari berikutnya", () => {
    const bounds = getBusinessDayBounds(new Date("2026-02-27T12:00:00Z"));
    expect(bounds.startIso).toBe("2026-02-27T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-02-28T00:00:00+07:00");
  });

  it("menangani akhir bulan (awal bulan berikutnya)", () => {
    const bounds = getBusinessDayBounds(new Date("2026-01-31T10:00:00Z"));
    expect(bounds.startIso).toBe("2026-01-31T00:00:00+07:00");
    expect(bounds.endExclusiveIso).toBe("2026-02-01T00:00:00+07:00");
  });
});
