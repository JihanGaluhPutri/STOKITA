export type Product = {
  id: string;
  kode: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMin: number;
  aktif: boolean;
  createdAt: string;
};

export type StockStatus = "HABIS" | "MENIPIS" | "AMAN";

export type ProductRow = Record<string, unknown>;

export function mapProductRow(row: ProductRow): Product {
  return {
    id: String(row.id),
    kode: String(row.kode),
    nama: String(row.nama),
    hargaBeli: Number(row.harga_beli),
    hargaJual: Number(row.harga_jual),
    stok: Number(row.stok),
    stokMin: Number(row.stok_min),
    aktif: Boolean(row.aktif),
    createdAt: String(row.created_at),
  };
}
