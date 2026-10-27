import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatNumberRupiah,
  formatRupiah,
} from "@/lib/business/format";

describe("formatRupiah", () => {
  it("memformat rupiah tanpa desimal", () => {
    const formatted = formatRupiah(15000);
    expect(formatted).toContain("15.000");
    expect(formatted.startsWith("Rp")).toBe(true);
  });

  it("nol rupiah tetap tampil dengan simbol", () => {
    const formatted = formatRupiah(0);
    expect(formatted).toContain("0");
    expect(formatted.startsWith("Rp")).toBe(true);
  });

  it("nilai besar mengelompokkan ribuan", () => {
    expect(formatRupiah(1234567)).toContain("1.234.567");
  });
});

describe("formatNumberRupiah", () => {
  it("menghilangkan simbol Rp untuk kolom tabel yang sempit", () => {
    const formatted = formatNumberRupiah(15000);
    expect(formatted).not.toContain("Rp");
    expect(formatted).toContain("15.000");
  });

  it("tetap mengelompokkan ribuan", () => {
    expect(formatNumberRupiah(1234567)).toContain("1.234.567");
  });
});

describe("formatDateTime", () => {
  it("menampilkan waktu Asia/Jakarta, bukan UTC", () => {
    const formatted = formatDateTime("2026-01-10T17:30:00Z");
    expect(formatted).toContain("2026");
    // 17:30Z = 00:30 WIB tanggal berikutnya.
    expect(formatted).toMatch(/00[.:]30/);
    expect(formatted).toContain("11");
  });

  it("menampilkan tanggal sesuai input bila sudah dalam WIB", () => {
    const formatted = formatDateTime("2026-01-10T10:00:00+07:00");
    expect(formatted).toContain("10");
    expect(formatted).toMatch(/10[.:]00/);
  });
});
