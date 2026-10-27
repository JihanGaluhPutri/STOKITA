import { describe, expect, it } from "vitest";

import {
  parseInteger,
  validateNonNegativeInteger,
  validatePositiveInteger,
} from "@/lib/business/quantity";

describe("parseInteger", () => {
  it("menerima bilangan bulat", () => {
    expect(parseInteger(4)).toBe(4);
    expect(parseInteger(-2)).toBe(-2);
  });

  it("menerima string bilangan bulat termasuk spasi di sekelilingnya", () => {
    expect(parseInteger("5")).toBe(5);
    expect(parseInteger("  7  ")).toBe(7);
    expect(parseInteger("-3")).toBe(-3);
  });

  it("menolak desimal", () => {
    expect(parseInteger(3.14)).toBeNull();
    expect(parseInteger("5.5")).toBeNull();
  });

  it("menolak string kosong, teks, dan campuran", () => {
    for (const value of ["", "   ", "abc", "12a", "1,000", "NaN", "Infinity"]) {
      expect(parseInteger(value)).toBeNull();
    }
  });

  it("menolak tipe selain number/string", () => {
    expect(parseInteger(null)).toBeNull();
    expect(parseInteger(undefined)).toBeNull();
    expect(parseInteger(true)).toBeNull();
    expect(parseInteger({})).toBeNull();
  });

  it("menolak bilangan bulat di luar batas aman", () => {
    expect(parseInteger("99999999999999999999")).toBeNull();
  });
});

describe("validatePositiveInteger", () => {
  it("menerima bilangan bulat lebih dari 0", () => {
    expect(validatePositiveInteger("3")).toEqual({ ok: true, data: 3 });
    expect(validatePositiveInteger(1)).toEqual({ ok: true, data: 1 });
  });

  it("menolak 0, negatif, dan input tidak valid", () => {
    for (const value of [0, "0", -1, "abc", 1.5]) {
      const result = validatePositiveInteger(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("INVALID_INTEGER");
    }
  });

  it("menggunakan pesan kustom bila diberikan", () => {
    const result = validatePositiveInteger(0, "Qty minimal 1.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe("Qty minimal 1.");
  });
});

describe("validateNonNegativeInteger", () => {
  it("menerima 0 dan bilangan bulat positif", () => {
    expect(validateNonNegativeInteger(0)).toEqual({ ok: true, data: 0 });
    expect(validateNonNegativeInteger("12")).toEqual({ ok: true, data: 12 });
  });

  it("menolak negatif dan input tidak valid", () => {
    for (const value of [-1, "-1", "abc", 2.5]) {
      const result = validateNonNegativeInteger(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("INVALID_INTEGER");
    }
  });
});
