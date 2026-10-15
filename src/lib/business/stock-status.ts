import type { StockStatus } from "@/types/product";

/**
 * PB-BRG-01: logika status stok terpisah dari komponen tampilan.
 * Stok 0 = "Habis"; 0 < stok ≤ stok minimum = "Menipis"; selain itu aman.
 */
export function resolveStockStatus(stok: number, stokMin: number): StockStatus {
  if (stok <= 0) return "HABIS";
  if (stok <= stokMin) return "MENIPIS";
  return "AMAN";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  HABIS: "Habis",
  MENIPIS: "Menipis",
  AMAN: "Aman",
};
