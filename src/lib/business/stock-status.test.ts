import { describe, expect, it } from "vitest";

import {
  STOCK_STATUS_LABEL,
  resolveStockStatus,
} from "@/lib/business/stock-status";

describe("resolveStockStatus", () => {
  it("stok 0 = HABIS", () => {
    expect(resolveStockStatus(0, 5)).toBe("HABIS");
  });

  it("stok negatif (data rusak) tetap dianggap HABIS", () => {
    expect(resolveStockStatus(-3, 5)).toBe("HABIS");
  });

  it("stok sama dengan stok minimum = MENIPIS", () => {
    expect(resolveStockStatus(3, 3)).toBe("MENIPIS");
  });

  it("stok di bawah stok minimum (masih > 0) = MENIPIS", () => {
    expect(resolveStockStatus(2, 5)).toBe("MENIPIS");
  });

  it("stok di atas stok minimum = AMAN", () => {
    expect(resolveStockStatus(4, 3)).toBe("AMAN");
  });

  it("stok minimum 0: stok apa pun yang > 0 = AMAN", () => {
    expect(resolveStockStatus(1, 0)).toBe("AMAN");
  });
});

describe("STOCK_STATUS_LABEL", () => {
  it("memetakan semua status ke label tampilan", () => {
    expect(STOCK_STATUS_LABEL).toEqual({
      HABIS: "Habis",
      MENIPIS: "Menipis",
      AMAN: "Aman",
    });
  });
});
