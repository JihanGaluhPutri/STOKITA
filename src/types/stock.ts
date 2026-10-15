export type StockInInput = {
  product_id: string;
  qty: number | string;
  referensi?: string | null;
  catatan?: string | null;
};

export type StockInResult = {
  product_id: string;
  stok_sebelum: number;
  stok_sesudah: number;
};

export type StockInHistoryItem = {
  id: string;
  tanggal: string;
  qty: number;
  referensi: string | null;
  catatan: string | null;
  productKode: string;
  productNama: string;
  pembuatNama: string;
};
