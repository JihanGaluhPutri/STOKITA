export type PaymentMethod = "TUNAI" | "NON_TUNAI";

export type CheckoutItemInput = {
  product_id: string;
  qty: number;
};

export type CheckoutInput = {
  items: CheckoutItemInput[];
  metodeBayar: unknown;
  bayar?: number | string | null;
};

export type CheckoutResultItem = {
  product_id: string;
  kode: string;
  nama: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
};

export type CheckoutResult = {
  sale_id: string;
  no_transaksi: string;
  total: number;
  metode_bayar: PaymentMethod;
  bayar: number;
  kembalian: number;
  tanggal: string;
  items: CheckoutResultItem[];
};
