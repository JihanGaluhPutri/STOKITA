export type DashboardSummary = {
  totalPenjualanHariIni: number;
  jumlahTransaksiHariIni: number;
  jumlahMenipis: number;
  jumlahHabis: number;
};

export type SalesHistoryItem = {
  id: string;
  noTransaksi: string;
  tanggal: string;
  total: number;
  metodeBayar: "TUNAI" | "NON_TUNAI";
  kasirNama: string;
};

export type SaleDetailItem = {
  productKode: string;
  productNama: string;
  qty: number;
  hargaSatuan: number;
  subtotal: number;
};

export type SaleDetail = {
  id: string;
  noTransaksi: string;
  tanggal: string;
  total: number;
  metodeBayar: "TUNAI" | "NON_TUNAI";
  bayar: number;
  kembalian: number;
  kasirNama: string;
  items: SaleDetailItem[];
};

export type StockMovementItem = {
  id: string;
  tanggal: string;
  tipe: "IN" | "OUT";
  qty: number;
  referensi: string | null;
  catatan: string | null;
  productKode: string;
  productNama: string;
  pembuatNama: string;
};
